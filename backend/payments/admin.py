from django.contrib import admin
from .models import *

admin.site.register(PaymentMethod)
admin.site.register(PaymentTransaction)
admin.site.register(PaymentInvoice)
