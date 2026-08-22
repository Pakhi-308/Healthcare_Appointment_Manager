from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.dependencies import require_role
from app.models.user import User, UserRole
from app.models.notification import Notification, NotificationStatus
from app.schemas.notification import NotificationOut, NotificationStats
from app.services.email_service import email_service

router = APIRouter()


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
