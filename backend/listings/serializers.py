from rest_framework import serializers
from .models import Car, CarPhoto, Availability, PricingRule
from django.utils import timezone
from bookings.models import Booking 

class CarPhotoSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = CarPhoto
        fields = ['id', 'image', 'is_primary', 'created_at']
        read_only_fields = ['created_at']


class PricingRuleSerializer(serializers.ModelSerializer):
    period_display = serializers.CharField(source='get_period_display', read_only=True)

    class Meta:
        model = PricingRule
        fields = ['id', 'period', 'period_display', 'price', 'start_date', 'end_date', 'created_at']
        read_only_fields = ['created_at']


class AvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Availability
        fields = ['date', 'is_available']
        read_only_fields = ['created_at', 'updated_at']


class CarPhotoUploadSerializer(serializers.Serializer):
    images = serializers.ListField(
        child=serializers.ImageField(),
        max_length=6,
        allow_empty=False
    )

class CarCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Car
        fields = [
            'make', 'model', 'year', 'license_plate',
            'title', 'description', 'features',
            'location_name', 'daily_rate'
        ]
        extra_kwargs = {
            'daily_rate': {'required': True, 'min_value': 1},
            'year': {'min_value': 1900, 'max_value': 2030},
        }

    def create(self, validated_data):
        validated_data.pop('owner', None)
        return Car.objects.create(
            **validated_data,
            owner=self.context['request'].user,
            is_verified=False
        )

    def validate_license_plate(self, value):
        value = value.upper().strip()
        if Car.objects.filter(license_plate__iexact=value).exists():
            raise serializers.ValidationError("A car with this license plate already exists.")
        return value

class CarListSerializer(serializers.ModelSerializer):
    photos = CarPhotoSerializer(many=True, read_only=True)
    primary_photo = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    status_display = serializers.SerializerMethodField()
    status_badge = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = [
            'id', 'title', 'make', 'model', 'year', 'daily_rate',
            'location_name', 'primary_photo', 'photos', 'owner_name',
            'is_verified', 'status_display', 'status_badge'
        ]

    def get_primary_photo(self, obj):
        photo = obj.photos.filter(is_primary=True).first()
        return photo.image.url if photo and photo.image else None


    def get_status_badge(self, obj) -> str:
        today = timezone.now().date()

        is_booked_today = Booking.objects.filter(
            car=obj,
            status='confirmed',
            start_date__lte=today,
            end_date__gte=today
        ).exists()
        
        if is_booked_today:
            return 'booked'
        
        # SECOND: Check if car recently returned
        recently_returned = Booking.objects.filter(
            car=obj,
            status='confirmed',
            end_date__lt=today,
            end_date__gte=today - timezone.timedelta(days=2)
        ).exists()
        
        if recently_returned:
            return 'recently-returned'
    
        return obj.status  


    def get_status_display(self, obj) -> str:
        today = timezone.now().date()

        # Check if car has a confirmed booking for today
        is_booked_today = Booking.objects.filter(
            car=obj,
            status='confirmed',
            start_date__lte=today,
            end_date__gte=today
        ).exists()
        
        if is_booked_today:
            return "Booked"
        
        # Check if car recently returned
        recently_returned = Booking.objects.filter(
            car=obj,
            status='confirmed',
            end_date__lt=today,
            end_date__gte=today - timezone.timedelta(days=2)
        ).exists()
        
        if recently_returned:
            return "Returned – Awaiting Check"
        
        # Return status mapping
        mapping = {
            'available': 'Available',
            'maintenance': 'Under Maintenance',
            'inactive': 'Unavailable',
            'booked': 'Booked',  # Add this line
        }
        return mapping.get(obj.status, 'Unavailable')

class CarDetailSerializer(serializers.ModelSerializer):
    photos = CarPhotoSerializer(many=True, read_only=True)
    pricing_rules = PricingRuleSerializer(many=True, read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    status_display = serializers.SerializerMethodField()
    status_badge = serializers.SerializerMethodField()

    class Meta:
        model = Car
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']

    def get_status_display(self, obj):
        return CarListSerializer().get_status_display(obj)

    def get_status_badge(self, obj):
        return CarListSerializer().get_status_badge(obj)