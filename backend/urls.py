from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('userAuth.urls')),
    path('api/guest/', include('guest.urls')),
    path('api/owner/', include('owner.urls')),
    path('api/management/', include('management.urls')),
    path('api/bookings/', include('bookings.urls')),
]
