from django.db import models
from userAuth.models import User


class Car(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('booked', 'Booked'),                    # ← New: means currently rented
        ('maintenance', 'Under Maintenance'),
        ('inactive', 'Inactive'),
    ]
    
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="cars", limit_choices_to={'role': 'owner'})
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.PositiveIntegerField()
    license_plate = models.CharField(max_length=20, unique=True)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    features = models.TextField(blank=True)
    location_name = models.CharField(max_length=255)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    daily_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)  # Added this missing field
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} • {self.owner.username}"


class CarPhoto(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="photos")
    image = models.ImageField(upload_to="cars/", blank=True, null=True)  # Similar to profile_picture
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if self.is_primary:
            CarPhoto.objects.filter(car=self.car).exclude(id=self.id).update(is_primary=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Photo of {self.car}"


class Availability(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="availability")
    date = models.DateField()
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('car', 'date')

    def __str__(self):
        return f"{self.car.license_plate} | {self.date} → {'Available' if self.is_available else 'Booked'}"


class PricingRule(models.Model):
    car = models.ForeignKey(Car, on_delete=models.CASCADE, related_name="pricing_rules")
    PERIOD_CHOICES = [('day', 'Per Day'), ('week', 'Per Week'), ('month', 'Per Month')]
    period = models.CharField(max_length=10, choices=PERIOD_CHOICES)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        if self.start_date:
            return f"{self.car.title} → {self.get_period_display()}: ${self.price} ({self.start_date} to {self.end_date})"
        return f"{self.car.title} → {self.get_period_display()}: ${self.price}"