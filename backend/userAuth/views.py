from rest_framework import generics, status
from rest_framework.response import Response
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from .models import User
from .serializers import *
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings  
import secrets
import string


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        required_fields = ['username', 'email', 'password', 'role']
        missing = [f for f in required_fields if not data.get(f)]

        if missing:
            return Response({
                'message': 'Missing required fields',
                'missing': missing
            }, status=status.HTTP_400_BAD_REQUEST)

        email = data.get('email')
        try:
            validate_email(email)
        except ValidationError:
            return Response({'message': 'Invalid email address'}, status=status.HTTP_400_BAD_REQUEST)

        username = data.get('username')
        password = data.get('password')

        if User.objects.filter(username=username).exists():
            return Response({'message': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'message': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        data['password'] = make_password(password)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = CustomTokenObtainPairSerializer.get_token(user)

        redirect_map = {
            'owner': '/api/owner/dashboard/',
            'guest': '/api/guest/dashboard/',
        }

        return Response({
            'message': 'Registration successful',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,
            'redirect_to': redirect_map.get(user.role, '/')
        }, status=status.HTTP_201_CREATED)

class ManagementRegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = ManagementRegisterSerializer

    

    def create(self, request, *args, **kwargs):
        code = request.data.get('secret_code')
        if code != settings.MANAGEMENT_SECRET_CODE:
            return Response({'message': 'Invalid code'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data['role'] = 'management' 
        required_fields = ['username', 'email', 'password']
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return Response({
                'message': 'Missing required fields',
                'missing': missing
            }, status=status.HTTP_400_BAD_REQUEST)

        email = data.get('email')
        try:
            validate_email(email)
        except ValidationError:
            return Response({'message': 'Invalid email address'}, status=status.HTTP_400_BAD_REQUEST)

        username = data.get('username')
        password = data.get('password')

        if User.objects.filter(username=username).exists():
            return Response({'message': 'Username already taken'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'message': 'Email already registered'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        return Response({
            'message': 'Management registration successful',  
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.CreateAPIView):
    serializer_class = UserSerializer  

    def create(self, request, *args, **kwargs):
        data = request.data
        login_input = data.get('username')
        password = data.get('password')

        if not login_input or not password:
            return Response({'message': 'Username/email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(username=login_input)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email=login_input)
            except User.DoesNotExist:
                return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if not check_password(password, user.password):
            return Response({'message': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

        if user.status == 'suspended':
            return Response({'message': 'Your account is suspended. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)

        refresh = CustomTokenObtainPairSerializer.get_token(user)

        redirect_map = {
            'management': '/api/management/dashboard/',
            'owner': '/api/owner/dashboard/',
            'guest': '/api/guest/dashboard/',
        }

        return Response({
            'message': 'Login successful',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'role': user.role,  
            'redirect_to': redirect_map.get(user.role, '/')
        }, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):
    serializer_class = UserSerializer
    def post(self, request, *args, **kwargs):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"message": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
            return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"message": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)
        

class ForgotPasswordView(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        if not email:
            return Response({'message': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({
                'message': 'If the email exists, a reset code has been sent'
            }, status=status.HTTP_200_OK)
        
        reset_code = ''.join(secrets.choice(string.digits) for _ in range(6))
        
        user.reset_code = reset_code
        user.save()
        
        # TODO: Implement actual email sending
        print(f"Reset code for {email}: {reset_code}") 
        
        return Response({
            'message': 'If the email exists, a reset code has been sent',
            'reset_code': reset_code  
        }, status=status.HTTP_200_OK)

class ResetPasswordView(generics.GenericAPIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        reset_code = request.data.get('reset_code')
        new_password = request.data.get('new_password')
        
        if not all([email, reset_code, new_password]):
            return Response({
                'message': 'Email, reset code and new password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'message': 'Invalid reset request'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not hasattr(user, 'reset_code') or user.reset_code != reset_code:
            return Response({'message': 'Invalid reset code'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.password = make_password(new_password)
        user.reset_code = None  
        user.save()
        
        return Response({
            'message': 'Password reset successful'
        }, status=status.HTTP_200_OK)           