# bookings/views.py
from django.utils import timezone
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import *
from userAuth.permissions import IsManagement


class BookingListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    
    # Add these two lines to fix the error
    serializer_class = BookingListSerializer
    queryset = Booking.objects.select_related('guest', 'owner', 'car', 'payment')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer
    
    @transaction.atomic
    def perform_create(self, serializer):
        car = serializer.validated_data['car']
        if car.status != 'active':
            raise serializers.ValidationError("Cannot book an unavailable car.")

        booking = serializer.save(
            guest=self.request.user,
            owner=car.owner,
            daily_rate=car.daily_rate,
            status='pending'
        )
        BookingPayment.objects.create(
            booking=booking,
            amount=booking.total_price,
            status='pending'
        )


class BookingDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Booking.objects.select_related('guest', 'owner', 'car', 'payment')
    serializer_class = BookingDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        booking = super().get_object()
        user = self.request.user

        if user not in (booking.guest, booking.owner) and user.role not in ['management', 'staff']:
            self.permission_denied(self.request)
        return booking


class BookingConfirmAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)

        if request.user != booking.car.owner:
            return Response(
                {"detail": "Only the car owner can confirm or reject this booking."},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status != 'pending':
            return Response(
                {"detail": "This booking is no longer pending."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = BookingConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        with transaction.atomic():
            if data['status'] == 'confirmed':
                booking.status = 'confirmed'
                booking.confirmed_at = timezone.now()
                booking.owner_notes = data.get('owner_notes', '')
                
            else:  
                booking.status = 'rejected'
                booking.rejection_reason = data.get('rejection_reason', '')
                if booking.payment:
                    booking.payment.status = 'cancelled'
                    booking.payment.save()

            booking.save()

        return Response(BookingDetailSerializer(booking, context={'request': request}).data)


class BookingUpdateStatusAPIView(generics.GenericAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagement]

    def post(self, request, pk):
        booking = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        booking.status = serializer.validated_data['status']
        booking.save()

        return Response(BookingDetailSerializer(booking, context={'request': request}).data)


class GuestCancelBookingAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, guest=request.user)

        if booking.status != 'pending':
            return Response(
                {"detail": "You can only cancel bookings that are still pending."},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            booking.status = 'cancelled'
            booking.save()

            if booking.payment:
                booking.payment.status = 'cancelled'
                booking.payment.save()

        return Response({
            "detail": "Booking cancelled successfully."
        }, status=status.HTTP_200_OK)


class MyBookingsAPIView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Booking.objects.filter(
            models.Q(guest=user) | models.Q(owner=user)
        ).select_related('car', 'guest', 'owner', 'payment').order_by('-created_at')


class PendingConfirmationsAPIView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(
            owner=self.request.user,
            status='pending'
        ).select_related('car', 'guest', 'payment').order_by('-created_at')

class AllBookingsAPIView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    queryset = Booking.objects.select_related('car', 'guest', 'owner', 'payment').order_by('-created_at')