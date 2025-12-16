from django.db import models
from django.core.exceptions import ValidationError
from userAuth.models import User
from listings.models import Car


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('rejected', 'Rejected'),
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    guest = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings_as_guest')
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings_as_owner')
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name='bookings')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    special_requirements = models.TextField(blank=True, null=True)
    owner_notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['guest', '-created_at']),
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['status']),
        ]
    
    def save(self, *args, **kwargs):
        num_days = (self.end_date - self.start_date).days
        if num_days < 1:
            raise ValidationError("End date must be after start date")
        self.total_price = self.daily_rate * num_days
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.guest.username} → {self.owner.username} | {self.car.title} ({self.status})"


class BookingPayment(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    payment_method = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True, unique=True)
    customer_phone = models.CharField(max_length=20, blank=True, null=True)  # e.g. 2376xxxxxxxx
    campay_reference = models.CharField(max_length=100, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Payment for Booking {self.booking.id} - {self.status}"


class BookingReview(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField(choices=[(i, str(i)) for i in range(1, 6)])
    comment = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('booking', 'reviewer')
    
    def __str__(self):
        return f"Review for Booking {self.booking.id} by {self.reviewer.username}"
