from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.contenttypes.models import ContentType
from bookings.models import Booking, BookingPayment, BookingReview
from listings.models import Car
from payments.models import Payout
from .models import Notification


# ==================== BOOKING SIGNALS ====================

@receiver(post_save, sender=Booking)
def booking_created_notification(sender, instance, created, **kwargs):
    """Send notification when a booking is created"""
    if created:
        # Notify owner
        Notification.objects.create(
            user=instance.owner,
            notification_type='booking_created',
            title=f'New Booking from {instance.guest.username}',
            message=f'{instance.guest.username} has requested to book {instance.car.title} from {instance.start_date} to {instance.end_date}',
            content_type=ContentType.objects.get_for_model(Booking),
            object_id=instance.id
        )


@receiver(post_save, sender=Booking)
def booking_status_notification(sender, instance, created, update_fields, **kwargs):
    """Send notification when booking status changes"""
    if not created and update_fields:
        if 'status' in update_fields:
            if instance.status == 'confirmed':
                # Notify guest
                Notification.objects.create(
                    user=instance.guest,
                    notification_type='booking_confirmed',
                    title='Booking Confirmed',
                    message=f'{instance.owner.username} has confirmed your booking for {instance.car.title} from {instance.start_date} to {instance.end_date}',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
                # Notify owner
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='booking_confirmed',
                    title='Booking Confirmed',
                    message=f'You have confirmed booking from {instance.guest.username} for {instance.car.title}',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
            
            elif instance.status == 'rejected':
                # Notify guest
                Notification.objects.create(
                    user=instance.guest,
                    notification_type='booking_rejected',
                    title='Booking Rejected',
                    message=f'{instance.owner.username} has rejected your booking for {instance.car.title}. Reason: {instance.rejection_reason}',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
                # Notify owner
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='booking_rejected',
                    title='Booking Rejected',
                    message=f'You have rejected booking from {instance.guest.username} for {instance.car.title}',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
            
            elif instance.status == 'cancelled':
                # Notify both parties
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='booking_cancelled',
                    title='Booking Cancelled',
                    message=f'Booking for {instance.car.title} by {instance.guest.username} has been cancelled',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
                Notification.objects.create(
                    user=instance.guest,
                    notification_type='booking_cancelled',
                    title='Booking Cancelled',
                    message=f'Your booking for {instance.car.title} has been cancelled',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
            
            elif instance.status == 'completed':
                # Notify both parties
                Notification.objects.create(
                    user=instance.guest,
                    notification_type='booking_completed',
                    title='Booking Completed',
                    message=f'Your booking for {instance.car.title} has been completed. Please leave a review!',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='booking_completed',
                    title='Booking Completed',
                    message=f'Booking for {instance.car.title} by {instance.guest.username} has been completed',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
            
            elif instance.status == 'active':
                # Notify both parties when rental starts
                Notification.objects.create(
                    user=instance.guest,
                    notification_type='booking_confirmed',
                    title='Rental Started',
                    message=f'Your rental of {instance.car.title} has started. Enjoy your ride!',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='booking_confirmed',
                    title='Rental Started',
                    message=f'Rental of {instance.car.title} by {instance.guest.username} has started',
                    content_type=ContentType.objects.get_for_model(Booking),
                    object_id=instance.id
                )


# ==================== PAYMENT SIGNALS ====================

@receiver(post_save, sender=BookingPayment)
def payment_notification(sender, instance, created, update_fields, **kwargs):
    """Send notification when payment status changes"""
    booking = instance.booking
    
    if not created and update_fields:
        if 'status' in update_fields:
            if instance.status == 'completed':
                # Notify both parties
                Notification.objects.create(
                    user=booking.guest,
                    notification_type='payment_completed',
                    title='Payment Successful',
                    message=f'Your payment of {instance.amount} for {booking.car.title} has been completed successfully',
                    content_type=ContentType.objects.get_for_model(BookingPayment),
                    object_id=instance.id
                )
                Notification.objects.create(
                    user=booking.owner,
                    notification_type='payment_completed',
                    title='Payment Received',
                    message=f'Payment of {instance.amount} from {booking.guest.username} for {booking.car.title} has been completed',
                    content_type=ContentType.objects.get_for_model(BookingPayment),
                    object_id=instance.id
                )
            
            elif instance.status == 'failed':
                # Notify guest
                Notification.objects.create(
                    user=booking.guest,
                    notification_type='payment_failed',
                    title='Payment Failed',
                    message=f'Your payment for {booking.car.title} has failed. Please try again or contact support',
                    content_type=ContentType.objects.get_for_model(BookingPayment),
                    object_id=instance.id
                )
                # Notify owner
                Notification.objects.create(
                    user=booking.owner,
                    notification_type='payment_failed',
                    title='Payment Failed',
                    message=f'Payment from {booking.guest.username} for {booking.car.title} has failed',
                    content_type=ContentType.objects.get_for_model(BookingPayment),
                    object_id=instance.id
                )
            
            elif instance.status == 'refunded':
                # Notify both parties
                Notification.objects.create(
                    user=booking.guest,
                    notification_type='payment_failed',
                    title='Payment Refunded',
                    message=f'Your payment of {instance.amount} for {booking.car.title} has been refunded',
                    content_type=ContentType.objects.get_for_model(BookingPayment),
                    object_id=instance.id
                )
                Notification.objects.create(
                    user=booking.owner,
                    notification_type='payment_failed',
                    title='Refund Processed',
                    message=f'Refund of {instance.amount} to {booking.guest.username} for {booking.car.title} has been processed',
                    content_type=ContentType.objects.get_for_model(BookingPayment),
                    object_id=instance.id
                )


# ==================== CAR VERIFICATION SIGNALS ====================

@receiver(post_save, sender=Car)
def car_verification_notification(sender, instance, created, update_fields, **kwargs):
    """Send notification when car verification status changes"""
    if not created and update_fields:
        if 'is_verified' in update_fields:
            if instance.is_verified:
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='car_verified',
                    title='Car Verified',
                    message=f'Your car "{instance.title}" has been verified and approved by management',
                    content_type=ContentType.objects.get_for_model(Car),
                    object_id=instance.id
                )


# ==================== REVIEW SIGNALS ====================

@receiver(post_save, sender=BookingReview)
def review_notification(sender, instance, created, **kwargs):
    """Send notification when a review is posted"""
    if created:
        booking = instance.booking
        # Notify the other party
        if instance.reviewer == booking.guest:
            # Owner received a review from guest
            Notification.objects.create(
                user=booking.owner,
                notification_type='review_received',
                title='New Review Received',
                message=f'{instance.reviewer.username} has reviewed your car "{booking.car.title}" with {instance.rating} stars: "{instance.comment}"',
                content_type=ContentType.objects.get_for_model(BookingReview),
                object_id=instance.id
            )
        else:
            # Guest received a review from owner
            Notification.objects.create(
                user=booking.guest,
                notification_type='review_received',
                title='New Review Received',
                message=f'{instance.reviewer.username} has reviewed your rental experience with {instance.rating} stars: "{instance.comment}"',
                content_type=ContentType.objects.get_for_model(BookingReview),
                object_id=instance.id
            )


# ==================== PAYOUT/WITHDRAWAL SIGNALS ====================

@receiver(post_save, sender=Payout)
def payout_notification(sender, instance, created, update_fields, **kwargs):
    """Send notifications for payout requests and status changes"""
    
    # New payout request from owner
    if created:
        # Get management users
        from userAuth.models import User
        management_users = User.objects.filter(role='management')
        
        for mgmt_user in management_users:
            Notification.objects.create(
                user=mgmt_user,
                notification_type='booking_created',  # Reusing type, or could add new type
                title='New Payout Request',
                message=f'{instance.owner.username} has requested a payout of {instance.amount} via {instance.get_payment_method_display()}',
                content_type=ContentType.objects.get_for_model(Payout),
                object_id=instance.id
            )
        
        # Notify owner of submission
        Notification.objects.create(
            user=instance.owner,
            notification_type='booking_created',
            title='Payout Request Submitted',
            message=f'Your payout request of {instance.amount} has been submitted and is pending approval',
            content_type=ContentType.objects.get_for_model(Payout),
            object_id=instance.id
        )
    
    # Payout status changes
    elif not created and update_fields:
        if 'status' in update_fields:
            if instance.status == 'approved':
                # Notify owner
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='payment_completed',
                    title='Payout Approved',
                    message=f'Your payout request of {instance.amount} has been approved and is being processed',
                    content_type=ContentType.objects.get_for_model(Payout),
                    object_id=instance.id
                )
                
                # Notify management
                management_users = User.objects.filter(role='management')
                for mgmt_user in management_users:
                    Notification.objects.create(
                        user=mgmt_user,
                        notification_type='booking_confirmed',
                        title='Payout Approved',
                        message=f'Payout of {instance.amount} to {instance.owner.username} has been approved',
                        content_type=ContentType.objects.get_for_model(Payout),
                        object_id=instance.id
                    )
            
            elif instance.status == 'processing':
                # Notify owner
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='payment_completed',
                    title='Payout Processing',
                    message=f'Your payout of {instance.amount} is now being processed. You will receive it shortly',
                    content_type=ContentType.objects.get_for_model(Payout),
                    object_id=instance.id
                )
                
                # Notify management
                management_users = User.objects.filter(role='management')
                for mgmt_user in management_users:
                    Notification.objects.create(
                        user=mgmt_user,
                        notification_type='booking_confirmed',
                        title='Payout Processing',
                        message=f'Payout of {instance.amount} to {instance.owner.username} is being processed',
                        content_type=ContentType.objects.get_for_model(Payout),
                        object_id=instance.id
                    )
            
            elif instance.status == 'completed':
                # Notify owner - payment sent
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='payment_completed',
                    title='Payout Completed',
                    message=f'Your payout of {instance.amount} has been successfully sent to {instance.get_payment_method_display()}',
                    content_type=ContentType.objects.get_for_model(Payout),
                    object_id=instance.id
                )
                
                # Notify management
                management_users = User.objects.filter(role='management')
                for mgmt_user in management_users:
                    Notification.objects.create(
                        user=mgmt_user,
                        notification_type='payment_completed',
                        title='Payout Completed',
                        message=f'Payout of {instance.amount} to {instance.owner.username} has been completed',
                        content_type=ContentType.objects.get_for_model(Payout),
                        object_id=instance.id
                    )
            
            elif instance.status == 'failed':
                # Notify owner - payment failed
                Notification.objects.create(
                    user=instance.owner,
                    notification_type='payment_failed',
                    title='Payout Failed',
                    message=f'Your payout of {instance.amount} has failed. Please contact support for assistance',
                    content_type=ContentType.objects.get_for_model(Payout),
                    object_id=instance.id
                )
                
                # Notify management
                management_users = User.objects.filter(role='management')
                for mgmt_user in management_users:
                    Notification.objects.create(
                        user=mgmt_user,
                        notification_type='payment_failed',
                        title='Payout Failed',
                        message=f'Payout of {instance.amount} to {instance.owner.username} has failed',
                        content_type=ContentType.objects.get_for_model(Payout),
                        object_id=instance.id
                    )
