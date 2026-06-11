# nginx reverse-proxy for frontend

This directory contains a minimal nginx config and a Docker Compose file that runs nginx and forwards port 80 to the frontend dev server at `http://host.docker.internal:4200`.

Prerequisites
- Docker Desktop (or Docker Engine) installed and running on macOS.

Run
```bash
cd infra/nginx
# Start the nginx proxy using the nginx-specific compose file
docker compose -f docker-compose.nginx.yml up -d
```

Test
```bash
curl -v "http://localhost/setup-mgmt-v3-9f8e2c7a1b4x2025-internal-only-never-share/?token=x9k2mPx%212025-internal-mgmt-setup%2F"
```

Notes
- The container uses `host.docker.internal` to reach the host machine's port 4200 from inside the container (works on Docker Desktop for macOS).
-- If you prefer not to use Docker, install nginx locally and drop `default.conf` into your `/etc/nginx/conf.d/` (requires sudo) and restart nginx.
