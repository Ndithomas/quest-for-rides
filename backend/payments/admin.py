from django.contrib import admin
from .models import *


admin.site.register(PaymentTransaction)
admin.site.register(PaymentInvoice)
admin.site.register(Payout)