from rest_framework import serializers
from .models import Car, CarPhoto, Availability, PricingRule


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

    def validate_license_plate(self, value):
        value = value.upper().strip()
        if Car.objects.filter(license_plate__iexact=value).exists():
            raise serializers.ValidationError("A car with this license plate already exists.")
        return value


class CarListSerializer(serializers.ModelSerializer):
    photos = CarPhotoSerializer(many=True, read_only=True)
    primary_photo = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Car
        fields = ['id', 'title', 'make', 'model', 'year', 'daily_rate',
                  'location_name', 'primary_photo', 'photos', 'owner_name']

    def get_primary_photo(self, obj):
        photo = obj.photos.filter(is_primary=True).first()
        return photo.image.url if photo and photo.image else None


class CarDetailSerializer(serializers.ModelSerializer):
    photos = CarPhotoSerializer(many=True, read_only=True)
    pricing_rules = PricingRuleSerializer(many=True, read_only=True)  # ← Now it's defined!
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = Car
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']