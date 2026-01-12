from django.test import TestCase
from notifications.models import Notification
from userAuth.models import User


class NotificationTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role='guest',
            password='testpass123'
        )

    def test_notification_creation(self):
        notification = Notification.objects.create(
            user=self.user,
            notification_type='booking_created',
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertEqual(notification.user, self.user)
        self.assertEqual(notification.notification_type, 'booking_created')
        self.assertFalse(notification.is_read)

    def test_notification_mark_read(self):
        notification = Notification.objects.create(
            user=self.user,
            notification_type='booking_created',
            title='Test Notification',
            message='This is a test notification'
        )
        notification.is_read = True
        notification.save()
        self.assertTrue(notification.is_read)
