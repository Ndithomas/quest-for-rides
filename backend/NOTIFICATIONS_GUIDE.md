# Notifications System Implementation

## Overview
A complete notification system has been implemented following your existing app patterns. It automatically creates notifications for key events in the Quest4Rides platform.

## Architecture

### 1. **Models** (`notifications/models.py`)
- **Notification Model**: Stores all notifications with:
  - User (ForeignKey to User)
  - Notification Type (choices: booking_created, booking_confirmed, payment_completed, etc.)
  - Title & Message
  - Generic relation (content_type + object_id) to link to any model
  - is_read flag
  - Timestamps with database indexes for performance

### 2. **Serializers** (`notifications/serializers.py`)
- **NotificationSerializer**: Full notification details
- **NotificationListSerializer**: Lightweight list view
- **NotificationMarkReadSerializer**: For marking as read

### 3. **Views** (`notifications/views.py`) - Using your APIView pattern
- `NotificationListAPIView`: GET - List user's notifications
- `NotificationDetailAPIView`: GET - Retrieve single notification
- `NotificationMarkReadAPIView`: PATCH - Mark notification as read
- `NotificationMarkAllReadAPIView`: POST - Mark all as read
- `NotificationDeleteAPIView`: DELETE - Delete notification
- `NotificationUnreadCountAPIView`: GET - Count unread notifications

### 4. **Signals** (`notifications/signals.py`)
Automatically creates notifications on model changes:

#### Booking Signals:
- `booking_created_notification`: When booking is created → notify owner
- `booking_status_notification`: When status changes → notify relevant parties
  - confirmed → notify guest
  - rejected → notify guest
  - cancelled → notify both
  - completed → notify both

#### Payment Signals:
- `payment_notification`: When payment status changes
  - completed → notify both parties
  - failed → notify guest

#### Car Signals:
- `car_verification_notification`: When car is verified → notify owner

#### Review Signals:
- `review_notification`: When review is posted → notify other party

## API Endpoints

```
GET    /api/notifications/                    - List all notifications
GET    /api/notifications/<id>/               - Get notification detail
PATCH  /api/notifications/<id>/read/          - Mark as read
POST   /api/notifications/mark-all-read/      - Mark all as read
DELETE /api/notifications/<id>/delete/        - Delete notification
GET    /api/notifications/unread-count/       - Get unread count
```

## How It Works

### 1. **Automatic Trigger**
When any of these events happen:
```python
# Example: Booking created
booking = Booking.objects.create(...)  # Signal fires automatically
```

### 2. **Notification Created**
Signal handler creates notification:
```python
Notification.objects.create(
    user=owner,
    notification_type='booking_created',
    title='New Booking from guest_name',
    message='Guest has requested to book...',
    content_type=ContentType.objects.get_for_model(Booking),
    object_id=booking.id
)
```

### 3. **Frontend Retrieval**
Frontend can fetch notifications:
```
GET /api/notifications/ 
```
Response:
```json
[
  {
    "id": 1,
    "notification_type": "booking_created",
    "title": "New Booking from John",
    "message": "John has requested to book Toyota Camry...",
    "is_read": false,
    "created_at": "2024-01-12T10:30:00Z"
  }
]
```

### 4. **Mark as Read**
```
PATCH /api/notifications/1/read/
{"is_read": true}
```

## Features

✅ **Type-safe**: Different notification types for different events
✅ **Linked**: Each notification links to the related object (booking, payment, etc.)
✅ **Indexed**: Database indexes on user + date for fast queries
✅ **Read Status**: Track which notifications user has seen
✅ **Bulk Operations**: Mark all as read in one request
✅ **Unread Count**: Quick endpoint for badge count
✅ **Permission Protected**: Only users can see their own notifications
✅ **Admin Panel**: Full notification management in Django admin

## Database Queries

View user's unread notifications:
```python
notifications = Notification.objects.filter(
    user=request.user, 
    is_read=False
).order_by('-created_at')
```

Get notifications for a specific booking:
```python
booking = Booking.objects.get(id=1)
notifications = Notification.objects.filter(
    content_type=ContentType.objects.get_for_model(Booking),
    object_id=booking.id
)
```

## Testing

Run tests:
```bash
python manage.py test notifications
```

Basic test cases included in `notifications/tests.py`

## Future Enhancements

1. **Email Notifications**: Use Celery to send emails alongside database notifications
2. **WebSockets**: Real-time notifications with Django Channels
3. **Notification Preferences**: Let users choose which notifications to receive
4. **Notification Groups**: Group similar notifications
5. **Push Notifications**: Mobile push notifications via Firebase

## Files Created

```
notifications/
├── __init__.py
├── admin.py           # Admin registration
├── apps.py            # App config with signals ready
├── models.py          # Notification model
├── serializers.py     # DRF serializers
├── signals.py         # Signal handlers for auto notifications
├── tests.py           # Unit tests
├── urls.py            # API routes
├── views.py           # API views
└── migrations/
    └── 0001_initial.py
```

## Configuration

Already added to:
- `settings.py`: Added 'notifications' to INSTALLED_APPS
- `urls.py`: Added route to main urlpatterns
- `apps.py`: Auto imports signals.py on app startup
