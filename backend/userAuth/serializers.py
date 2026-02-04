from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.settings import api_settings

class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'first_name', 'last_name', 'phone_number', 'address']
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {
                'choices': [('guest', 'Guest'), ('owner', 'Owner')]
            }
        }

    def validate_role(self, value):
        if value not in ['guest', 'owner']:
            raise serializers.ValidationError("Role must be guest or owner")
        return value

class ManagementRegisterSerializer(serializers.ModelSerializer):
    secret_code = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ['username', 'email', 'password','first_name', 'last_name','phone_number','secret_code']
        extra_kwargs = {
            'password': {'write_only': True}
        }
    def create(self, validated_data):
        validated_data.pop('secret_code', None)
        validated_data['role'] = 'management'
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)   
        user.save()
        return user

class UserSerializer(serializers.ModelSerializer):
    status = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ['id','username','first_name','last_name','email','password','role','phone_number','address','status','created_at','updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['user_id'] = user.id

        return token


class UserSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number']
        read_only_fields = fields