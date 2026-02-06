# Quest4Rides Payment System Documentation

## Overview

Quest4Rides uses a **CamPay integration** for processing mobile money payments in Cameroon (XAF currency). The system handles:
- **Guest payments** for car rentals
- **Platform commissions** (10% fee)
- **Owner payouts** (90% of booking value)
- **Refund processing**
- **Payout management workflow**

---

## Payment Flow

### 1. Booking Creation
```
Guest selects car → Creates booking (status: 'pending') → Owner confirms (status: 'confirmed')
```

### 2. Payment Initiation (Guest Flow)

**API Endpoint**: `POST /api/payments/booking/{booking_id}/initiate/`

**Process**:
1. Guest enters CamPay phone number (format: 2376XXXXXXXX)
2. System creates/retrieves `BookingPayment` record
3. Calls CamPay API: `initiate_collection()`
4. Returns CamPay reference for status tracking
5. Frontend polls status every 5 seconds

**BookingPayment Fields**:
| Field | Description |
|-------|-------------|
| `booking` | ForeignKey to Booking |
| `amount` | Total rental price |
| `status` | pending/completed/failed/refunded |
| `payment_method` | 'campay' |
| `customer_phone` | Payer's phone number |
| `campay_reference` | CamPay's transaction reference |
| `transaction_id` | Internal transaction ID |

### 3. Status Checking

**API Endpoint**: `GET /api/payments/booking/{booking_id}/check-status/`

**CamPay Status Mapping**:
| CamPay Status | Internal Status |
|---------------|-----------------|
| SUCCESSFUL | completed |
| FAILED | failed |
| (other) | pending |

### 4. Payment Completion

When status changes to `completed`:
1. **PlatformCommission** record is automatically created
2. Commission split: **10% platform, 90% owner**

**PlatformCommission Model**:
```python
platform_amount = booking_total * 0.10    # Platform fee
owner_payout = booking_total * 0.90        # Owner's share
refunded_platform = Decimal('0')          # Refunded to platform
refunded_owner = Decimal('0')             # Refunded to owner
```

---

## Commission & Revenue Model

```
Total Payment (from Guest)
├── 10% Platform Commission
│   └── Goes to Quest4Rides (minus any refunds)
│
└── 90% Owner Payout
    └── Goes to Car Owner (minus any refunds)
```

**Example (XAF 100,000 booking)**:
| Party | Amount | Notes |
|-------|--------|-------|
| Platform | XAF 10,000 | 10% commission |
| Owner | XAF 90,000 | Available for payout |
| Guest Paid | XAF 100,000 | Total collected |

---

## Owner Payout System

### Payout Request Flow

1. **Owner requests payout** (must have available balance)
2. **Manager approves** payout
3. **Manager processes** payout via CamPay
4. **System transfers** funds to owner's mobile money

### Payout Status States

```
pending → approved → processing → completed
                              └── failed
```

**Payout Model Fields**:
| Field | Description |
|-------|-------------|
| `owner` | User requesting payout |
| `amount` | Payout amount |
| `status` | pending/approved/processing/completed/failed |
| `payment_method` | campay/bank_transfer/mtn_momo/orange_money |
| `phone_number` | Mobile money number |
| `external_reference` | CamPay disbursement reference |

### Balance Calculation

**Available Balance** = Total Owner Payouts - Total Refunded to Owners - Pending Payouts

```python
gross_earnings = sum(commission.owner_payout for all completed bookings)
refunded = sum(commission.refunded_owner for all bookings)
pending_payouts = sum(payout.amount for pending/approved/processing payouts)

available_balance = gross_earnings - refunded - pending_payouts
```

### Minimum Payout
- **XAF 5,000** minimum per payout request

---

## Refund System

### Refund Process (Management Only)

**API Endpoint**: `POST /api/payments/booking/{booking_id}/refund/`

**Refund Types**:
1. **Full Refund**: Refund entire payment amount
2. **Partial Refund**: Refund specific amount (must be ≤ paid amount)

### Refund Impact on Commission

When refund is processed:
```python
refunded_owner = refund_amount * 0.90      # 90% comes from owner
refunded_platform = refund_amount * 0.10  # 10% comes from platform

commission.refunded_owner += refunded_owner
commission.refunded_platform += refunded_platform
```

**Example (XAF 50,000 refund on XAF 100,000 booking)**:
| Party | Original | After Refund |
|-------|----------|--------------|
| Platform | XAF 10,000 | XAF 5,000 (XAF 5,000 refunded) |
| Owner | XAF 90,000 | XAF 45,000 (XAF 45,000 refunded) |

### Refund Status Changes

```
completed → refunded (full) OR partially_refunded (partial)
```

---

## CamPay Integration

### Configuration

**settings.py**:
```python
CAMPAY_USERNAME = "your_app_username"
CAMPAY_PASSWORD = "your_app_password"
```

**Environment**: Uses "DEV" when `DEBUG=True`, "PROD" otherwise

### API Functions (payments/campay.py)

| Function | Purpose |
|----------|---------|
| `initiate_collection()` | Request payment from customer |
| `get_transaction_status()` | Check payment/payout status |
| `initiate_payout()` | Disburse funds to owner |

### Webhook Support

**Endpoint**: `POST /api/payments/webhook/campay/`

Receives async status updates from CamPay for:
- Collection confirmations
- Disbursement status updates

**Webhook Processing**:
1. Extract reference and status from payload
2. Find matching payout record
3. Update status based on CamPay status
4. Log for audit

### Background Polling

**Management Command**: `python manage.py poll_payout_statuses`

Purpose: Check status of payouts stuck in "processing" state

Options:
- `--dry-run`: Preview changes without making them
- `--limit`: Max payouts to check (default: 50)

---

## Database Models

### Core Payment Models

```
┌─────────────────────┐
│    BookingPayment    │  ← Main payment record (1:1 with Booking)
├─────────────────────┤
│ id                  │
│ booking_id (FK)     │
│ amount              │
│ status              │
│ campay_reference    │
│ customer_phone      │
│ created_at          │
└─────────────────────┘
          │
          │ 1:1
          ▼
┌─────────────────────┐
│  PlatformCommission │  ← Tracks 10%/90% split
├─────────────────────┤
│ booking_payment_id  │
│ platform_amount     │  (10%)
│ owner_payout        │  (90%)
│ refunded_platform   │
│ refunded_owner      │
└─────────────────────┘
          │
          │ 1:many
          ▼
┌─────────────────────┐
│ PaymentTransaction  │  ← Transaction history
├─────────────────────┤
│ id                  │
│ booking_payment_id  │
│ transaction_type   │  (booking/refund/adjustment)
│ amount              │
│ status              │
│ external_transaction_id
└─────────────────────┘

┌─────────────────────┐
│       Payout         │  ← Owner payout requests
├─────────────────────┤
│ id                  │
│ owner_id (FK)       │
│ amount              │
│ status              │
│ payment_method      │
│ phone_number        │
│ external_reference  │
└─────────────────────┘
```

---

## API Endpoints Summary

### Guest Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/booking/{id}/` | GET | Get payment details |
| `/api/payments/booking/{id}/initiate/` | POST | Start CamPay payment |
| `/api/payments/booking/{id}/check-status/` | GET | Check payment status |
| `/api/payments/guest/payments/` | GET | List guest's payments |

### Owner Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/owner/payments/` | GET | List owner's payments |
| `/api/payments/owner/earnings/` | GET | Get earnings summary |
| `/api/payments/owner/payout-request/` | POST | Request payout |
| `/api/payments/owner/payouts/` | GET | List payout history |

### Management Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/list/` | GET | List all payments |
| `/api/payments/analytics/` | GET | Platform analytics |
| `/api/payments/booking/{id}/status-update/` | POST | Update payment status |
| `/api/payments/booking/{id}/refund/` | POST | Process refund |
| `/api/payments/management/payouts/` | GET | List all payouts |
| `/api/payments/management/payout/{id}/approve/` | POST | Approve payout |
| `/api/payments/management/payout/{id}/process/` | POST | Process payout |
| `/api/payments/management/payout/{id}/reject/` | POST | Reject payout |
| `/api/payments/webhook/campay/` | POST | CamPay webhook |

---

## Frontend Components

### Payment Flow Components
| Component | Purpose |
|-----------|---------|
| `CampayPaymentComponent` | Collect phone number, initiate payment, poll status |
| `PaymentSuccessComponent` | Show success after payment completion |

### User Dashboard Components
| Component | User | Purpose |
|-----------|------|---------|
| `GuestPaymentHistoryComponent` | Guest | View past payments |
| `OwnerEarningsComponent` | Owner | View earnings & payments |
| `OwnerPayoutsComponent` | Owner | Request & view payouts |

### Management Components
| Component | Purpose |
|-----------|---------|
| `PaymentManagementComponent` | View/filter all payments |
| `RefundManagementComponent` | Process refunds |
| `PayoutManagementComponent` | Approve/process payouts |
| `PlatformEarningsComponent` | View platform analytics |

---

## Payment Analytics

**Endpoint**: `GET /api/payments/analytics/`

**Response**:
```json
{
  "total_transactions": 150,
  "total_revenue": 15000000,
  "platform_commission": 1500000,
  "owner_payouts": 13500000,
  "total_refunded": 500000,
  "currency": "XAF"
}
```

---

## Owner Earnings Dashboard

**Endpoint**: `GET /api/payments/owner/earnings/`

**Response**:
```json
{
  "total_earnings": 4500000,
  "available_balance": 3200000,
  "currency": "XAF"
}
```

**Balance Calculation**:
- `total_earnings`: Sum of all `owner_payout` from completed bookings
- `available_balance`: `total_earnings - refunded_amounts - pending_payouts`

---

## Security & Validation

### Phone Number Validation
- Must start with `237` (Cameroon)
- Must be 12 characters total (237 + 9 digits)
- Format: `2376XXXXXXXX`

### Permission Classes
- `IsAuthenticated`: Most endpoints
- `IsManagement`: Admin-only operations (refunds, payouts, analytics)

### Transaction ID Uniqueness
- `transaction_id`: Unique constraint
- `campay_reference`: Unique constraint

---

## Error Handling

### Common Error Codes
| Error | Cause |
|-------|-------|
| "Payment is no longer pending" | Payment already processed |
| "No active CamPay transaction" | No pending CamPay payment found |
| "Insufficient balance" | Payout request exceeds available |
| "Refund amount cannot exceed paid amount" | Invalid refund amount |

### Retry Mechanisms
- Frontend polls status every 5 seconds (max ~5 minutes)
- Management command for stale payout statuses

---

## Currency

All amounts are in **XAF** (Central African CFA Franc / BEAC)
- Display format: `FCFA 100,000`
- API response: `"currency": "XAF"`

---

## Limitations & TODOs

1. **Refund API**: CamPay refund API not yet implemented (TODO in code)
2. **Bank Transfer**: Payment method exists but not fully integrated
3. **Webhook Security**: No HMAC signature verification mentioned
4. **Disbursement**: Uses generic payout methods (may need SDK update)
5. **Database**: Uses SQLite (not production-ready for payments)

---

## File Structure

```
backend/payments/
├── models.py              # Payment, Commission, Payout models
├── views.py               # All API endpoints
├── urls.py                # URL routing
├── serializers.py         # DRF serializers
├── campay.py             # CamPay SDK integration
└── management/commands/
    └── poll_payout_statuses.py  # Background status checker

frontend/src/services/
└── payment.service.ts    # Angular payment service

frontend/src/*payment*    # Payment UI components
```

