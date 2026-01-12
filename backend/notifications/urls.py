from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListAPIView.as_view()),
    path('<int:pk>/', views.NotificationDetailAPIView.as_view()),
    path('<int:pk>/read/', views.NotificationMarkReadAPIView.as_view()),
    path('mark-all-read/', views.NotificationMarkAllReadAPIView.as_view()),
    path('<int:pk>/delete/', views.NotificationDeleteAPIView.as_view()),
    path('unread-count/', views.NotificationUnreadCountAPIView.as_view()),
]
