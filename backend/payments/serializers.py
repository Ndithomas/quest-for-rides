from rest_framework import serializers
from bookings.models import BookingPayment
from .models import PaymentTransaction, PaymentMethod, PaymentInvoice
from userAuth.models import User


class PaymentMethodSerializer(serializers.ModelSerializer):
    payment_type_display = serializers.CharField(source='get_payment_type_display', read_only=True)
    
    class Meta:
        model = PaymentMethod
        fields = ['id', 'payment_type', 'payment_type_display', 'is_default', 'last_four', 
                  'holder_name', 'expiry_month', 'expiry_year', 'is_active', 'created_at']
        read_only_fields = ['created_at']


class PaymentTransactionSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = PaymentTransaction
        fields = ['id', 'booking_payment', 'transaction_type', 'transaction_type_display', 
                  'amount', 'status', 'status_display', 'payment_method', 
                  'external_transaction_id', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PaymentInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentInvoice
        fields = ['id', 'booking_payment', 'invoice_number', 'issued_date', 'due_date', 
                  'paid_date', 'subtotal', 'tax', 'total', 'notes']
        read_only_fields = ['issued_date']


class BookingPaymentDetailSerializer(serializers.ModelSerializer):
    transactions = PaymentTransactionSerializer(many=True, read_only=True)
    invoice = PaymentInvoiceSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = BookingPayment
        fields = ['id', 'booking', 'amount', 'status', 'status_display', 
                  'payment_method', 'transaction_id', 'transactions', 'invoice', 
                  'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PaymentStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['completed', 'failed', 'refunded'])
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
