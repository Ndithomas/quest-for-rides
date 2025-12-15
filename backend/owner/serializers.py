from rest_framework import serializers
from .models import OwnerProfile
from userAuth.serializers import UserSerializer

class OwnerProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username")
    email = serializers.EmailField(source="user.email")
    phone_number = serializers.CharField(source="user.phone_number", required=False, allow_blank=True)
    role = serializers.CharField(source="user.role", read_only=True)
    profile_picture = serializers.ImageField(use_url=True, required=False, allow_null=True, allow_empty_file=True)
    
    class Meta:
        model = OwnerProfile
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