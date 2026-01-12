from django.utils import timezone
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import *
from userAuth.permissions import IsManagement
from django.utils import timezone
from django.db.models import Count, Sum, Q
from listings.models import Car
from userAuth.models import User
from django.contrib.contenttypes.models import ContentType


class BookingListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]    
    serializer_class = BookingListSerializer
    queryset = Booking.objects.select_related('guest', 'owner', 'car', 'payment')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer
    
    @transaction.atomic
    def perform_create(self, serializer):
        validated_data = serializer.validated_data
        car = validated_data['car']
        user = self.request.user
        
        start_date = validated_data['start_date']
        end_date = validated_data['end_date']
        days = (end_date - start_date).days
        daily_rate = car.daily_rate
        total_price = daily_rate * days
        booking = Booking.objects.create(
            guest=user,
            owner=car.owner,
            car=car,
            daily_rate=daily_rate,
            total_price=total_price,
            start_date=start_date,
            end_date=end_date,
            special_requirements=validated_data.get('special_requirements', ''),
            status='pending'
        )
        
        car.status = 'inactive'
        car.save(update_fields=['status'])
        
        BookingPayment.objects.create(
            booking=booking,
            amount=total_price,
            status='pending'
        )
        
        # Create notification for owner
        from notifications.models import Notification
        Notification.objects.create(
            user=booking.owner,
            notification_type='booking_created',
            title=f'New Booking Request! 🎉',
            message=f'{user.username} wants to book your {car.title} from {start_date} to {end_date}. Please confirm or reject.',
            content_type=ContentType.objects.get_for_model(Booking),
            object_id=booking.id
        )
        
        # Create notification for guest
        Notification.objects.create(
            user=user,
            notification_type='booking_created',
            title='Booking Request Sent',
            message=f'Your booking request for {car.title} has been sent to {car.owner.username}. Awaiting confirmation.',
            content_type=ContentType.objects.get_for_model(Booking),
            object_id=booking.id
        )
        
        serializer.instance = booking

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

class BookingConfirmAPIView(generics.UpdateAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingConfirmSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_object(self):
        booking = super().get_object()
        if booking.car.owner != self.request.user:
            raise PermissionDenied("You are not the owner of this car.")
        if booking.status != 'pending':
            raise PermissionDenied("Only pending bookings can be confirmed or rejected.")
        return booking

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        booking.status = new_status

        if new_status == 'confirmed':
            booking.confirmed_at = timezone.now()
            booking.car.status = 'booked'
        elif new_status == 'rejected':
            booking.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            booking.car.status = 'available'

        booking.car.save(update_fields=['status'])
        booking.save(update_fields=['status', 'confirmed_at', 'rejection_reason'])
        
        # Create notifications manually to ensure they're sent
        from notifications.models import Notification
        
        if new_status == 'confirmed':
            # Notify guest
            Notification.objects.create(
                user=booking.guest,
                notification_type='booking_confirmed',
                title='Booking Confirmed! ✅',
                message=f'{booking.owner.username} has confirmed your booking for {booking.car.title} from {booking.start_date} to {booking.end_date}',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )
            # Notify owner
            Notification.objects.create(
                user=booking.owner,
                notification_type='booking_confirmed',
                title='Booking Confirmed',
                message=f'You have confirmed booking from {booking.guest.username} for {booking.car.title}',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )
        elif new_status == 'rejected':
            # Notify guest
            Notification.objects.create(
                user=booking.guest,
                notification_type='booking_rejected',
                title='Booking Rejected ❌',
                message=f'{booking.owner.username} has rejected your booking for {booking.car.title}. Reason: {booking.rejection_reason}',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )
            # Notify owner
            Notification.objects.create(
                user=booking.owner,
                notification_type='booking_rejected',
                title='Booking Rejected',
                message=f'You have rejected booking from {booking.guest.username} for {booking.car.title}',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )

        return Response({
            "message": f"Booking has been {new_status}.",
            "booking": BookingDetailSerializer(booking, context=self.get_serializer_context()).data
        })

class BookingUpdateStatusAPIView(generics.GenericAPIView):
    queryset = Booking.objects.all()
    serializer_class = BookingStatusUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagement]

    def post(self, request, pk):
        booking = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        old_status = booking.status
        booking.status = serializer.validated_data['status']
        booking.save()
        
        # Create notifications for management status updates
        from notifications.models import Notification
        
        new_status = booking.status
        status_text = new_status.replace('_', ' ').title()
        
        # Notify guest about status change
        Notification.objects.create(
            user=booking.guest,
            notification_type=f'booking_{new_status}',
            title=f'Booking Status Updated: {status_text}',
            message=f'Your booking for {booking.car.title} status has been updated to {status_text}.',
            content_type=ContentType.objects.get_for_model(Booking),
            object_id=booking.id
        )
        
        # Notify owner about status change
        Notification.objects.create(
            user=booking.owner,
            notification_type=f'booking_{new_status}',
            title=f'Booking Status Updated: {status_text}',
            message=f'Booking from {booking.guest.username} for {booking.car.title} status has been updated to {status_text}.',
            content_type=ContentType.objects.get_for_model(Booking),
            object_id=booking.id
        )

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
        
            if booking.car.status == 'booked':
                booking.car.status = 'available'
                booking.car.save(update_fields=['status'])
            
            # Create notifications for both guest and owner
            from notifications.models import Notification
            
            # Notify guest
            Notification.objects.create(
                user=booking.guest,
                notification_type='booking_cancelled',
                title='Booking Cancelled',
                message=f'You have cancelled your booking for {booking.car.title}.',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )
            
            # Notify owner
            Notification.objects.create(
                user=booking.owner,
                notification_type='booking_cancelled',
                title='Booking Cancelled 🔔',
                message=f'{booking.guest.username} has cancelled their booking for {booking.car.title}. Your car is now available.',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )

        return Response({
            "detail": "Booking cancelled successfully and car is now available."
        }, status=status.HTTP_200_OK)

class MyBookingsAPIView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        timeout_hours = 24
        expiry_threshold = timezone.now() - timezone.timedelta(hours=timeout_hours)
        expired = Booking.objects.filter(
            status='pending',
            created_at__lt=expiry_threshold
        )
        for booking in expired:
            booking.status = 'cancelled'
            booking.rejection_reason = "Expired: Owner did not respond in time."
            booking.save()
            booking.car.status = 'available'
            booking.car.save(update_fields=['status'])

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

class OwnerCancelUnpaidBookingAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        
        if booking.car.owner != request.user:
            return Response({"detail": "Not your car."}, status=403)
        
        if booking.status != 'confirmed':
            return Response({"detail": "Only confirmed bookings can be cancelled by owner."}, status=400)
        
        if booking.payment and booking.payment.status == 'completed':
            return Response({"detail": "Cannot cancel a paid booking."}, status=400)
        
        hours_since_confirm = (timezone.now() - booking.confirmed_at).total_seconds() / 3600
        if hours_since_confirm < 6:  # example: must wait at least 6 hours
            return Response({"detail": "Guest still has time to pay."}, status=400)

        with transaction.atomic():
            booking.status = 'cancelled'
            booking.rejection_reason = "Cancelled by owner: Payment not received in time."
            booking.save()
            
            booking.car.status = 'available'
            booking.car.save(update_fields=['status'])
            
            if booking.payment:
                booking.payment.status = 'cancelled'
                booking.payment.save()
            
            # Create notifications for both guest and owner
            from notifications.models import Notification
            
            # Notify guest
            Notification.objects.create(
                user=booking.guest,
                notification_type='booking_cancelled',
                title='Booking Cancelled ❌',
                message=f'{booking.owner.username} has cancelled the booking for {booking.car.title}. Reason: Payment not received in time.',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )
            
            # Notify owner
            Notification.objects.create(
                user=booking.owner,
                notification_type='booking_cancelled',
                title='Booking Cancelled',
                message=f'You have cancelled the booking from {booking.guest.username} for {booking.car.title}. Car is now available.',
                content_type=ContentType.objects.get_for_model(Booking),
                object_id=booking.id
            )

        return Response({
            "detail": "Booking cancelled. Car is now available again."
        })
    
class BookingStatsAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    
    def get(self, request):
        # Get counts for each booking status
        bookings_by_status = Booking.objects.values('status').annotate(
            count=Count('id')
        )
        
        # Initialize stats
        stats = {
            'total_bookings': 0,
            'pending_bookings': 0,
            'confirmed_bookings': 0,
            'active_bookings': 0,
            'completed_bookings': 0,
            'cancelled_bookings': 0,
            'total_revenue': 0
        }
        
        # Fill stats from database
        for item in bookings_by_status:
            status = item['status']
            count = item['count']
            stats['total_bookings'] += count
            
            if status == 'pending':
                stats['pending_bookings'] = count
            elif status == 'confirmed':
                stats['confirmed_bookings'] = count
            elif status == 'active':
                stats['active_bookings'] = count
            elif status == 'completed':
                stats['completed_bookings'] = count
            elif status == 'cancelled':
                stats['cancelled_bookings'] = count
        
        # Calculate total revenue from completed bookings
        completed_bookings = Booking.objects.filter(status='completed')
        if completed_bookings.exists():
            revenue = completed_bookings.aggregate(total=Sum('total_price'))
            stats['total_revenue'] = revenue['total'] or 0
        
        return Response(stats)

class OwnerBookingsListView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Get all bookings where user is the car owner
        return Booking.objects.filter(
            car__owner=self.request.user
        ).select_related('car', 'guest', 'payment').order_by('-created_at')