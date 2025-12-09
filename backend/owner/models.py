from django.db import models
from userAuth.models import User


class OwnerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="owner_profile")
    profile_picture = models.ImageField(upload_to="profiles/owner/", blank=True, null=True)
    status = models.CharField(max_length=30, default="Active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} (Owner)"