#backend for Quest4Rides application
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    pkg-config \
    default-libmysqlclient-dev \
    libjpeg-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN python -m pip install --upgrade pip && python -m pip install -r requirements.txt

COPY . /app/

# backend/Dockerfile
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate && exec python -m gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]