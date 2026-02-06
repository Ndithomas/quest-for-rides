# Pipes Integration TODO

This document tracks the integration of custom pipes into components.

## Available Custom Pipes (in `src/shared/pipes`):
- `CurrencyXAFPipe` - `{{ amount | currencyXAF }}` → "FCFA 1,000"
- `DateFormatPipe` - `{{ date | dateFormat }}` → "Jan 1, 2024"
- `DateTimePipe` - `{{ date | dateTime }}` → "Jan 1, 2024, 10:30 AM"
- `StatusClassPipe` - `{{ status | statusClass }}` → "badge bg-success"

## Components Updated (TypeScript imports added):

### Phase 1: Direct Pipe Usage
- [x] `notifications` - Added DateFormatPipe
- [x] `owner-payouts` - Added DateFormatPipe, CurrencyXAFPipe, StatusClassPipe
- [x] `profile` - Added DateFormatPipe
- [x] `user-detail` - Added DateFormatPipe
- [x] `campay-payment` - Added DateFormatPipe
- [x] `owner-bookings` - Added DateFormatPipe, CurrencyXAFPipe

### Phase 2: Components with Manual Methods
- [x] `booking-details` - Added DateFormatPipe, CurrencyXAFPipe, StatusClassPipe
- [x] `booking-confirmation` - Added DateFormatPipe, CurrencyXAFPipe
- [x] `bookings` - Added DateFormatPipe, CurrencyXAFPipe
- [x] `car-detail` - Added DateFormatPipe, CurrencyXAFPipe
- [x] `guest-payment-history` - Already has pipes
- [x] `management-bookings` - Already has pipes
- [x] `management-dashboard` - Already has pipes
- [x] `owner-earnings` - Already has pipes
- [x] `owner-payments` - Already has pipes
- [x] `payment-management` - Already has pipes
- [x] `payment-success` - Added DateFormatPipe, CurrencyXAFPipe
- [x] `payout-management` - Added CurrencyXAFPipe, DateFormatPipe, StatusClassPipe
- [x] `platform-earnings` - Added CurrencyXAFPipe
- [x] `refund-management` - Added CurrencyXAFPipe, DateFormatPipe, StatusClassPipe
- [x] `reviews` - Added DateFormatPipe

## HTML Templates Updated:
- [x] `owner-payouts` - Replaced formatCurrency() calls with currencyXAF pipe

## Remaining HTML Templates to Update:
- [ ] `notifications` - Replace `date:'short'` with `dateFormat`
- [ ] `profile` - Replace `date:'MMMM yyyy'` and `date:'mediumDate'` with `dateFormat`
- [ ] `user-detail` - Replace `date:'mediumDate'` with `dateFormat`
- [ ] `campay-payment` - Replace `date:'shortDate'` with `dateFormat`
- [ ] `owner-bookings` - Replace `date:'MMM d'`, `date:'mediumDate'`, `number:'1.0-0'` with pipes
- [ ] `management-dashboard` - Replace `formatCurrency()` and `formatDate()` calls
- [ ] `management-bookings` - Replace `formatCurrency()` and `formatDate()` calls
- [ ] `owner-earnings` - Replace `formatCurrency()` and `formatDate()` calls
- [ ] `owner-payments` - Replace `formatCurrency()` and `formatDate()` calls
- [ ] `payment-management` - Replace `formatCurrency()` and `formatDate()` calls
- [ ] `platform-earnings` - Replace `formatCurrency()` call
- [ ] `refund-management` - Replace `formatCurrency()` and `formatDate()` calls

## Progress:
- ✅ Phase 1: All component TypeScript files updated with pipe imports
- ✅ Phase 2: All component TypeScript files updated with pipe imports
- 🔄 Phase 3: HTML templates being updated to use pipes instead of method calls
- [ ] Complete HTML template updates
- [ ] Remove unused formatCurrency/formatDate methods from components

