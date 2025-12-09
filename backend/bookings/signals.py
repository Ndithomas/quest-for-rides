from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from .models import Booking

@receiver(post_save, sender=Booking)
def notify_owner_on_booking_created(sender, instance, created, **kwargs):
    """Send email notification to owner when a new booking is created"""
    if created and instance.status == 'pending':
        try:
            # Get owner email
            owner_email = instance.owner.email
            guest_name = f"{instance.guest.first_name} {instance.guest.last_name}".strip() or instance.guest.username
            
            # Email context
            context = {
                'owner_name': instance.owner.first_name or instance.owner.username,
                'guest_name': guest_name,
                'car_title': instance.car.title,
                'car_make': instance.car.make,
                'car_model': instance.car.model,
                'start_date': instance.start_date.strftime('%B %d, %Y'),
                'end_date': instance.end_date.strftime('%B %d, %Y'),
                'total_price': instance.total_price,
                'booking_id': instance.id,
                'guest_email': instance.guest.email,
                'guest_phone': instance.guest.phone_number or 'Not provided',
                'special_requirements': instance.special_requirements or 'None',
                'dashboard_link': f"{settings.FRONTEND_URL}/owner/bookings" if hasattr(settings, 'FRONTEND_URL') else 'Dashboard',
            }
            
            # Render email template
            subject = f"New Booking Request: {instance.car.title} ({instance.start_date.strftime('%b %d')} - {instance.end_date.strftime('%b %d')})"
            html_message = render_to_string('bookings/owner_notification_email.html', context)
            
            # Send email
            send_mail(
                subject,
                f"New booking request from {guest_name} for your {instance.car.title}",
                settings.DEFAULT_FROM_EMAIL,
                [owner_email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending owner notification email: {str(e)}")


@receiver(post_save, sender=Booking)
def notify_guest_on_booking_confirmed(sender, instance, created, update_fields, **kwargs):
    """Send email notification to guest when booking is confirmed by owner"""
    if not created and update_fields and 'status' in update_fields and instance.status == 'confirmed':
        try:
            guest_email = instance.guest.email
            owner_name = f"{instance.owner.first_name} {instance.owner.last_name}".strip() or instance.owner.username
            
            context = {
                'guest_name': instance.guest.first_name or instance.guest.username,
                'owner_name': owner_name,
                'car_title': instance.car.title,
                'start_date': instance.start_date.strftime('%B %d, %Y'),
                'end_date': instance.end_date.strftime('%B %d, %Y'),
                'total_price': instance.total_price,
                'booking_id': instance.id,
                'owner_email': instance.owner.email,
                'owner_phone': instance.owner.phone_number or 'Available in app',
                'bookings_link': f"{settings.FRONTEND_URL}/bookings" if hasattr(settings, 'FRONTEND_URL') else 'My Bookings',
            }
            
            subject = f"Booking Confirmed: {instance.car.title}"
            html_message = render_to_string('bookings/guest_confirmation_email.html', context)
            
            send_mail(
                subject,
                f"Your booking for {instance.car.title} has been confirmed by {owner_name}!",
                settings.DEFAULT_FROM_EMAIL,
                [guest_email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending guest confirmation email: {str(e)}")


@receiver(post_save, sender=Booking)
def notify_guest_on_booking_rejected(sender, instance, created, update_fields, **kwargs):
    """Send email notification to guest when booking is rejected by owner"""
    if not created and update_fields and 'status' in update_fields and instance.status == 'rejected':
        try:
            guest_email = instance.guest.email
            owner_name = f"{instance.owner.first_name} {instance.owner.last_name}".strip() or instance.owner.username
            
            context = {
                'guest_name': instance.guest.first_name or instance.guest.username,
                'owner_name': owner_name,
                'car_title': instance.car.title,
                'start_date': instance.start_date.strftime('%B %d, %Y'),
                'end_date': instance.end_date.strftime('%B %d, %Y'),
                'rejection_reason': instance.rejection_reason or 'No reason provided',
                'booking_id': instance.id,
                'listings_link': f"{settings.FRONTEND_URL}/listings" if hasattr(settings, 'FRONTEND_URL') else 'Browse Cars',
            }
            
            subject = f"Booking Update: {instance.car.title}"
            html_message = render_to_string('bookings/guest_rejection_email.html', context)
            
            send_mail(
                subject,
                f"Your booking for {instance.car.title} was not confirmed",
                settings.DEFAULT_FROM_EMAIL,
                [guest_email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Error sending guest rejection email: {str(e)}")
