from django.core.management.base import BaseCommand
from django.contrib.contenttypes.models import ContentType
from notifications.models import Notification
from bookings.models import Booking, BookingPayment
from reviews.models import BookingReview
from listings.models import Car
from payments.models import Payout


class Command(BaseCommand):
    help = 'Populate object_id for existing notifications that are missing it'

    def handle(self, *args, **options):
        # Get content types
        booking_ct = ContentType.objects.get_for_model(Booking)
        booking_payment_ct = ContentType.objects.get_for_model(BookingPayment)
        car_ct = ContentType.objects.get_for_model(Car)
        booking_review_ct = ContentType.objects.get_for_model(BookingReview)
        payout_ct = ContentType.objects.get_for_model(Payout)

        updated_count = 0

        # Fix booking notifications
        booking_notifications = Notification.objects.filter(
            content_type=booking_ct,
            object_id__isnull=True
        )
        for notif in booking_notifications:
            # Try to find the booking from the message
            # Extract booking ID from related data or find the most recent booking for this user
            latest_booking = Booking.objects.filter(
                owner=notif.user
            ).order_by('-created_at').first()
            
            if latest_booking:
                notif.object_id = latest_booking.id
                notif.save()
                updated_count += 1
                self.stdout.write(f'Updated booking notification {notif.id} with booking_id {latest_booking.id}')

        # Fix booking payment notifications
        payment_notifications = Notification.objects.filter(
            content_type=booking_payment_ct,
            object_id__isnull=True
        )
        for notif in payment_notifications:
            latest_payment = BookingPayment.objects.filter(
                booking__guest=notif.user
            ).order_by('-created_at').first()
            
            if not latest_payment:
                latest_payment = BookingPayment.objects.filter(
                    booking__owner=notif.user
                ).order_by('-created_at').first()
            
            if latest_payment:
                notif.object_id = latest_payment.booking_id
                notif.save()
                updated_count += 1
                self.stdout.write(f'Updated payment notification {notif.id} with booking_id {latest_payment.booking_id}')

        # Fix car notifications
        car_notifications = Notification.objects.filter(
            content_type=car_ct,
            object_id__isnull=True
        )
        for notif in car_notifications:
            latest_car = Car.objects.filter(
                owner=notif.user
            ).order_by('-created_at').first()
            
            if latest_car:
                notif.object_id = latest_car.id
                notif.save()
                updated_count += 1
                self.stdout.write(f'Updated car notification {notif.id} with car_id {latest_car.id}')

        # Fix payout notifications
        payout_notifications = Notification.objects.filter(
            content_type=payout_ct,
            object_id__isnull=True
        )
        for notif in payout_notifications:
            latest_payout = Payout.objects.filter(
                owner=notif.user
            ).order_by('-created_at').first()
            
            if latest_payout:
                notif.object_id = latest_payout.id
                notif.save()
                updated_count += 1
                self.stdout.write(f'Updated payout notification {notif.id} with payout_id {latest_payout.id}')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully updated {updated_count} notifications with object_ids'
            )
        )
