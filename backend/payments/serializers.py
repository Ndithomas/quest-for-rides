from rest_framework import serializers
from bookings.models import BookingPayment
from .models import *


class PaymentTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'booking_payment', 'transaction_type', 'transaction_type_display', 
                  'amount', 'status', 'status_display', 'external_transaction_id', 
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PaymentInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInvoice
        fields = ['id', 'booking_payment', 'invoice_number', 'issued_date', 'due_date', 
                  'paid_date', 'subtotal', 'tax', 'total', 'notes']
        read_only_fields = ['issued_date']


class PlatformCommissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformCommission
        fields = ['id', 'platform_amount', 'owner_payout', 'refunded_platform', 'refunded_owner', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingPaymentDetailSerializer(serializers.ModelSerializer):
    transactions = PaymentTransactionSerializer(many=True, read_only=True)
    invoice = PaymentInvoiceSerializer(read_only=True)
    commission = PlatformCommissionSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    campay_reference = serializers.CharField(read_only=True)
    customer_phone = serializers.CharField(read_only=True)
    
    class Meta:
        model = BookingPayment
        fields = ['id', 'booking', 'amount', 'status', 'status_display', 
                  'campay_reference', 'customer_phone', 'transactions', 'invoice', 'commission',
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PaymentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=['pending', 'completed', 'failed', 'refunded', 'refund_pending']
    )
    external_transaction_id = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="CamPay transaction reference"
    )
    notes = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text="Additional notes for the status change"
    )


class CamPayInitiateSerializer(serializers.Serializer):
    phone = serializers.CharField(
        max_length=12,
        min_length=12,
        help_text="Cameroon phone number in format 2376xxxxxxxx"
    )
    
    def validate_phone(self, value):
        if not value.startswith('237'):
            raise serializers.ValidationError("Phone must start with 237 (Cameroon)")
        if not value[3:].isdigit():
            raise serializers.ValidationError("Phone must contain only digits")
        if len(value) != 12:
            raise serializers.ValidationError("Phone must be 12 digits (237 + 9 digits)")
        return value


class RefundSerializer(serializers.Serializer):
    reason = serializers.CharField(
        required=False, 
        allow_blank=True,
        max_length=500,
        help_text="Reason for refund"
    )
    amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        help_text="Amount to refund (if partial refund)"
    )


class PayoutSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    owner_username = serializers.CharField(source='owner.username', read_only=True)
    owner_email = serializers.CharField(source='owner.email', read_only=True)
    
    class Meta:
        model = Payout
        fields = ['id', 'owner', 'owner_username', 'owner_email', 'amount', 'status', 'status_display',
                  'payment_method', 'payment_method_display', 'phone_number', 'external_reference',
                  'notes', 'requested_at', 'approved_at', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['requested_at', 'approved_at', 'completed_at', 'created_at', 'updated_at']


class PayoutRequestSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.ChoiceField(choices=['campay', 'bank_transfer', 'mtn_momo', 'orange_money'])
    phone_number = serializers.CharField(max_length=20)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        required=False,
        help_text="Partial refund amount (leave empty for full refund)"
    )