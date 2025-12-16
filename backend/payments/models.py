from django.db import models
from bookings.models import Booking, BookingPayment


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