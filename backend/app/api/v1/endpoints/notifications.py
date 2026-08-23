from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationStatus
from app.schemas.notification import (
    NotificationOut,
    NotificationStats,
    TestEmailRequest,
    TestEmailResponse,
    SMTPConfigIn,
    SMTPConfigOut,
)
from app.services.email_service import email_service

router = APIRouter()


@router.get("/my", response_model=List[NotificationOut])
def get_my_notifications(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve notifications/emails sent to the authenticated user."""
    query = db.query(Notification).filter(Notification.recipient_email == current_user.email.lower().strip())
    return query.order_by(desc(Notification.created_at)).limit(limit).all()


@router.get("/audit", response_model=List[NotificationOut])
def get_notification_audit_log(
    status_filter: Optional[NotificationStatus] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Admin endpoint to monitor the notification dispatch and failure audit log."""
    query = db.query(Notification)
    if status_filter:
        query = query.filter(Notification.status == status_filter)
    
    return query.order_by(desc(Notification.created_at)).limit(limit).all()


@router.get("/stats", response_model=NotificationStats)
def get_notification_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Retrieve overview metrics on notification delivery and retries."""
    sent = db.query(Notification).filter(Notification.status == NotificationStatus.SENT).count()
    pending = db.query(Notification).filter(Notification.status == NotificationStatus.PENDING).count()
    failed = db.query(Notification).filter(Notification.status == NotificationStatus.FAILED).count()
    retried = db.query(Notification).filter(Notification.retry_count > 0).count()

    return {
        "total_sent": sent,
        "total_pending": pending,
        "total_failed": failed,
        "total_retried": retried,
    }


@router.get("/smtp-status")
def get_smtp_status(
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Admin endpoint to check current SMTP configuration."""
    return email_service.get_smtp_status()


@router.post("/smtp-config", response_model=SMTPConfigOut)
def configure_smtp_runtime(
    req: SMTPConfigIn,
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Admin endpoint to dynamically connect & authenticate custom SMTP sender credentials."""
    result = email_service.update_smtp_config(
        mail_server=req.mail_server,
        mail_port=req.mail_port,
        mail_username=req.mail_username,
        mail_password=req.mail_password,
        mail_from=req.mail_from or req.mail_username,
        mail_starttls=req.mail_starttls,
        mail_ssl_tls=req.mail_ssl_tls,
    )
    return {
        "success": result["success"],
        "is_configured": result["is_configured"],
        "mail_server": req.mail_server,
        "mail_port": req.mail_port,
        "mail_username": req.mail_username,
        "mail_from": req.mail_from or req.mail_username,
        "message": result["message"],
    }


@router.post("/test-email", response_model=TestEmailResponse)
def test_send_email(
    req: TestEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trigger a live test email and verify SMTP connectivity."""
    result = email_service.test_smtp_connection_and_send(
        db=db,
        test_recipient=req.recipient_email.lower().strip()
    )
    return result


@router.get("/{notification_id}", response_model=NotificationOut)
def get_notification_by_id(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve details for a single notification."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    if current_user.role != UserRole.ADMIN and notif.recipient_email.lower().strip() != current_user.email.lower().strip():
        raise HTTPException(status_code=403, detail="Forbidden: You cannot view this notification.")

    return notif


@router.post("/retry/{notification_id}", response_model=NotificationOut)
def retry_failed_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """Manually trigger immediate retry for a failed or pending notification."""
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")

    notif.retry_count += 1
    try:
        email_service._send_raw_email(notif.recipient_email, notif.subject, notif.body)
        notif.status = NotificationStatus.SENT
        notif.sent_at = datetime.now(timezone.utc)
        notif.error_message = None
        db.commit()
    except Exception as exc:
        notif.status = NotificationStatus.FAILED
        notif.error_message = f"Manual retry failed: {str(exc)}"
        db.commit()

    db.refresh(notif)
    return notif
