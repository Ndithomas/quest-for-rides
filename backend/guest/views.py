from rest_framework import generics, permissions
from .models import GuestProfile
from .serializers import GuestProfileSerializer
from userAuth.permissions import IsGuest
from rest_framework.parsers import MultiPartParser, FormParser

class GuestProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = GuestProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsGuest]
    parser_classes = [MultiPartParser, FormParser]
    def get_object(self):
        return self.request.user.guest_profile

class GuestProfileDetailView(generics.RetrieveAPIView):
    queryset = GuestProfile.objects.all()
    serializer_class = GuestProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]