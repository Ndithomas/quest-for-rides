# bookings/serializers.py
from django.utils import timezone
from rest_framework import serializers
from .models import Booking, BookingPayment, BookingReview
from userAuth.models import User


class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number']
        read_only_fields = fields


class BookingPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingPayment
        fields = [
            'id', 'amount', 'status', 'payment_method',
            'transaction_id', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class BookingReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSimpleSerializer(read_only=True)
    
    class Meta:
        model = BookingReview
        fields = ['id', 'reviewer', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'created_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = ['car', 'start_date', 'end_date', 'special_requirements']
    
    def validate(self, data):

        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({"dates": "End date must be after start date."})
        
        if data['start_date'] < timezone.now().date():
            raise serializers.ValidationError({"start_date": "Start date cannot be in the past."})
        
        max_days = 365
        days_diff = (data['end_date'] - data['start_date']).days
        if days_diff > max_days:
            raise serializers.ValidationError({"dates": f"Booking cannot exceed {max_days} days."})
        
        return data


class BookingListSerializer(serializers.ModelSerializer):
    guest = UserSimpleSerializer(read_only=True)
    owner = UserSimpleSerializer(read_only=True)
    car_title = serializers.CharField(source='car.title', read_only=True)
    car_make = serializers.CharField(source='car.make', read_only=True)
    car_model = serializers.CharField(source='car.model', read_only=True)
    
    payment_status = serializers.CharField(
        source='payment.status', read_only=True, default='pending'
    )
    
    class Meta:
        model = Booking
        fields = ['id','guest','owner','car','car_title','car_make',
                  'car_model','start_date','end_date','status',
                  'daily_rate','total_price','special_requirements',
                  'owner_notes','rejection_reason','payment_status',
                  'created_at','confirmed_at',
                   ]
        read_only_fields = fields


class BookingDetailSerializer(serializers.ModelSerializer):
    guest = UserSimpleSerializer(read_only=True)
    owner = UserSimpleSerializer(read_only=True)
    car_title = serializers.CharField(source='car.title', read_only=True)
    car_make = serializers.CharField(source='car.make', read_only=True)
    car_model = serializers.CharField(source='car.model', read_only=True)
    car_year = serializers.IntegerField(source='car.year', read_only=True)
    car_license_plate = serializers.CharField(source='car.license_plate', read_only=True)
    payment = BookingPaymentSerializer(read_only=True)
    review = BookingReviewSerializer(read_only=True)
    
    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = [
            'guest', 'owner', 'car', 'daily_rate', 'total_price',
            'status', 'created_at', 'updated_at', 'confirmed_at',
            'owner_notes', 'rejection_reason'
        ]


class BookingConfirmSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['confirmed', 'rejected'])
    owner_notes = serializers.CharField(
        required=False, allow_blank=True, max_length=500
    )
    rejection_reason = serializers.CharField(
        required=False, allow_blank=True, max_length=500
    )
    
    def validate(self, data):
        if data['status'] == 'rejected' and not data.get('rejection_reason'):
            raise serializers.ValidationError(
                {"rejection_reason": "Rejection reason is required when rejecting a booking."}
            )
        return data


class BookingStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['active', 'completed', 'cancelled', 'refunded']
    )