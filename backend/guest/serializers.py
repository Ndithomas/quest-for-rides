from rest_framework import serializers
from .models import GuestProfile
from userAuth.serializers import UserSerializer

class GuestProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    phone_number = serializers.CharField(source="user.phone_number")
    role = serializers.CharField(source="user.role")
    profile_picture = serializers.ImageField(use_url=True, required=False)
    class Meta:
        model = GuestProfile
        fields = ['username','email','phone_number','profile_picture','role']
        read_only_fields = [ 'created_at', 'updated_at']

    def update(self, instance, validated_data):
        # Extract nested user data
        user_data = validated_data.pop('user', {})
        user = instance.user

        # Update user fields
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        
        return super().update(instance, validated_data)