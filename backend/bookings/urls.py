from django.urls import path
from . import views

urlpatterns = [
    path('', views.BookingListCreateAPIView.as_view()),
    path('<int:pk>/', views.BookingDetailAPIView.as_view()),
    path('<int:pk>/confirm/', views.BookingConfirmAPIView.as_view()),
    path('<int:pk>/update-status/', views.BookingUpdateStatusAPIView.as_view()),
    path('<int:pk>/guest-cancel/', views.GuestCancelBookingAPIView.as_view()),
    path('my-bookings/', views.MyBookingsAPIView.as_view()),
    path('pending-confirmations/', views.PendingConfirmationsAPIView.as_view()),
    path('all-bookings/', views.AllBookingsAPIView.as_view()),
    path('<int:pk>/owner-cancel-unpaid/', views.OwnerCancelUnpaidBookingAPIView.as_view()),
    path('stats/', views.BookingStatsAPIView.as_view()),
]