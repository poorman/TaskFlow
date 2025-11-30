# Google OAuth Setup Guide

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project created

## Steps to Configure Google OAuth

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - User Type: **External** (for public use) or **Internal** (for organization only)
   - App name: **TaskFlow**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if external and not published)
   - Click **Save and Continue**

### 2. Configure OAuth Client

1. Application type: **Web application**
2. Name: **TaskFlow Web Client**
3. Authorized JavaScript origins:
   ```
   https://admin.widesurf.com
   http://localhost:3014 (for local development)
   ```
4. Authorized redirect URIs:
   ```
   https://admin.widesurf.com/api/v1/auth/google/callback
   http://localhost:8000/api/v1/auth/google/callback (for local development)
   ```
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**

### 3. Add Credentials to Environment Variables

Add to your `.env` file in the taskflow directory:

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here

# Backend configuration (already set)
GOOGLE_REDIRECT_URI=https://admin.widesurf.com/api/v1/auth/google/callback
```

### 4. Update Docker Compose Environment

The docker-compose.yml is already configured to use these environment variables:

```yaml
environment:
  GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID:-}
  GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET:-}
  GOOGLE_REDIRECT_URI: https://admin.widesurf.com/api/v1/auth/google/callback
```

### 5. Restart Services

After adding the credentials:

```bash
cd /home/pbieda/scripts/taskflow
docker-compose restart backend
docker-compose restart frontend
```

## Testing Google OAuth

1. Visit https://admin.widesurf.com
2. Click **Sign in with Google**
3. You should be redirected to Google's login page
4. After authentication, you'll be redirected back to TaskFlow
5. You should be automatically logged in and redirected to the dashboard

## Troubleshooting

### "Google OAuth is not configured"
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in `.env`
- Restart the backend service

### "Redirect URI mismatch"
- Verify the redirect URI in Google Cloud Console matches exactly:
  - Production: `https://admin.widesurf.com/api/v1/auth/google/callback`
  - Local: `http://localhost:8000/api/v1/auth/google/callback`

### "Access blocked: This app's request is invalid"
- Check that the authorized JavaScript origins include:
  - `https://admin.widesurf.com`
  - `http://localhost:3014` (for local dev)

### SSL Certificate Issues
- Ensure Traefik is running and has generated SSL certificates for `admin.widesurf.com`
- Check Traefik logs: `docker logs traefik`

## Security Notes

- Never commit `.env` file to version control
- Keep your Client Secret secure
- Use environment variables, not hardcoded values
- Rotate credentials if compromised

## Production Checklist

- [ ] OAuth consent screen configured
- [ ] Redirect URIs added to Google Cloud Console
- [ ] Authorized JavaScript origins configured
- [ ] Environment variables set in production `.env`
- [ ] SSL certificates active for `admin.widesurf.com`
- [ ] Services restarted after configuration
- [ ] Test login flow works end-to-end

