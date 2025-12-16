# payments/utils/campay.py
from campay.sdk import Client as CamPayClient
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

# Initialize CamPay client
try:
    campay = CamPayClient({
        "app_username": settings.CAMPAY_USERNAME,
        "app_password": settings.CAMPAY_PASSWORD,
        "environment": "DEV" if settings.DEBUG else "PROD"
    })
except AttributeError as e:
    raise ImproperlyConfigured("CamPay credentials (CAMPAY_USERNAME/PASSWORD) are missing in settings.") from e


def initiate_collection(amount: str, phone: str, description: str, external_ref: str):
    """
    Initiate a payment collection via CamPay Mobile Money
    """
    return campay.collect({
        "amount": amount,            # Must be string
        "currency": "XAF",
        "from": phone,               # e.g. "237677777777"
        "description": description,
        "external_reference": external_ref
    })


def get_transaction_status(reference: str):
    """
    Check the status of a CamPay transaction using the reference
    """
    return campay.transaction_status(reference)