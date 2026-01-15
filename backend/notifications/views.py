from rest_framework import generics, permissions, status
from rest_framework.response import Response
from .models import Notification
from .serializers import *
from datetime import timedelta
from django.utils import timezone


class NotificationListAPIView(generics.ListAPIView):
    serializer_class = NotificationListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        cleanup_threshold = timezone.now() - timedelta(days=30)
        Notification.objects.filter(
            user=self.request.user, 
            is_read=True, 
            created_at__lt=cleanup_threshold
        ).delete()
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')[:100]


class NotificationDetailAPIView(generics.RetrieveAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_object(self):
        notification = super().get_object()
        if notification.user != self.request.user:
            self.permission_denied(self.request)
        return notification


class NotificationMarkReadAPIView(generics.UpdateAPIView):
    queryset = Notification.objects.all()
    serializer_class = NotificationMarkReadSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_object(self):
        notification = super().get_object()
        if notification.user != self.request.user:
            self.permission_denied(self.request)
        return notification

    def update(self, request, *args, **kwargs):
        notification = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        notification.is_read = serializer.validated_data['is_read']
        notification.save()
        
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationMarkReadSerializer

    def post(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({'detail': 'All notifications marked as read'}, status=status.HTTP_200_OK)


class NotificationDeleteAPIView(generics.DestroyAPIView):
    queryset = Notification.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'pk'

    def get_object(self):
        notification = super().get_object()
        if notification.user != self.request.user:
            self.permission_denied(self.request)
        return notification


class NotificationUnreadCountAPIView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = NotificationListSerializer

    def get(self, request):
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': unread_count})
