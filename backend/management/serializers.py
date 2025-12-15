from rest_framework import serializers
from .models import ManagementProfile
from userAuth.serializers import UserSerializer
from listings.models import Car
from userAuth.models import User

class ManagementProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    phone_number = serializers.CharField(source="user.phone_number", required=False, allow_blank=True)
    role = serializers.CharField(source="user.role", read_only=True)
    profile_picture = serializers.ImageField(use_url=True, required=False, allow_null=True, allow_empty_file=True)
    class Meta:
        model = ManagementProfile
        fields = ['username','email','phone_number','profile_picture','role']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        if 'profile_picture' in validated_data:
            if validated_data['profile_picture'] is False or validated_data['profile_picture'] is None:
                instance.profile_picture = None
        return super().update(instance, validated_data)
    
class DashboardStatsSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_guests = serializers.IntegerField()
    total_owners = serializers.IntegerField()
    total_cars = serializers.IntegerField()
    active_cars = serializers.IntegerField()
    cars_added_today = serializers.IntegerField()
    avg_cars_per_owner = serializers.FloatField()

class CarStatsSerializer(serializers.ModelSerializer):
    owner_name = serializers.CharField(source='owner.get_full_name', default='Unknown')
    owner_username = serializers.CharField(source='owner.username')
    owner_email = serializers.CharField(source='owner.email')
    owner_phone = serializers.CharField(source='owner.phone_number', default='')
    class Meta:
        model = Car
        fields = ['id','make','year','daily_rate','status','created_at','owner_name','owner_username','owner_email','owner_phone']