from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from .models import *
from .serializers import *  


class CarListCreateAPIView(generics.ListCreateAPIView):
    queryset = Car.objects.select_related('owner').prefetch_related('photos')
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CarCreateSerializer  
        return CarDetailSerializer  

    def get_queryset(self):
        if self.request.user.role == 'owner':
            return self.queryset.filter(owner=self.request.user)
        return Car.objects.none()

    def perform_create(self, serializer):
        if self.request.user.role != 'owner':
            raise permissions.exceptions.PermissionDenied("Only owners can list cars.")
        serializer.save(owner=self.request.user)



class CarDetailAPIView(generics.RetrieveAPIView):  
    queryset = Car.objects.select_related('owner').prefetch_related('photos', 'pricing_rules')
    serializer_class = CarDetailSerializer
    lookup_field = 'pk'
    
    
    def get_permissions(self):
        if self.request.method in ['GET']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]  

    def get_object(self):
        car = super().get_object()
        
        if car.status != 'active':
            if not (self.request.user.is_authenticated and 
                   (self.request.user == car.owner or 
                    self.request.user.role in ['management', 'staff'])):
                raise permissions.exceptions.NotFound()  
        
        return car

class OwnerCarDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Car.objects.all()
    serializer_class = CarDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        car = super().get_object()
        if car.owner != self.request.user:
            self.permission_denied(self.request)
        return car    
   
class CarPhotoCreateAPIView(generics.CreateAPIView):
    serializer_class = CarPhotoUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        car = get_object_or_404(Car, id=self.kwargs['car_id'], owner=self.request.user)
        
        current_photos = car.photos.count()
        if current_photos >= 6:
            return Response(
                {"detail": "Maximum 6 photos allowed per car."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        images = request.FILES.getlist('images')
        if not images:
            return Response(
                {"detail": "No images provided."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        remaining_slots = 6 - current_photos
        images_to_upload = images[:remaining_slots]
        
        created_photos = []
        for image in images_to_upload:
            photo = CarPhoto.objects.create(car=car, image=image)
            
            if not car.photos.filter(is_primary=True).exists():
                photo.is_primary = True
                photo.save()
            
            created_photos.append(photo)
        
        photo_serializer = CarPhotoSerializer(created_photos, many=True)
        return Response(photo_serializer.data, status=status.HTTP_201_CREATED)

class SetPrimaryPhotoAPIView(generics.UpdateAPIView):
    queryset = CarPhoto.objects.all()
    serializer_class = CarPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def update(self, request, *args, **kwargs):
        photo = self.get_object()
        if photo.car.owner != request.user:
            return Response({"detail": "Not your car."}, status=403)

        CarPhoto.objects.filter(car=photo.car).update(is_primary=False)
        photo.is_primary = True
        photo.save()
        return Response({"message": "Primary photo updated successfully."})


class CarPhotoDeleteAPIView(generics.DestroyAPIView):
    queryset = CarPhoto.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        photo = super().get_object()
        if photo.car.owner != self.request.user:
            self.permission_denied(self.request)
        return photo

    def perform_destroy(self, instance):
        car = instance.car
        was_primary = instance.is_primary
        instance.delete()
        
        if was_primary:
            first_photo = car.photos.first()
            if first_photo:
                first_photo.is_primary = True
                first_photo.save()


class AvailabilityListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        car = get_object_or_404(Car, id=self.kwargs['car_id'], owner=self.request.user)
        return Availability.objects.filter(car=car)

    def perform_create(self, serializer):
        car = get_object_or_404(Car, id=self.kwargs['car_id'], owner=self.request.user)
        serializer.save(car=car)


class PricingRuleListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = PricingRuleSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        car = get_object_or_404(Car, id=self.kwargs['car_id'], owner=self.request.user)
        return PricingRule.objects.filter(car=car)

    def perform_create(self, serializer):
        car = get_object_or_404(Car, id=self.kwargs['car_id'], owner=self.request.user)
        serializer.save(car=car)

class CarToggleStatusAPIView(generics.UpdateAPIView):
    queryset = Car.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        car = self.get_object()
        if car.owner != request.user:
            return Response({"detail": "You do not own this car."}, status=403)

        new_status = request.data.get('status')
        valid_statuses = ['active', 'inactive', 'maintenance']
        if new_status not in valid_statuses:
            return Response({
                "detail": f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            }, status=400)

        car.status = new_status
        car.save(update_fields=['status'])

        return Response({
            "message": "Status updated successfully",
            "status": car.get_status_display()
        })

class PublicCarSearchAPIView(generics.ListAPIView):
    serializer_class = CarListSerializer
    permission_classes = [permissions.AllowAny] 

    def get_queryset(self):
        queryset = Car.objects.filter(status='active', is_verified=True) \
            .select_related('owner') \
            .prefetch_related('photos')

        location = self.request.query_params.get('location')
        make = self.request.query_params.get('make')
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')

        if location:
            queryset = queryset.filter(location_name__icontains=location)
        if make:
            queryset = queryset.filter(make__icontains=make)
        if min_price:
            queryset = queryset.filter(daily_rate__gte=min_price)
        if max_price:
            queryset = queryset.filter(daily_rate__lte=max_price)

        return queryset.order_by('-created_at') 

# views.py — Improve CarVerifyAPIView (optional but better)

class CarVerifyAPIView(generics.UpdateAPIView):
    queryset = Car.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        if request.user.role not in ['management', 'staff']:
            return Response({"detail": "Permission denied."}, status=403)

        car = self.get_object()
        new_status = request.data.get('is_verified', not car.is_verified)  # toggle if not sent

        car.is_verified = new_status
        car.save(update_fields=['is_verified'])

        return Response({
            "message": "Verification status updated.",
            "is_verified": car.is_verified
        })
    
# views.py — add this anywhere in the file

class ManagementAllCarsAPIView(generics.ListAPIView):
    """Only management/staff can list ALL cars (including unverified ones)"""
    queryset = Car.objects.select_related('owner').prefetch_related('photos')
    serializer_class = CarDetailSerializer  # or CarListSerializer if you prefer lighter
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role not in ['management', 'staff']:
            raise permissions.exceptions.PermissionDenied("Access denied.")
        return self.queryset.all().order_by('-created_at')