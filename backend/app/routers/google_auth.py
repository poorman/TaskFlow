"""Google OAuth authentication router"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import httpx
import json
from urllib.parse import urlencode
from app.database import get_db
from app.models import User, Organization
from app.schemas.auth import Token, UserResponse
from app.utils.auth import create_access_token, get_current_active_user
from app.config import settings

router = APIRouter()


@router.get("/google")
async def google_login():
    """Initiate Google OAuth login"""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    # Google OAuth URL
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return RedirectResponse(url=auth_url)


@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured"
        )
    
    try:
        # Exchange code for token
        async with httpx.AsyncClient() as client:
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            tokens = token_response.json()
            access_token = tokens["access_token"]
        
        # Get user info from Google
        async with httpx.AsyncClient() as client:
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_response.raise_for_status()
            google_user = user_response.json()
        
        # Extract user information
        email = google_user["email"]
        full_name = google_user.get("name", "")
        google_id = google_user["id"]
        picture = google_user.get("picture", "")
        
        # Find or create user
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            # Create organization for new user
            org_name = f"{email.split('@')[0]}'s Organization"
            org_slug = org_name.lower().replace(" ", "-")[:50]
            
            # Ensure unique slug
            existing_org = db.query(Organization).filter(Organization.slug == org_slug).first()
            counter = 1
            while existing_org:
                org_slug = f"{org_name.lower().replace(' ', '-')[:45]}-{counter}"
                existing_org = db.query(Organization).filter(Organization.slug == org_slug).first()
                counter += 1
            
            organization = Organization(
                name=org_name,
                slug=org_slug,
                subscription_tier="free"
            )
            db.add(organization)
            db.flush()
            
            # Create user
            user = User(
                email=email,
                hashed_password="",  # No password for OAuth users
                full_name=full_name,
                organization_id=organization.id,
                is_admin=True,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        # Generate JWT token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        jwt_token = create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        
        # Store token in cookie or return redirect with token
        # For now, redirect to frontend with token
        redirect_url = f"https://admin.widesurf.com/auth/callback?token={jwt_token}"
        return RedirectResponse(url=redirect_url)
        
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to authenticate with Google: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication error: {str(e)}"
        )


@router.get("/google/user", response_model=UserResponse)
async def get_google_user(current_user: User = Depends(get_current_active_user)):
    """Get current authenticated user (works with Google OAuth)"""
    return current_user

