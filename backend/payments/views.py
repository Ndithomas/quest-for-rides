# payments/views.py
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response

from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.utils import timezone
from django.db import transaction

from bookings.models import BookingPayment, Booking
from userAuth.permissions import IsManagement
from .models import *
from .serializers import *


class PaymentMethodListCreateView(generics.ListCreateAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class PaymentMethodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PaymentMethodSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return PaymentMethod.objects.filter(user=self.request.user)


class PaymentMethodSetDefaultView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        method = get_object_or_404(PaymentMethod, pk=pk, user=request.user)

        PaymentMethod.objects.filter(user=request.user).update(is_default=False)
        method.is_default = True
        method.save()

        return Response({'detail': 'Payment method set as default'}, status=status.HTTP_200_OK)

class BookingPaymentDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        booking_id = self.kwargs.get('booking_id')
        payment = get_object_or_404(BookingPayment, booking_id=booking_id)
        user = self.request.user
        booking = payment.booking

        if user not in (booking.guest, booking.owner) and user.role not in ['management', 'staff']:
            self.permission_denied(self.request)

        return payment


class PaymentStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        payment = get_object_or_404(BookingPayment, booking=booking)

        if request.user != booking.guest and request.user.role not in ['management', 'staff']:
            return Response({'detail': 'You do not have permission to update this payment'}, status=403)

        serializer = PaymentStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            payment.status = serializer.validated_data['status']
            if serializer.validated_data.get('transaction_id'):
                payment.transaction_id = serializer.validated_data['transaction_id']
            payment.save()

            PaymentTransaction.objects.create(
                booking_payment=payment,
                transaction_type='booking' if payment.status == 'completed' else 'refund',
                amount=payment.amount,
                status=payment.status,
                payment_method=payment.payment_method,
                external_transaction_id=serializer.validated_data.get('transaction_id', '')
            )

            if payment.status == 'completed' and not hasattr(payment, 'invoice'):
                invoice_number = f"INV-{payment.booking.id}-{timezone.now().strftime('%Y%m%d%H%M%S')}"
                PaymentInvoice.objects.create(
                    booking_payment=payment,
                    invoice_number=invoice_number,
                    subtotal=payment.amount,
                    tax=0,
                    total=payment.amount,
                    paid_date=timezone.now()
                )

        return Response(BookingPaymentDetailSerializer(payment).data)


class PaymentListView(generics.ListAPIView):
    serializer_class = BookingPaymentDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        bookings = Booking.objects.filter(Q(guest=user) | Q(owner=user))
        return BookingPayment.objects.filter(booking__in=bookings).select_related('booking')


class PaymentAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]

    def get(self, request):
        from django.db.models import Sum, Count
        from datetime import timedelta

        period = request.query_params.get('period', '30d')
        days = 7 if period == '7d' else 90 if period == '90d' else 30
        start_date = timezone.now() - timedelta(days=days)
        payments = BookingPayment.objects.filter(created_at__gte=start_date)

        analytics = {
            'total_revenue': payments.filter(status='completed').aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_pending': payments.filter(status='pending').aggregate(Sum('amount'))['amount__sum'] or 0,
            'total_refunded': payments.filter(status='refunded').aggregate(Sum('amount'))['amount__sum'] or 0,
            'completed_payments': payments.filter(status='completed').count(),
            'pending_payments': payments.filter(status='pending').count(),
            'failed_payments': payments.filter(status='failed').count(),
            'period': period,
        }

        return Response(analytics)


class PaymentRefundView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, id=booking_id)
        payment = get_object_or_404(BookingPayment, booking=booking)

        if request.user != booking.owner and request.user.role not in ['management', 'staff']:
            return Response({'detail': 'Only the owner or management can process refunds'}, status=403)

        if payment.status != 'completed':
            return Response({'detail': 'Only completed payments can be refunded'}, status=400)

        with transaction.atomic():
            payment.status = 'refunded'
            payment.save()

            PaymentTransaction.objects.create(
                booking_payment=payment,
                transaction_type='refund',
                amount=payment.amount,
                status='refunded',
                payment_method=payment.payment_method
            )

        return Response({
            'detail': 'Refund processed successfully',
            'payment': BookingPaymentDetailSerializer(payment).data
        })