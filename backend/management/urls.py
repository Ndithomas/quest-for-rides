# management/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('management-profile/', views.ManagementProfileView.as_view()),
    path('management-profile/<int:pk>/', views.ManagementProfileDetailView.as_view()),
    
    # Dashboard & Data
    path('dashboard/stats/', views.ManagementDashboardStatsView.as_view()),
    path('users/', views.AllUsersListView.as_view()),
    path('users/<int:user_id>/', views.UserDetailView.as_view()),
    path('cars/', views.AllCarsListView.as_view()),
    path('users/search/', views.UserSearchView.as_view()),
    path('users/<int:user_id>/change-status/', views.ChangeUserStatusView.as_view()),
]