from django.db import models
from bookings.models import Booking, BookingPayment
from userAuth.models import User


class PaymentTransaction(models.Model):
    TRANSACTION_TYPE = [
        ('booking', 'Booking Payment'),
        ('refund', 'Refund'),
        ('adjustment', 'Adjustment'),
    ]

    booking_payment = models.ForeignKey(
        BookingPayment,
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)  # Negative for refunds
    status = models.CharField(max_length=20, choices=BookingPayment.PAYMENT_STATUS)
    external_transaction_id = models.CharField(max_length=100, blank=True, null=True)  # CamPay reference
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.transaction_type} {self.amount} ({self.status})"


class PaymentInvoice(models.Model):
    booking_payment = models.OneToOneField(
        BookingPayment,
        on_delete=models.CASCADE,
        related_name='invoice'
    )
    invoice_number = models.CharField(max_length=50, unique=True)
    issued_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"Invoice {self.invoice_number}"


class PlatformCommission(models.Model):
    booking_payment = models.OneToOneField(
        BookingPayment,
        on_delete=models.CASCADE,
        related_name='commission'
    )
    platform_amount = models.DecimalField(max_digits=10, decimal_places=2)  # 10%
    owner_payout = models.DecimalField(max_digits=10, decimal_places=2)  # 90%
    refunded_platform = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refunded_owner = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Commission for Booking {self.booking_payment.booking.id}"


class Payout(models.Model):
    PAYOUT_STATUS = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    PAYOUT_METHOD = [
        ('campay', 'CamPay'),
        ('bank_transfer', 'Bank Transfer'),
        ('mtn_momo', 'MTN Mobile Money'),
        ('orange_money', 'Orange Money'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payouts')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYOUT_STATUS, default='pending')
    payment_method = models.CharField(max_length=20, choices=PAYOUT_METHOD)
    phone_number = models.CharField(max_length=20)
    external_reference = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True)
    
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Payout {self.id} - {self.owner.username} - {self.amount} ({self.status})"