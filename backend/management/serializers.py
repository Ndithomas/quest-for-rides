from rest_framework import serializers
from .models import ManagementProfile
from userAuth.serializers import UserSerializer

from listings.models import Car
from userAuth.models import User

class ManagementProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    phone_number = serializers.CharField(source="user.phone_number")
    role = serializers.CharField(source="user.role")
    profile_picture = serializers.ImageField(use_url=True, required=False)
    
    class Meta:
        model = ManagementProfile
        fields = ['username','email','phone_number','profile_picture','role']
        read_only_fields = ['user', 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        # Extract nested user data
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        
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