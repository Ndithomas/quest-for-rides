from django.urls import path
from . import views


urlpatterns = [
    path('cars/', views.CarListCreateAPIView.as_view()),
    path('cars/<int:pk>/', views.CarDetailAPIView.as_view()),
    path('owner/cars/<int:pk>/', views.OwnerCarDetailAPIView.as_view()),  
    path('cars/<int:car_id>/photos/', views.CarPhotoCreateAPIView.as_view()),
    path('photos/<int:pk>/set-primary/', views.SetPrimaryPhotoAPIView.as_view()),  
    path('cars/<int:car_id>/availability/', views.AvailabilityListCreateAPIView.as_view()),
    path('cars/<int:car_id>/pricing/', views.PricingRuleListCreateAPIView.as_view()),
    path('cars/<int:pk>/toggle-status/', views.CarToggleStatusAPIView.as_view()),
    path('search/', views.PublicCarSearchAPIView.as_view()),
    path('cars/<int:pk>/verify/', views.CarVerifyAPIView.as_view()),
    path('cars/all/', views.ManagementAllCarsAPIView.as_view()),
    path('cars/<int:pk>/mark-available/', views.MarkCarAvailableAPIView.as_view()),
]