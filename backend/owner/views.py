from rest_framework import generics, permissions
from .models import OwnerProfile
from .serializers import OwnerProfileSerializer
from userAuth.permissions import IsOwner
from rest_framework.parsers import MultiPartParser, FormParser 

class OwnerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = OwnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwner]
    parser_classes = [MultiPartParser, FormParser]
    def get_object(self):
        return self.request.user.owner_profile

class OwnerProfileDetailView(generics.RetrieveAPIView):
    queryset = OwnerProfile.objects.all()
    serializer_class = OwnerProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]