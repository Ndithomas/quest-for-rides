from django.urls import path
from . import views

urlpatterns = [
    path('owner-profile/', views.OwnerProfileView.as_view()),
    path('owner-profile/<int:pk>/', views.OwnerProfileDetailView.as_view()),
]