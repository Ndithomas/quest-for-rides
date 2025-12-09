from django.db import models
from django.contrib.auth.models import AbstractUser

ROLE_CHOICES = (
    ("guest", "Guest"),
    ("owner", "Owner"),
    ("management", "Management"),
)

STATUS_CHOICES = (
    ("active", "Active"),
    ("inactive", "Inactive"),
    ("suspended", "Suspended"),
)

class User(AbstractUser):
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    address = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
   
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

    def __str__(self):
        return f"{self.username} <{self.email}> ({self.role})"