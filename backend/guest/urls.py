from django.urls import path
from . import views

urlpatterns = [
    path('guest-profile/', views.GuestProfileView.as_view()),
    path('guest-profile/<int:pk>/', views.GuestProfileDetailView.as_view()),
]