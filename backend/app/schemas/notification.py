from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.notification import NotificationType, NotificationStatus


class NotificationOut(BaseModel):
    id: int
    recipient_email: EmailStr
    recipient_name: str
    notification_type: NotificationType
    subject: str
    body: str
    status: NotificationStatus
    retry_count: int
    error_message: Optional[str] = None
    created_at: datetime
    sent_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationStats(BaseModel):
    total_sent: int
    total_pending: int
    total_failed: int
    total_retried: int


class TestEmailRequest(BaseModel):
    recipient_email: EmailStr


class TestEmailResponse(BaseModel):
    success: bool
    notification_id: Optional[int] = None
    is_configured: bool
    smtp_server: str
    smtp_port: int
    mail_from: str
    status: str
    error: Optional[str] = None
    message: str
