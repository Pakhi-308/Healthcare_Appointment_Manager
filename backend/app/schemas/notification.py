from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.notification import NotificationType, NotificationStatus


class NotificationOut(BaseModel):
    id: int
    recipient_email: str
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
    recipient_email: str


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


class SMTPConfigIn(BaseModel):
    mail_server: str = "smtp.gmail.com"
    mail_port: int = 465
    mail_username: str
    mail_password: str
    mail_from: Optional[str] = None
    mail_starttls: bool = False
    mail_ssl_tls: bool = True


class SMTPConfigOut(BaseModel):
    success: bool
    is_configured: bool
    mail_server: str
    mail_port: int
    mail_username: str
    mail_from: str
    message: str
