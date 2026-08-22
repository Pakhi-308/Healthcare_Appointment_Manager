from datetime import datetime, timezone
import logging
import uuid
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.google_token import GoogleToken

logger = logging.getLogger(__name__)

SCOPES = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
]


class GoogleCalendarService:
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI

    def is_configured(self) -> bool:
        return bool(self.client_id and self.client_secret)

    def get_authorization_url(self, state: Optional[str] = None) -> Optional[str]:
        """Generate Google OAuth 2.0 authorization URL."""
        if not self.is_configured():
            logger.info("Google Calendar OAuth credentials not configured.")
            return None
        try:
            from google_auth_oauthlib.flow import Flow
            flow = Flow.from_client_config(
                {
                    "web": {
                        "client_id": self.client_id,
                        "client_secret": self.client_secret,
                        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    }
                },
                scopes=SCOPES,
                redirect_uri=self.redirect_uri,
            )
            auth_url, _ = flow.authorization_url(
                access_type="offline",
                include_granted_scopes="true",
                prompt="consent",
                state=state,
            )
            return auth_url
        except Exception as exc:
            logger.error(f"Error generating Google OAuth URL: {exc}")
            return None

    def create_event(
        self,
        db: Session,
        user_id: int,
        summary: str,
        description: str,
        start_time: datetime,
        end_time: datetime,
        attendee_emails: list[str]
    ) -> Dict[str, Any]:
        """
        Create a calendar event with Google Meet link.
        Falls back to generating a Meet link simulator if offline/mock.
        """
        # Zero-config live WebRTC room fallback (allows real video + audio consultation without Google OAuth)
        unique_room_id = f"HealthSync-Consultation-{uuid.uuid4().hex[:8]}"
        mock_meet = f"https://meet.jit.si/{unique_room_id}#config.prejoinConfig.enabled=false"
        mock_event_id = f"telehealth_{uuid.uuid4().hex[:12]}"

        # Check if user has saved token
        token_record = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()
        if not token_record or not self.is_configured():
            logger.info(f"[Live Video Room] Created consultation room {mock_meet} for {summary} at {start_time}")
            return {
                "event_id": mock_event_id,
                "meet_link": mock_meet,
                "is_synced": False,
            }

        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials(
                token=token_record.access_token,
                refresh_token=token_record.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
            )
            service = build("calendar", "v3", credentials=creds)

            event = {
                "summary": summary,
                "description": description,
                "start": {
                    "dateTime": start_time.isoformat(),
                    "timeZone": "UTC",
                },
                "end": {
                    "dateTime": end_time.isoformat(),
                    "timeZone": "UTC",
                },
                "attendees": [{"email": email} for email in attendee_emails if email],
                "conferenceData": {
                    "createRequest": {
                        "requestId": str(uuid.uuid4()),
                        "conferenceSolutionKey": {"type": "hangoutsMeet"},
                    }
                },
                "reminders": {
                    "useDefault": False,
                    "overrides": [
                        {"method": "email", "minutes": 24 * 60},
                        {"method": "popup", "minutes": 30},
                    ],
                },
            }

            created_event = service.events().insert(
                calendarId="primary",
                body=event,
                conferenceDataVersion=1,
            ).execute()

            meet_link = created_event.get("hangoutLink", mock_meet)
            event_id = created_event.get("id", mock_event_id)

            return {
                "event_id": event_id,
                "meet_link": meet_link,
                "is_synced": True,
            }
        except Exception as exc:
            logger.warning(f"Google Calendar API call failed: {exc}. Returning simulated event details.")
            return {
                "event_id": mock_event_id,
                "meet_link": mock_meet,
                "is_synced": False,
            }

    def delete_event(self, db: Session, user_id: int, event_id: str) -> bool:
        """Delete an event from Google Calendar upon appointment cancellation."""
        if not event_id:
            return True
        token_record = db.query(GoogleToken).filter(GoogleToken.user_id == user_id).first()
        if not token_record or not self.is_configured():
            logger.info(f"[Mock GCal] Deleted calendar event {event_id}")
            return True

        try:
            from google.oauth2.credentials import Credentials
            from googleapiclient.discovery import build

            creds = Credentials(
                token=token_record.access_token,
                refresh_token=token_record.refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self.client_id,
                client_secret=self.client_secret,
            )
            service = build("calendar", "v3", credentials=creds)
            service.events().delete(calendarId="primary", eventId=event_id).execute()
            return True
        except Exception as exc:
            logger.warning(f"Failed to delete event from Google Calendar: {exc}")
            return False


calendar_service = GoogleCalendarService()
