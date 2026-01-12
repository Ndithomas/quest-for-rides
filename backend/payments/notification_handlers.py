from notifications.models import Notification
from bookings.models import BookingPayment
from .models import Payout
from django.contrib.contenttypes.models import ContentType
from userAuth.models import User


def notify_payment_status_change(payment: BookingPayment, new_status: str, old_status: str = None):
    booking = payment.booking
    booking_title = booking.car.title
    
    status_messages = {
        'completed': {
            'guest_title': 'Payment Successful ✅',
            'guest_msg': f'Your payment of XAF {payment.amount} for {booking_title} has been completed.',
            'owner_title': 'Payment Received 💰',
            'owner_msg': f'Payment of XAF {payment.amount} from {booking.guest.username} for {booking_title} has been completed.',
            'notification_type': 'payment_completed'
        },
        'failed': {
            'guest_title': 'Payment Failed ❌',
            'guest_msg': f'Your payment for {booking_title} has failed. Please try again.',
            'owner_title': 'Payment Failed',
            'owner_msg': f'Payment from {booking.guest.username} for {booking_title} has failed.',
            'notification_type': 'payment_failed'
        },
        'refunded': {
            'guest_title': 'Payment Refunded ↩️',
            'guest_msg': f'Your payment of XAF {payment.amount} for {booking_title} has been refunded.',
            'owner_title': 'Payment Refunded',
            'owner_msg': f'Payment of XAF {payment.amount} from {booking.guest.username} for {booking_title} has been refunded.',
            'notification_type': 'payment_refunded'
        }
    }
    
    if new_status not in status_messages:
        return
    
    msg_config = status_messages[new_status]
    content_type = ContentType.objects.get_for_model(BookingPayment)
    
    # Notify guest
    Notification.objects.create(
        user=booking.guest,
        notification_type=msg_config['notification_type'],
        title=msg_config['guest_title'],
        message=msg_config['guest_msg'],
        content_type=content_type,
        object_id=payment.id
    )
    
    # Notify owner
    Notification.objects.create(
        user=booking.owner,
        notification_type=msg_config['notification_type'],
        title=msg_config['owner_title'],
        message=msg_config['owner_msg'],
        content_type=content_type,
        object_id=payment.id
    )


def notify_payout_requested(payout: Payout, owner: User):
    content_type = ContentType.objects.get_for_model(Payout)
    
    # Notify owner
    Notification.objects.create(
        user=owner,
        notification_type='payout_requested',
        title='Payout Request Submitted',
        message=f'Your payout request of XAF {payout.amount} has been submitted for review.',
        content_type=content_type,
        object_id=payout.id
    )
    
    # Notify all management staff
    management_users = User.objects.filter(is_staff=True)
    for admin in management_users:
        Notification.objects.create(
            user=admin,
            notification_type='payout_requested',
            title='New Payout Request 🔔',
            message=f'{owner.username} has requested a payout of XAF {payout.amount}.',
            content_type=content_type,
            object_id=payout.id
        )


def notify_payout_approved(payout: Payout):
    """Notify owner when payout is approved."""
    Notification.objects.create(
        user=payout.owner,
        notification_type='payout_approved',
        title='Payout Approved ✅',
        message=f'Your payout request of XAF {payout.amount} has been approved and is being processed.',
        content_type=ContentType.objects.get_for_model(Payout),
        object_id=payout.id
    )


def notify_payout_completed(payout: Payout):
    """Notify owner when payout is completed."""
    Notification.objects.create(
        user=payout.owner,
        notification_type='payout_completed',
        title='Payout Completed 💰',
        message=f'Your payout of XAF {payout.amount} has been completed and transferred to {payout.phone_number}.',
        content_type=ContentType.objects.get_for_model(Payout),
        object_id=payout.id
    )


def notify_payout_rejected(payout: Payout, reason: str = None):
    """Notify owner when payout is rejected."""
    reason_text = reason or 'Rejected by admin'
    Notification.objects.create(
        user=payout.owner,
        notification_type='payout_rejected',
        title='Payout Rejected ❌',
        message=f'Your payout request of XAF {payout.amount} has been rejected. Reason: {reason_text}',
        content_type=ContentType.objects.get_for_model(Payout),
        object_id=payout.id
    )
