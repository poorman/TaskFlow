# TaskFlow Deployment Guide for admin.widesurf.com

## Quick Deployment

### 1. Configure Environment Variables

```bash
cd /home/pbieda/scripts/taskflow
cp .env.example .env
```

Edit `.env` and add:
```bash
# Google OAuth (required for Google login)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Optional: Override defaults
SECRET_KEY=your-secure-secret-key-here
```

### 2. Ensure Traefik is Running

```bash
cd /home/pbieda/scripts/pbieda-portfolio
docker-compose up -d traefik
```

### 3. Deploy TaskFlow

```bash
cd /home/pbieda/scripts/taskflow
docker-compose up -d --build
```

### 4. Initialize Database

```bash
docker-compose exec backend python init_db.py
```

### 5. Verify Deployment

- Visit: https://admin.widesurf.com
- Should see TaskFlow login page
- Click "Sign in with Google" to test OAuth

## DNS Configuration

Ensure `admin.widesurf.com` DNS A record points to your server IP:

```bash
# Check DNS
dig admin.widesurf.com
# Should return your server's IP address
```

## Google OAuth Setup

See [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md) for detailed instructions.

Quick steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URI: `https://admin.widesurf.com/api/v1/auth/google/callback`
4. Add authorized origin: `https://admin.widesurf.com`
5. Copy Client ID and Client Secret to `.env`

## Access Points

After deployment, you can access:

- **Frontend**: https://admin.widesurf.com
- **API Docs**: https://admin.widesurf.com/docs
- **API Health**: https://admin.widesurf.com/api/v1/health

## Troubleshooting

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker logs traefik | grep admin.widesurf.com

# Restart Traefik
cd /home/pbieda/scripts/pbieda-portfolio
docker-compose restart traefik
```

### Database Connection Issues

```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U taskflow

# Restart database
docker-compose restart postgres
```

### Network Issues

```bash
# Verify Traefik network exists
docker network ls | grep traefik-proxy

# Create if missing
docker network create traefik-proxy
```

## Production Checklist

- [ ] DNS configured for `admin.widesurf.com`
- [ ] Google OAuth credentials configured
- [ ] `.env` file with all secrets
- [ ] Traefik running and accessible
- [ ] SSL certificates generated (check logs)
- [ ] Database initialized
- [ ] All services running (`docker-compose ps`)
- [ ] Frontend accessible at https://admin.widesurf.com
- [ ] API accessible at https://admin.widesurf.com/api/v1/health
- [ ] Google OAuth login working

## Updates

To update the application:

```bash
cd /home/pbieda/scripts/taskflow
git pull  # if using git
docker-compose down
docker-compose up -d --build
```

## Monitoring

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Check resource usage
docker stats
```

## Backup

Database backup:
```bash
docker-compose exec postgres pg_dump -U taskflow taskflow > backup.sql
```

Restore:
```bash
docker-compose exec -T postgres psql -U taskflow taskflow < backup.sql
```

