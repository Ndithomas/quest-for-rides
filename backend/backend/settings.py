import os
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()
MANAGEMENT_SECRET_CODE = os.getenv('MANAGEMENT_SECRET_CODE')
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/4.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-default-key-replace-this-in-prod')

# SECURITY WARNING: don't run with debug turned on in production!
# Convert the incoming string env variable to a true Python boolean safely
DEBUG = os.environ.get('DEBUG', 'True') == 'True'
MANAGEMENT_SECRET_CODE = os.getenv('MANAGEMENT_SECRET_CODE', 'default-mgmt-secret')

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True
SECURE_SSL_REDIRECT = not DEBUG

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',') if os.environ.get('ALLOWED_HOSTS') else ['*']
if not DEBUG:
    ALLOWED_HOSTS = [host.strip() for host in ALLOWED_HOSTS if host.strip()]
    if not ALLOWED_HOSTS:
        ALLOWED_HOSTS = ['*']


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist',
    'userAuth',
    'guest',
    'owner',
    'management',
    'corsheaders',
    'listings',
    'bookings',
    'reviews',
    'payments',
    'notifications',
    'django_cleanup.apps.CleanupConfig',
    
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases



DB_NAME = os.getenv("DB_NAME", "quest4rides")
DB_USER = os.getenv("DB_USER", "thomas")
DB_PASSWORD = os.getenv("DB_PASSWORD", "Tommy@123")
DB_HOST = os.getenv("DB_HOST", "")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": DB_NAME,
        "USER": DB_USER,
        "PASSWORD": DB_PASSWORD,
        "HOST": DB_HOST,
        "PORT": DB_PORT,
        "CONN_MAX_AGE": 600,
    }
}

# Cloud SQL socket safety handling
if DB_HOST.startswith("/cloudsql/"):
    DATABASES["default"]["OPTIONS"] = {
        "sslmode": "disable",
    }

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# settings.py

# Use default Django user
AUTH_USER_MODEL = 'userAuth.User'

# backend/settings.py

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'PAGE_SIZE_QUERY_PARAM': 'page_size',
    'MAX_PAGE_SIZE': 30,
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    
    # ADD THIS:
    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
    'TOKEN_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSerializer',
}


CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://localhost:8000",
    "https://jvl4wmvx-4200.uks1.devtunnels.ms",
    "https://quest-for-rides-frontend-361383206203.africa-south1.run.app",
    "https://quest-for-rides-backend-361383206203.africa-south1.run.app",
]

CSRF_TRUSTED_ORIGINS = [
    "https://quest-for-rides-backend-361383206203.africa-south1.run.app",
    "https://quest-for-rides-frontend-361383206203.africa-south1.run.app",
    "http://localhost:4200",
    "http://localhost:8000",
]

CORS_ALLOW_CREDENTIALS = True

# settings.py snippets optimized for Cloud Run

GS_BUCKET_NAME = os.getenv("GS_BUCKET_NAME")
GS_PROJECT_ID = os.getenv("GS_PROJECT_ID", "project-95eb9e37-8269-4627-bb0")

USE_GCS = GS_BUCKET_NAME is not None and GS_BUCKET_NAME != ""

if USE_GCS:
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.gcloud.GoogleCloudStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

    # Required for buckets with Uniform Bucket-Level Access enabled
    GS_DEFAULT_ACL = None

    # Public bucket, so don't generate signed URLs
    GS_QUERYSTRING_AUTH = False

    MEDIA_URL = f"https://storage.googleapis.com/{GS_BUCKET_NAME}/"
    MEDIA_ROOT = os.path.join(BASE_DIR, "media")

else:
    STORAGES = {
        "default": {
            "BACKEND": "django.core.files.storage.FileSystemStorage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

    MEDIA_URL = "/media/"
    MEDIA_ROOT = os.path.join(BASE_DIR, "media")


CAMPAY_USERNAME = os.getenv("CAMPAY_USERNAME", "your_app_username")
CAMPAY_PASSWORD = os.getenv("CAMPAY_PASSWORD", "your_app_password")
PLATFORM_COMMISSION_PERCENTAGE = Decimal(os.getenv("PLATFORM_COMMISSION_PERCENTAGE", "10"))

# ============ EMAIL CONFIGURATION ============
# For development/testing, emails will be printed to console
# For production, configure with a real SMTP server

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
# Use this for production:
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

raw_email_port = os.getenv('EMAIL_PORT', 587)
EMAIL_PORT = int(raw_email_port) if str(raw_email_port).isdigit() else 587
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
EMAIL_USE_TLS = True
EMAIL_USE_SSL = False

DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Quest4Rides <noreply@quest4rides.com>')

# ============ SECURITY SETTINGS ============
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_SSL_REDIRECT = False  # Set to True in production with HTTPS

# ============ RATE LIMITING (optional) ============
# Add django-ratelimit for rate limiting:
# RATELIMIT_ENABLE = True
# RATELIMIT_DEFAULT = '100/h'

