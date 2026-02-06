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


def initiate_payout(amount: str, phone: str, description: str, external_ref: str):
    """
    Initiate a payout/disbursement via CamPay to a merchant or mobile wallet.
    This tries a few common method names on the CamPay client (disburse/payout/transfer)
    so the code will work with different SDK versions. Returns the raw SDK response.
    """
    payload = {
        "amount": amount,
        "currency": "XAF",
        "to": phone,
        "description": description,
        "external_reference": external_ref
    }

    # Try common payout method names exposed by CamPay SDKs
    for method_name in ("disburse", "payout", "transfer", "send_payment", "make_payout"):
        func = getattr(campay, method_name, None)
        if callable(func):
            return func(payload)

    # If none of the helper methods exist, try a generic request method if available
    generic = getattr(campay, "request", None) or getattr(campay, "call", None)
    if callable(generic):
        return generic("payout", payload)

    raise NotImplementedError(
        "CamPay client does not expose a known payout method. Update payments.campay.initiate_payout to match your SDK."
    )