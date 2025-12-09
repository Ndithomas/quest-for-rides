# userAuth/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if not created:
        return

    role = instance.role

    if role == "guest":
        from guest.models import GuestProfile
        GuestProfile.objects.get_or_create(user=instance)

    elif role == "owner":
        from owner.models import OwnerProfile
        OwnerProfile.objects.get_or_create(user=instance)

    elif role == "management":
        from management.models import ManagementProfile
        ManagementProfile.objects.get_or_create(user=instance)