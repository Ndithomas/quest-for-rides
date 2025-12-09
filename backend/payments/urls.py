# payments/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Your existing endpoints
    path('booking/<int:booking_id>/', views.BookingPaymentDetailView.as_view()),
    path('booking/<int:booking_id>/status-update/', views.PaymentStatusUpdateView.as_view()),
    path('booking/<int:booking_id>/refund/', views.PaymentRefundView.as_view()),
    path('list/', views.PaymentListView.as_view()),
    path('analytics/', views.PaymentAnalyticsView.as_view()),

    # ==== NEW: Payment Methods (simple, no ViewSet router) ====
    path('methods/', views.PaymentMethodListCreateView.as_view()),
    path('methods/<int:pk>/', views.PaymentMethodDetailView.as_view()),
    path('methods/<int:_id>/set-default/', views.PaymentMethodSetDefaultView.as_view()),
]