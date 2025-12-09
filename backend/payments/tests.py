from django.test import TestCase
from django.contrib.auth import get_user_model
from bookings.models import Booking, BookingPayment
from listings.models import Car
from .models import PaymentTransaction, PaymentMethod, PaymentInvoice
from datetime import date

User = get_user_model()


class PaymentModelTests(TestCase):
    def setUp(self):
        self.guest = User.objects.create_user(
            username='guest1',
            email='guest@test.com',
            password='pass123',
            role='guest'
        )
        self.owner = User.objects.create_user(
            username='owner1',
            email='owner@test.com',
            password='pass123',
            role='owner'
        )
        self.car = Car.objects.create(
            owner=self.owner,
            make='Toyota',
            model='Camry',
            year=2020,
            license_plate='ABC123',
            daily_rate=100.00
        )
        self.booking = Booking.objects.create(
            guest=self.guest,
            owner=self.owner,
            car=self.car,
            start_date='2025-12-20',
            end_date='2025-12-25',
            daily_rate=100.00,
            total_price=500.00
        )
        self.payment = BookingPayment.objects.create(
            booking=self.booking,
            amount=500.00,
            status='pending'
        )

    def test_payment_transaction_creation(self):
        transaction = PaymentTransaction.objects.create(
            booking_payment=self.payment,
            transaction_type='booking',
            amount=500.00,
            status='pending'
        )
        self.assertEqual(transaction.booking_payment, self.payment)
        self.assertEqual(transaction.amount, 500.00)

    def test_payment_method_creation(self):
        method = PaymentMethod.objects.create(
            user=self.guest,
            payment_type='credit_card',
            last_four='4242',
            holder_name='John Doe'
        )
        self.assertEqual(method.user, self.guest)
        self.assertEqual(method.payment_type, 'credit_card')

    def test_payment_invoice_creation(self):
        invoice = PaymentInvoice.objects.create(
            booking_payment=self.payment,
            invoice_number='INV-001',
            subtotal=500.00,
            tax=50.00,
            total=550.00
        )
        self.assertEqual(invoice.booking_payment, self.payment)
        self.assertEqual(invoice.total, 550.00)

