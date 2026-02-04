from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, serializers
from .models import BookingReview
from .serializers import ReviewCreateSerializer, ReviewListSerializer, ReviewDetailSerializer
from bookings.models import Booking
from django.db import models


class ReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ReviewCreateSerializer
        return ReviewListSerializer

    def get_queryset(self):
        return BookingReview.objects.select_related('booking', 'booking__car', 'reviewer').order_by('-created_at')

    def perform_create(self, serializer):
        booking_id = serializer.validated_data.get('booking_id')
        if not booking_id:
            raise serializers.ValidationError({'booking_id': 'This field is required.'})

        rating = serializer.validated_data.get('rating')
        if rating is None:
            raise serializers.ValidationError({'rating': 'This field is required.'})

        comment = serializer.validated_data.get('comment', '')

        booking = get_object_or_404(
            Booking.objects.select_related('car'),
            id=booking_id,
            guest=self.request.user,
            status='completed'
        )

        if hasattr(booking, 'review'):
            raise serializers.ValidationError({'detail': 'You have already reviewed this booking.'})

        review = BookingReview.objects.create(
            booking=booking,
            reviewer=self.request.user,
            rating=rating,
            comment=comment
        )

        # Update car average rating
        self._update_car_rating(booking.car)

        serializer.instance = review

    def _update_car_rating(self, car):
        reviews = BookingReview.objects.filter(booking__car=car)
        avg = reviews.aggregate(avg_rating=models.Avg('rating'))['avg_rating']
        car.avg_rating = round(avg, 1) if avg else None
        car.save(update_fields=['avg_rating'])


class ReviewDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = BookingReview.objects.all()
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_object(self):
        review = super().get_object()
        if review.reviewer != self.request.user:
            self.permission_denied(self.request)
        return review


class CarReviewsAPIView(generics.ListAPIView):
    serializer_class = ReviewDetailSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        car_id = self.kwargs['car_id']
        return BookingReview.objects.filter(
            booking__car_id=car_id
        ).select_related('reviewer', 'booking', 'booking__car').order_by('-created_at')


class MyReviewsAPIView(generics.ListAPIView):
    serializer_class = ReviewListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BookingReview.objects.filter(
            reviewer=self.request.user
        ).select_related('booking', 'booking__car', 'reviewer').order_by('-created_at')
