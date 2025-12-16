from django.urls import path
from . import views

urlpatterns = [
    path('booking/<int:booking_id>/', views.BookingPaymentDetailView.as_view()),
    path('booking/<int:booking_id>/initiate/', views.InitiateCamPayPaymentView.as_view()),
    path('booking/<int:booking_id>/check-status/', views.CheckCamPayStatusView.as_view()),
    path('booking/<int:booking_id>/status-update/', views.PaymentStatusUpdateView.as_view()),
    path('booking/<int:booking_id>/refund/', views.PaymentRefundView.as_view()),

    path('list/', views.PaymentListView.as_view()),
    path('analytics/', views.PaymentAnalyticsView.as_view()),

    path('owner/payments/', views.OwnerPaymentsListView.as_view()),
    path('owner/earnings/', views.OwnerEarningsView.as_view()),
    path('guest/payments/', views.GuestPaymentsListView.as_view()),
]