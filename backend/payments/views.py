from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models as django_models, transaction
from decimal import Decimal

from bookings.models import Booking, BookingPayment
from .models import PaymentTransaction, PaymentInvoice
from .campay import initiate_collection, get_transaction_status
from .serializers import *


# ==================== Guest/Owner: View Payment Details ====================
class BookingPaymentDetailView(generics.RetrieveAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_url_kwarg = 'booking_id'

    def get_queryset(self):
        return BookingPayment.objects.select_related('booking', 'booking__car', 'invoice')

    def get_object(self):
        return get_object_or_404(
            self.get_queryset(),
            booking__id=self.kwargs['booking_id']
        )

    def retrieve(self, request, *args, **kwargs):
        payment = self.get_object()
        booking = payment.booking

        if request.user not in (booking.guest, booking.owner) and not request.user.is_staff:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)

        return super().retrieve(request, *args, **kwargs)

class InitiateCamPayPaymentView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = CamPayInitiateSerializer

    def post(self, request, booking_id):
        booking = get_object_or_404(
            Booking.objects.select_related('car'),
            id=booking_id,
            guest=request.user,
            status='confirmed'
        )
        serializer = CamPayInitiateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        phone = serializer.validated_data.get('phone', request.user.phone_number)

        payment, created = BookingPayment.objects.get_or_create(
            booking=booking,
            defaults={
                'amount': booking.total_price,
                'status': 'pending',
                'customer_phone': phone,
                'payment_method': 'campay',
            }
        )

        if not created and payment.status != 'pending':
            return Response(
                {"detail": "Payment is no longer pending."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if payment.customer_phone != phone:
            payment.customer_phone = phone
            payment.save()

        external_ref = f"booking_{booking.id}"

        try:
            response = initiate_collection(
                amount=str(int(booking.total_price)),
                phone=payment.customer_phone,
                description=f"Rental: {booking.car.title} ({booking.start_date} - {booking.end_date})",
                external_ref=external_ref,
            )

            payment.campay_reference = response['reference']
            payment.transaction_id = external_ref
            payment.save()

            PaymentTransaction.objects.create(
                booking_payment=payment,
                transaction_type='booking',
                amount=payment.amount,
                status='pending',
                external_transaction_id=response['reference']
            )

            return Response({
                "detail": "Payment initiated. Complete on your phone.",
                "campay_reference": response['reference'],
                "check_status_url": request.build_absolute_uri(
                    f"/api/payments/booking/{booking_id}/check-status/"
                )
            })

        except Exception as e:
            return Response(
                {"detail": f"Failed to initiate payment: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckCamPayStatusView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        payment = get_object_or_404(
            BookingPayment,
            booking__id=booking_id,
            booking__in=Booking.objects.filter(
                models.Q(guest=request.user) | models.Q(car__owner=request.user)
            )
       )

        if not payment.campay_reference:
            return Response(
                {"detail": "No active CamPay transaction."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            status_data = get_transaction_status(payment.campay_reference)
            campay_status = status_data.get('status', '').upper()

            mapping = {
                "SUCCESSFUL": "completed",
                "FAILED": "failed",
            }
            new_status = mapping.get(campay_status, "pending")

            if payment.status != new_status:
                with transaction.atomic():
                    payment.status = new_status
                    payment.save()

                    PaymentTransaction.objects.create(
                        booking_payment=payment,
                        transaction_type='booking',
                        amount=payment.amount if new_status == 'completed' else Decimal('0'),
                        status=new_status,
                        external_transaction_id=payment.campay_reference
                    )

            return Response({
                "status": payment.status,
                "campay_status": campay_status,
                "reference": payment.campay_reference,
            })

        except Exception as e:
            return Response(
                {"detail": f"Status check failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class PaymentStatusUpdateView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PaymentStatusUpdateSerializer

    def post(self, request, booking_id):  # Better as POST than PUT/PATCH
        payment = get_object_or_404(BookingPayment, booking__id=booking_id)
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        new_status = serializer.validated_data['status']
        external_id = serializer.validated_data.get('external_transaction_id', '')
        notes = serializer.validated_data.get('notes', '')

        if payment.status == new_status:
            return Response({"detail": "Status already set."})

        with transaction.atomic():
            old_status = payment.status
            payment.status = new_status
            payment.save()

            PaymentTransaction.objects.create(
                booking_payment=payment,
                transaction_type='status_update',
                amount=Decimal('0'),
                status=new_status,
                external_transaction_id=external_id or payment.campay_reference or '',
                notes=notes or f"Manual update from {old_status} to {new_status}"
            )

        return Response({
            "detail": "Payment status updated successfully.",
            "new_status": new_status
        })

class PaymentRefundView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = RefundSerializer

    def post(self, request, booking_id):
        payment = get_object_or_404(BookingPayment, booking__id=booking_id, status='completed')
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        reason = serializer.validated_data.get('reason', 'Refund requested by admin')
        refund_amount = serializer.validated_data.get('amount')

        if refund_amount is None:
            refund_amount = payment.amount
        elif refund_amount > payment.amount:
            return Response({"detail": "Refund amount cannot exceed paid amount."}, 
                            status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            payment.status = 'refunded' if refund_amount == payment.amount else 'partially_refunded'
            payment.save()

            PaymentTransaction.objects.create(
                booking_payment=payment,
                transaction_type='refund',
                amount=-refund_amount,
                status='completed',
                notes=reason,
                external_transaction_id=payment.campay_reference or '',
            )

        # TODO: Call CamPay refund API with amount

        return Response({
            "detail": "Refund processed successfully.",
            "refunded_amount": float(refund_amount),
            "new_status": payment.status
        })

class PaymentListView(generics.ListAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return BookingPayment.objects.select_related(
            'booking', 'booking__car', 'booking__guest', 'booking__owner'
        ).order_by('-created_at')


# ==================== Admin: Platform Analytics ====================
class PaymentAnalyticsView(generics.GenericAPIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        completed = BookingPayment.objects.filter(status='completed')
        total_revenue = completed.aggregate(
            total=django_models.Sum('amount')
        )['total'] or Decimal('0')

        platform_commission = total_revenue * Decimal('0.10')
        owner_earnings = total_revenue * Decimal('0.90')

        return Response({
            "total_transactions": completed.count(),
            "total_revenue": float(total_revenue),
            "platform_commission_10%": float(platform_commission),
            "owner_payouts": float(owner_earnings),
            "currency": "XAF",
        })


# payments/views.py - Update the OwnerPaymentsListView
class OwnerPaymentsListView(generics.ListAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Only return COMPLETED payments for earnings display
        return BookingPayment.objects.filter(
            booking__car__owner=self.request.user,
            status='completed'  # Only show actual paid transactions
        ).select_related('booking', 'booking__car').order_by('-created_at')


# ==================== Owner: View Earnings ====================
class OwnerEarningsView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        completed = BookingPayment.objects.filter(
            booking__car__owner=request.user,
            status='completed'
        )
        total = completed.aggregate(
            total=django_models.Sum('amount')
        )['total'] or Decimal('0')

        owner_share = total * Decimal('0.90')

        return Response({
            "total_earnings": float(owner_share),
            "available_balance": float(owner_share),  # Extend with Payout model later
            "currency": "XAF",
        })
    

class GuestPaymentsListView(generics.ListAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return BookingPayment.objects.filter(
            booking__guest=self.request.user,
            status='completed'  
        ).select_related('booking', 'booking__car').order_by('-created_at')  