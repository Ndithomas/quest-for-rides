# Complete Notification System - Setup & Usage Guide

## System Overview

A complete, production-ready notification system has been implemented across both backend and frontend.

### Architecture

```
Backend (Django)
├── Model: Notification
├── Signals: Auto-create on events
├── API: 6 endpoints
└── Admin: Full management

Frontend (Angular)
├── Service: NotificationService
├── Component: NotificationsComponent
├── Navbar: Integration with badge
└── Auto-polling: Every 30 seconds
```

---

## Backend Setup ✅

### Installation Steps (Already Done)

1. ✅ Created `notifications` app with all files
2. ✅ Created database migrations
3. ✅ Applied migrations
4. ✅ Registered in `settings.py`
5. ✅ Added routes in `urls.py`
6. ✅ Created signal handlers

### Database Model

**Notification Table:**
```
- id (primary key)
- user (ForeignKey to User)
- notification_type (choices: booking_created, etc.)
- title (CharField)
- message (TextField)
- is_read (Boolean)
- content_type, object_id (Generic relations)
- created_at, updated_at (Timestamps)
```

**Indexes:**
- user + created_at (for fast lookups)
- user + is_read (for unread count)

### Backend API Endpoints

```
GET    /api/notifications/                    → List user's notifications
GET    /api/notifications/<id>/               → Get notification detail
PATCH  /api/notifications/<id>/read/          → Mark as read
POST   /api/notifications/mark-all-read/      → Mark all as read
DELETE /api/notifications/<id>/delete/        → Delete notification
GET    /api/notifications/unread-count/       → Get unread count
```

### Automatic Notification Triggers

Notifications are automatically created when:

| Event | Trigger | Notifies |
|-------|---------|----------|
| Booking Created | `Booking.objects.create()` | Owner |
| Booking Confirmed | Status changed to 'confirmed' | Guest |
| Booking Rejected | Status changed to 'rejected' | Guest |
| Booking Cancelled | Status changed to 'cancelled' | Both parties |
| Booking Completed | Status changed to 'completed' | Both parties |
| Payment Completed | Payment status = 'completed' | Both parties |
| Payment Failed | Payment status = 'failed' | Guest |
| Car Verified | is_verified = True | Owner |
| Review Posted | New BookingReview created | Other party |

### Testing Backend

```bash
cd backend
python manage.py test notifications
```

---

## Frontend Setup ✅

### Installation Steps (Already Done)

1. ✅ Created `NotificationService` in services/
2. ✅ Created `NotificationsComponent` 
3. ✅ Updated Navbar component
4. ✅ Added route in app.routes.ts
5. ✅ Integrated polling system

### Frontend Architecture

```typescript
// Notification Service
- BehaviorSubject for reactive updates
- Auto-polling every 30 seconds
- Handles all API calls

// Notifications Component
- List with filtering (all/unread/read)
- Mark as read/delete operations
- Type-based icons and colors
- Responsive design

// Navbar Integration
- Shows unread count badge
- Links to notifications page
- Real-time updates
```

### Frontend API Usage

**In any component:**
```typescript
import { NotificationService } from './services/notification.service';

constructor(private notificationService: NotificationService) {}

ngOnInit() {
  // Subscribe to unread count changes
  this.notificationService.unreadCount$.subscribe(count => {
    console.log('Unread:', count);
  });
}
```

### Routes

```
/notifications         → Full notifications page (all users)
```

Protected by: `roleAuthGuard` with roles `['guest', 'owner', 'management']`

---

## How It Works - End to End

### Scenario 1: New Booking Created

```
1. User creates booking
   ↓
2. Backend Booking.objects.create() called
   ↓
3. post_save signal fires
   ↓
4. Notification created in DB
   owner.notifications.create({
     type: 'booking_created',
     title: 'New Booking from guest_name',
     message: '...',
     object_id: booking.id
   })
   ↓
5. Frontend polls /api/notifications/unread-count/
   ↓
6. Navbar badge updates: "1"
   ↓
7. Owner clicks bell → /notifications
   ↓
8. NotificationsComponent loads all notifications
   ↓
9. Owner clicks notification → marked as read
   ↓
10. Badge decreases: "0"
```

### Scenario 2: Payment Completed

```
1. Payment processed successfully
   ↓
2. BookingPayment.status = 'completed'
   ↓
3. post_save signal fires
   ↓
4. Two notifications created:
   - For guest: "Payment Successful"
   - For owner: "Payment Received"
   ↓
5. Both users' badge counts increase
   ↓
6. When viewed, can mark all as read
```

---

## Key Features

### Backend Features
- ✅ Automatic trigger on events
- ✅ Generic relations (links to any model)
- ✅ Database indexing for performance
- ✅ Permission-based access
- ✅ Admin panel integration
- ✅ Bulk operations support

### Frontend Features
- ✅ Auto-polling (30-second refresh)
- ✅ Real-time badge updates
- ✅ Filter by type (all/unread/read)
- ✅ Bulk operations (mark all read)
- ✅ Delete functionality
- ✅ Type-based icons & colors
- ✅ Empty states
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Mobile-optimized

---

## Testing the System

### Backend Testing

```bash
# Test model creation
python manage.py shell
>>> from notifications.models import Notification
>>> from userAuth.models import User
>>> user = User.objects.first()
>>> Notification.objects.create(
...   user=user,
...   notification_type='booking_created',
...   title='Test',
...   message='Test notification'
... )
```

### Frontend Testing (Manual)

1. **Create a booking as guest**
   - Owner receives notification
   - Badge shows "1"

2. **Go to /notifications**
   - See booking notification
   - Click to mark as read
   - Badge becomes "0"

3. **Complete a payment**
   - Both parties get notifications
   - Check badge updates

4. **Test filtering**
   - All/Unread/Read tabs work
   - Counts update correctly

---

## API Response Examples

### Get Notifications
```bash
GET /api/notifications/
```

Response:
```json
[
  {
    "id": 1,
    "notification_type": "booking_created",
    "title": "New Booking from John",
    "message": "John has requested to book Toyota Camry from 2024-01-15 to 2024-01-20",
    "is_read": false,
    "created_at": "2024-01-12T10:30:00Z"
  }
]
```

### Mark as Read
```bash
PATCH /api/notifications/1/read/
{"is_read": true}
```

### Get Unread Count
```bash
GET /api/notifications/unread-count/
```

Response:
```json
{"unread_count": 5}
```

---

## Configuration

### Backend Settings
- **App**: Added to `INSTALLED_APPS`
- **Routes**: Added to main `urls.py`
- **Signals**: Auto-imported in `apps.py`

### Frontend Config
- **Route**: Added to `app.routes.ts`
- **Navbar**: Integrated with service subscription
- **Polling**: 30 seconds (configurable in service)

---

## Performance Considerations

### Database
- Indexed queries: `(user, created_at)`, `(user, is_read)`
- Pagination ready (can be added)
- Soft deletes possible (can be added)

### Frontend
- Polling vs WebSocket (polling is sufficient for now)
- Service caching (BehaviorSubject)
- Lazy loading (component loads on demand)

### Optimization Tips
1. **Limit notifications**: Add pagination in future
2. **Archive old**: Add archival after 30 days
3. **Real-time**: Upgrade to WebSockets later
4. **Email**: Add email notifications via Celery

---

## Troubleshooting

### Notifications Not Appearing

1. **Check backend is running**
   ```bash
   curl http://localhost:8000/api/notifications/
   ```

2. **Check authentication**
   - Include JWT token in header
   - `Authorization: Bearer <token>`

3. **Check signal is firing**
   ```bash
   python manage.py shell
   >>> from notifications.models import Notification
   >>> Notification.objects.all().count()
   ```

### Navbar Badge Not Updating

1. **Check service is subscribed**
   - Navbar component should call `subscribeToNotifications()`

2. **Check polling is running**
   - Browser network tab: see 30-second requests

3. **Check permissions**
   - User must be authenticated

### Frontend Route Not Working

1. **Check route is registered**
   - Look in `app.routes.ts`

2. **Check guard is configured**
   - `roleAuthGuard` with proper roles

3. **Check component is imported**
   - Should be lazy loaded with `.then()`

---

## Files Summary

### Backend Files
```
notifications/
├── __init__.py
├── admin.py            # Admin registration
├── apps.py             # App config (imports signals)
├── models.py           # Notification model
├── serializers.py      # DRF serializers
├── signals.py          # Auto-creation logic
├── tests.py            # Unit tests
├── urls.py             # API routes
├── views.py            # API views (all generics)
└── migrations/
    └── 0001_initial.py # Database schema
```

### Frontend Files
```
src/
├── services/
│   ├── notification.service.ts       # Service logic
│   └── notification.service.spec.ts  # Tests
├── notifications/
│   ├── notifications.component.ts    # Component logic
│   ├── notifications.component.html  # Template
│   ├── notifications.component.scss  # Styles
│   └── notifications.component.spec.ts # Tests
├── navbar/
│   ├── navbar.component.ts           # Updated with service
│   ├── navbar.component.html         # Added notification link
│   └── navbar.component.scss         # Added styles
└── app/
    └── app.routes.ts                 # Added route
```

---

## Next Steps (Future Enhancement)

1. **WebSocket Support**: Real-time notifications
2. **Notification Preferences**: User settings
3. **Email Notifications**: Send emails for important events
4. **Mobile Push**: Firebase Cloud Messaging
5. **Notification Groups**: Combine similar notifications
6. **Sound Alerts**: Play sound on new notification
7. **Archive Feature**: Move old notifications to archive
8. **Pagination**: Load notifications in batches

---

## Support

For issues or questions, check:
- [Backend Guide](./backend/NOTIFICATIONS_GUIDE.md)
- [Frontend Guide](./frontend/NOTIFICATIONS_FRONTEND.md)
- [API Endpoints](./backend/notifications/urls.py)
- [Component Code](./frontend/src/notifications/notifications.component.ts)
