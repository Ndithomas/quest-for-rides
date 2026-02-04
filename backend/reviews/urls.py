from django.urls import path
from . import views

urlpatterns = [
    path('', views.ReviewListCreateAPIView.as_view()),
    path('<int:pk>/', views.ReviewDetailAPIView.as_view()),
    path('cars/<int:car_id>/', views.CarReviewsAPIView.as_view()),
    path('my-reviews/', views.MyReviewsAPIView.as_view()),
]
