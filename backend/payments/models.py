from django.db import models
from bookings.models import Booking, BookingPayment
from userAuth.models import User


class PaymentTransaction(models.Model):
    TRANSACTION_TYPE = [
        ('booking', 'Booking Payment'),
        ('refund', 'Refund'),
        ('adjustment', 'Adjustment'),
    ]
    
    booking_payment = models.ForeignKey(BookingPayment, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPE, default='booking')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=BookingPayment.PAYMENT_STATUS, default='pending')
    payment_method = models.CharField(max_length=50, blank=True)
    external_transaction_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    
    # For tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.transaction_type} - {self.amount} ({self.status})"


class PaymentMethod(models.Model):
    """Store user payment methods"""
    PAYMENT_TYPE = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('mobile_wallet', 'Mobile Wallet'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payment_methods')
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE)
    is_default = models.BooleanField(default=False)
    last_four = models.CharField(max_length=4, blank=True)  # Last 4 digits of card
    expiry_month = models.IntegerField(blank=True, null=True)
    expiry_year = models.IntegerField(blank=True, null=True)
    holder_name = models.CharField(max_length=100, blank=True)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('user', 'last_four', 'payment_type')
    
    def __str__(self):
        return f"{self.user.username} - {self.get_payment_type_display()} ****{self.last_four}"


class PaymentInvoice(models.Model):
    booking_payment = models.OneToOneField(BookingPayment, on_delete=models.CASCADE, related_name='invoice')
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
