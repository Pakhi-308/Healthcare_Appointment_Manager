from datetime import datetime, timezone
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.google_token import GoogleToken
from app.services.calendar_service import calendar_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/auth-url")
def get_google_auth_url(current_user: User = Depends(get_current_user)):
    """Generate Google Calendar OAuth 2.0 URL."""
    auth_url = calendar_service.get_authorization_url(state=str(current_user.id))
    return {
        "auth_url": auth_url,
        "is_configured": calendar_service.is_configured(),
    }


@router.get("/status")
def get_calendar_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check if the user has synchronized Google Calendar."""
    token = db.query(GoogleToken).filter(GoogleToken.user_id == current_user.id).first()
    return {
        "is_connected": token is not None,
        "is_service_configured": calendar_service.is_configured(),
    }


@router.get("/oauth2callback")
def google_oauth_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Handle OAuth 2.0 authorization redirect and exchange code for tokens."""
    if not calendar_service.is_configured():
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/appointments?calendar_sync=mocked")

    try:
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": calendar_service.client_id,
                    "client_secret": calendar_service.client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=["https://www.googleapis.com/auth/calendar"],
            redirect_uri=calendar_service.redirect_uri,
        )
        flow.fetch_token(code=code)
        credentials = flow.credentials

        user_id = int(state) if state and state.isdigit() else None
        if user_id:
            token_record = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()
            if not token_record:
                token_record = GoogleToken(user_id=user_id)
                db.add(token_record)

            token_record.access_token = credentials.token
            token_record.refresh_token = credentials.refresh_token or token_record.refresh_token
            token_record.token_expiry = credentials.expiry
            token_record.scope = " ".join(credentials.scopes) if credentials.scopes else None
            db.commit()

        return RedirectResponse(url=f"{settings.FRONTEND_URL}/appointments?calendar_sync=success")
    except Exception as exc:
        logger.error(f"Google OAuth callback exchange failed: {exc}")
        return RedirectResponse(url=f"{settings.FRONTEND_URL}/appointments?calendar_sync=failed")
