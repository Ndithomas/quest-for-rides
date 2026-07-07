from django.utils import timezone
from django.db import transaction, models
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import *
from .serializers import *
from userAuth.permissions import IsManagement, IsGuest
from django.utils import timezone
from django.db.models import Count, Sum, Q
from listings.models import Car
from userAuth.models import User



class BookingListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]    
    serializer_class = BookingListSerializer
    queryset = Booking.objects.select_related('guest', 'owner', 'car', 'payment')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingListSerializer
    
    def check_permissions(self, request):
        super().check_permissions(request)
        if request.method == 'POST':
            if not hasattr(request.user, 'role') or request.user.role != 'guest':
                self.permission_denied(request, message="Only guests can create bookings.")
    
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
        if not booking.can_transition(new_status):
            return Response(
                {"detail": f"Cannot change booking from '{booking.status}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST
                )
        booking.status = new_status
        update_fields = ['status']

        if new_status == 'confirmed':
            booking.confirmed_at = timezone.now()
            booking.car.status = 'booked'
            update_fields.append('confirmed_at')
        elif new_status == 'rejected':
            booking.rejection_reason = serializer.validated_data.get('rejection_reason', '')
            booking.car.status = 'available'
            update_fields.append('rejection_reason')

        booking.car.save(update_fields=['status'])
        booking.save(update_fields=update_fields)

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

        new_status = serializer.validated_data['status']
        if not booking.can_transition(new_status):
            return Response(
                {"detail": f"Cannot change booking from '{booking.status}' to '{new_status}'."},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = serializer.validated_data['status']
        booking.save(update_fields=['status'])

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
            if booking.can_transition('cancelled'):
                return Response(
                    {"detail": "Booking cannot be cancelled."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            booking.status = 'cancelled'
            booking.save(update_fields=['status'])
            if booking.payment:
                booking.payment.status = 'cancelled'
                booking.payment.save(update_fields=['status'])
        
            if booking.car.status == 'booked':
                booking.car.status = 'available'
                booking.car.save(update_fields=['status'])

        return Response({
            "detail": "Booking cancelled successfully and car is now available."
        }, status=status.HTTP_200_OK)
class MyBookingsAPIView(generics.ListAPIView):
    serializer_class = BookingListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        
        expiry_threshold = timezone.now() - timezone.timedelta(hours=24)
        expired = Booking.objects.filter(status='pending', created_at__lt=expiry_threshold)
        for booking in expired:
            booking.status = 'cancelled'
            booking.rejection_reason = "Expired: Owner did not respond in time."
            booking.save(update_fields=['status', 'rejection_reason'])
            booking.car.status = 'available'
            booking.car.save(update_fields=['status'])

        queryset = Booking.objects.filter(
            models.Q(guest=user) | models.Q(owner=user)
        ).select_related('car', 'guest', 'owner', 'payment').order_by('-created_at')

        status_filter = self.request.query_params.get('status')
        if status_filter and status_filter != 'all':
            queryset = queryset.filter(status=status_filter)

        return queryset

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

        # ✅ Only the car owner can cancel
        if booking.car.owner != request.user:
            return Response({"detail": "Not your car."}, status=403)

        # ✅ Only confirmed bookings can be cancelled
        if booking.status != 'confirmed':
            return Response({"detail": "Only confirmed bookings can be cancelled by owner."}, status=400)

        # ✅ Cannot cancel if already paid
        if booking.payment and booking.payment.status == 'completed':
            return Response({"detail": "Cannot cancel a paid booking."}, status=400)

        # ✅ Enforce 1 hour grace period
        one_hour = timezone.timedelta(hours=1)
        if timezone.now() < booking.confirmed_at + one_hour:
            return Response({"detail": "Guest still has time to pay (1 hour grace period)."}, status=400)

        # ✅ Perform cancellation atomically
        with transaction.atomic():
            booking.status = 'cancelled'
            booking.rejection_reason = "Cancelled by owner: Payment not received in time."
            booking.save(update_fields=['status', 'rejection_reason'])

            booking.car.status = 'available'
            booking.car.save(update_fields=['status'])

            if booking.payment:
                booking.payment.status = 'cancelled'
                booking.payment.save(update_fields=['status'])

        return Response({
            "detail": "Booking cancelled. Car is now available again."
        }, status=200)
    
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




class MarkBookingCompletedAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        booking = get_object_or_404(
            Booking.objects.select_related('car', 'owner'),
            id=pk
        )

        user = request.user
        if user != booking.owner and user != booking.guest:
            return Response({"detail": "Not authorized."}, status=403)

        if booking.status != 'active':
            return Response(
                {"detail": "Only active bookings can be marked as completed."},
                status=400
            )
        if not booking.can_transition('completed'):
            return Response(
                {"detail": "Booking cannot be completed."},
                status=status.HTTP_400_BAD_REQUEST
            )
        booking.status = 'completed'
        booking.save(update_fields=['status'])

        booking.car.status = 'available'
        booking.car.save(update_fields=['status'])

        return Response({
            "detail": "Booking marked as completed.",
            "booking": BookingDetailSerializer(booking, context={'request': request}).data
        })
