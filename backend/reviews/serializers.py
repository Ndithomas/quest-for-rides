from rest_framework import serializers
from .models import BookingReview
from userAuth.serializers import UserSimpleSerializer


class ReviewCreateSerializer(serializers.Serializer):
    booking_id = serializers.IntegerField()
    rating = serializers.IntegerField(min_value=1, max_value=5)
    comment = serializers.CharField(required=False, allow_blank=True, max_length=1000)


class ReviewListSerializer(serializers.ModelSerializer):
    reviewer = UserSimpleSerializer(read_only=True)
    car_title = serializers.CharField(source='booking.car.title', read_only=True)
    car = serializers.IntegerField(source='booking.car.id', read_only=True)

    class Meta:
        model = BookingReview
        fields = ['id', 'booking', 'car', 'car_title', 'reviewer', 'rating', 'comment', 'created_at']
        read_only_fields = ['booking', 'reviewer', 'created_at']


class ReviewDetailSerializer(serializers.ModelSerializer):
    reviewer = UserSimpleSerializer(read_only=True)

    class Meta:
        model = BookingReview
        fields = '__all__'
        read_only_fields = ['booking', 'reviewer', 'created_at']
