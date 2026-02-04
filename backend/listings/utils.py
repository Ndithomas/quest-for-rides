from django.utils import timezone
from bookings.models import Booking


def get_status_badge(car):
    today = timezone.now().date()
    is_booked_today = Booking.objects.filter(
        car=car,
        status='confirmed',
        start_date__lte=today,
        end_date__gte=today
    ).exists()
    if is_booked_today:
        return 'booked'
    recently_returned = Booking.objects.filter(
        car=car,
        status='confirmed',
        end_date__lt=today,
        end_date__gte=today - timezone.timedelta(days=2)
    ).exists()
    if recently_returned:
        return 'recently-returned'
    return car.status


def get_status_display(car):
    today = timezone.now().date()
    is_booked_today = Booking.objects.filter(
        car=car,
        status='confirmed',
        start_date__lte=today,
        end_date__gte=today
    ).exists()
    if is_booked_today:
        return "Booked"
    recently_returned = Booking.objects.filter(
        car=car,
        status='confirmed',
        end_date__lt=today,
        end_date__gte=today - timezone.timedelta(days=2)
    ).exists()
    if recently_returned:
        return "Returned – Awaiting Check"
    mapping = {
        'available': 'Available',
        'maintenance': 'Under Maintenance',
        'inactive': 'Unavailable',
        'booked': 'Booked',
    }
    return mapping.get(car.status, 'Unavailable')
