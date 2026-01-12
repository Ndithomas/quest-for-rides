from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models as django_models, transaction
from userAuth.permissions import IsManagement
from decimal import Decimal
from django.utils import timezone

from bookings.models import Booking, BookingPayment
from userAuth.models import User
from .models import PaymentTransaction, PaymentInvoice, PlatformCommission, Payout
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

                    if new_status == 'completed' and not hasattr(payment, 'commission'):
                        platform_amount = payment.amount * Decimal('0.10')
                        owner_payout = payment.amount * Decimal('0.90')
                        PlatformCommission.objects.create(
                            booking_payment=payment,
                            platform_amount=platform_amount,
                            owner_payout=owner_payout
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
    permission_classes = [IsManagement]
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

            if new_status == 'completed' and not hasattr(payment, 'commission'):
                platform_amount = payment.amount * Decimal('0.10')
                owner_payout = payment.amount * Decimal('0.90')
                PlatformCommission.objects.create(
                    booking_payment=payment,
                    platform_amount=platform_amount,
                    owner_payout=owner_payout
                )

        return Response({
            "detail": "Payment status updated successfully.",
            "new_status": new_status
        })

class PaymentRefundView(generics.GenericAPIView):
    permission_classes = [IsManagement]
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
            commission = get_object_or_404(PlatformCommission, booking_payment=payment)
            refunded_owner = refund_amount * Decimal('0.90')
            refunded_platform = refund_amount * Decimal('0.10')
            
            commission.refunded_owner += refunded_owner
            commission.refunded_platform += refunded_platform
            commission.save()
            
            payment.status = 'refunded' if refund_amount == payment.amount else 'partially_refunded'
            payment.save()

            PaymentTransaction.objects.create(
                booking_payment=payment,
                transaction_type='refund',
                amount=-refund_amount,
                status='completed',
                external_transaction_id=payment.campay_reference or ''
            )

        # TODO: Call CamPay refund API with amount

        return Response({
            "detail": "Refund processed successfully.",
            "refunded_amount": float(refund_amount),
            "refunded_to_owner": float(refunded_owner),
            "refunded_to_platform": float(refunded_platform),
            "new_status": payment.status
        })

class PaymentListView(generics.ListAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [IsManagement]

    def get_queryset(self):
        return BookingPayment.objects.select_related(
            'booking', 'booking__car', 'booking__guest', 'booking__owner'
        ).filter(status='completed').order_by('-created_at')


# ==================== Admin: Platform Analytics ====================
class PaymentAnalyticsView(generics.GenericAPIView):
    permission_classes = [IsManagement]

    def get(self, request):
        commissions = PlatformCommission.objects.all()
        total_platform = commissions.aggregate(
            total=django_models.Sum('platform_amount')
        )['total'] or Decimal('0')
        total_owner = commissions.aggregate(
            total=django_models.Sum('owner_payout')
        )['total'] or Decimal('0')
        total_refunded_platform = commissions.aggregate(
            total=django_models.Sum('refunded_platform')
        )['total'] or Decimal('0')
        total_refunded_owner = commissions.aggregate(
            total=django_models.Sum('refunded_owner')
        )['total'] or Decimal('0')
        
        total_revenue = total_platform + total_owner

        return Response({
            "total_transactions": commissions.count(),
            "total_revenue": float(total_revenue),
            "platform_commission": float(total_platform - total_refunded_platform),
            "owner_payouts": float(total_owner - total_refunded_owner),
            "total_refunded": float(total_refunded_platform + total_refunded_owner),
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
        commissions = PlatformCommission.objects.filter(
            booking_payment__booking__car__owner=request.user
        )
        gross_earnings = commissions.aggregate(
            total=django_models.Sum('owner_payout')
        )['total'] or Decimal('0')
        refunded = commissions.aggregate(
            total=django_models.Sum('refunded_owner')
        )['total'] or Decimal('0')
        
        available_balance = gross_earnings - refunded

        return Response({
            "total_earnings": float(gross_earnings),
            "available_balance": float(available_balance),
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


# ==================== Owner: Payout Management ====================
class PayoutRequestView(generics.CreateAPIView):
    serializer_class = PayoutRequestSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        amount = serializer.validated_data['amount']
        
        # Check if owner has enough available balance
        commissions = PlatformCommission.objects.filter(
            booking_payment__booking__car__owner=request.user
        )
        gross_earnings = commissions.aggregate(
            total=django_models.Sum('owner_payout')
        )['total'] or Decimal('0')
        refunded = commissions.aggregate(
            total=django_models.Sum('refunded_owner')
        )['total'] or Decimal('0')
        
        available_balance = gross_earnings - refunded
        
        # Deduct already requested/approved/processing payouts
        pending_payouts = Payout.objects.filter(
            owner=request.user,
            status__in=['pending', 'approved', 'processing']
        ).aggregate(total=django_models.Sum('amount'))['total'] or Decimal('0')
        
        available_for_withdrawal = available_balance - pending_payouts
        
        if amount > available_for_withdrawal:
            return Response(
                {"detail": f"Insufficient balance. Available: {float(available_for_withdrawal)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount <= 0:
            return Response(
                {"detail": "Amount must be greater than zero"},
                status=status.HTTP_400_BAD_REQUEST
            )

        payout = Payout.objects.create(
            owner=request.user,
            amount=amount,
            payment_method=serializer.validated_data['payment_method'],
            phone_number=serializer.validated_data['phone_number'],
            notes=serializer.validated_data.get('notes', '')
        )

        return Response(
            PayoutSerializer(payout).data,
            status=status.HTTP_201_CREATED
        )


class OwnerPayoutListView(generics.ListAPIView):
    serializer_class = PayoutSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Payout.objects.filter(owner=self.request.user).order_by('-requested_at')


class ManagementPayoutListView(generics.ListAPIView):
    serializer_class = PayoutSerializer
    permission_classes = [IsManagement]

    def get_queryset(self):
        status_filter = self.request.query_params.get('status')
        queryset = Payout.objects.all().order_by('-requested_at')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class PayoutApproveView(generics.GenericAPIView):
    permission_classes = [IsManagement]
    serializer_class = PayoutSerializer

    def post(self, request, payout_id):
        payout = get_object_or_404(Payout, id=payout_id, status='pending')

        with transaction.atomic():
            payout.status = 'approved'
            payout.approved_at = timezone.now()
            payout.save()

        return Response({
            "detail": "Payout approved",
            "payout": PayoutSerializer(payout).data
        })


class PayoutProcessView(generics.GenericAPIView):
    permission_classes = [IsManagement]

    def post(self, request, payout_id):
        payout = get_object_or_404(Payout, id=payout_id, status='approved')

        with transaction.atomic():
            payout.status = 'processing'
            payout.save()

            # TODO: Integrate with actual payment gateway (CamPay, bank transfer, etc.)
            # For now, mark as completed immediately
            payout.status = 'completed'
            payout.completed_at = timezone.now()
            payout.external_reference = f"payout_{payout.id}_{payout.created_at.timestamp()}"
            payout.save()

        return Response({
            "detail": "Payout processed successfully",
            "payout": PayoutSerializer(payout).data
        })


class PayoutRejectView(generics.GenericAPIView):
    permission_classes = [IsManagement]

    def post(self, request, payout_id):
        payout = get_object_or_404(Payout, id=payout_id, status__in=['pending', 'approved'])
        
        reason = request.data.get('reason', 'Rejected by admin')

        with transaction.atomic():
            payout.status = 'failed'
            payout.notes = f"Rejected: {reason}"
            payout.save()

        return Response({
            "detail": "Payout rejected",
            "payout": PayoutSerializer(payout).data
        })