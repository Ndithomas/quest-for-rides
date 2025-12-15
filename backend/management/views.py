# management/views.py
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.db.models import Count, Q, Avg
from django.utils import timezone
from userAuth.models import User
from userAuth.serializers import UserSerializer
from listings.models import Car
from owner.models import OwnerProfile
from .models import ManagementProfile
from .serializers import *
from userAuth.permissions import IsManagement


class ManagementProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ManagementProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self):
        return self.request.user.management_profile

class ManagementProfileDetailView(generics.RetrieveAPIView):
    queryset = ManagementProfile.objects.all()
    serializer_class = ManagementProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

class ManagementDashboardStatsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]

    def get(self, request):
        today = timezone.now().date()

        stats = {
            "total_users": User.objects.exclude(role='management').count(),
            "total_guests": User.objects.filter(role='guest').count(),
            "total_owners": User.objects.filter(role='owner').count(),
            "total_cars": Car.objects.count(),
            "active_cars": Car.objects.filter(status='active').count(),           # ← FIXED
            "cars_added_today": Car.objects.filter(created_at__date=today).count(),
            "avg_cars_per_owner": User.objects.filter(role='owner')
                .annotate(car_count=Count('cars'))
                .aggregate(avg=Avg('car_count'))['avg'] or 0.0,
        }

        return Response(DashboardStatsSerializer(stats).data)

class AllUsersListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    serializer_class = UserSerializer

    def get_queryset(self):
        return User.objects.exclude(role='management').select_related('guest_profile', 'owner_profile')

class AllCarsListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    serializer_class = CarStatsSerializer

    def get_queryset(self):
        return Car.objects.select_related('owner').all()

class UserSearchView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    serializer_class = UserSerializer

    def get_queryset(self):
        q = self.request.query_params.get('q', '').strip()
        if not q:
            return User.objects.none()
        return User.objects.exclude(role='management').filter(
            Q(username__icontains=q) |
            Q(email__icontains=q) |
            Q(first_name__icontains=q) |
            Q(last_name__icontains=q)
        )

class UserDetailView(generics.RetrieveAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

class ChangeUserStatusView(generics.UpdateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsManagement]
    queryset = User.objects.all()
    serializer_class = UserSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

    def patch(self, request, user_id):
        status_value = request.data.get('status')
        if status_value not in ['active', 'inactive', 'suspended']:
            return Response({'message': 'Invalid status value'}, status=400)
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'message': 'User not found'}, status=404)
        user.status = status_value
        user.save()
        return Response({'message': 'Status updated', 'user': UserSerializer(user).data}, status=200)