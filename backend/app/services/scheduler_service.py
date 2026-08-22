from datetime import datetime, timezone, timedelta
import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.models.clinical import MedicationReminder, ReminderStatus
from app.models.notification import Notification, NotificationStatus
from app.models.appointment import SlotHold, SlotHoldStatus
from app.models.user import User
from app.services.email_service import email_service

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def process_medication_reminders():
    """Background job: checks due medication reminders and dispatches emails."""
    db: Session = SessionLocal()
    try:
        now_utc = datetime.now(timezone.utc)
        # Find active reminders
        reminders = db.query(MedicationReminder).filter(
            MedicationReminder.status == ReminderStatus.ACTIVE,
        ).all()

        for rem in reminders:
            # Check if reminder is due
            if rem.next_run_at and rem.next_run_at <= now_utc:
                patient = db.query(User).filter(User.id == rem.patient_id).first()
                if patient:
                    logger.info(f"Triggering medication reminder for {patient.email}: {rem.medicine_name}")
                    email_service.send_medication_reminder(
                        db=db,
                        patient_email=patient.email,
                        patient_name=patient.full_name,
                        medicine_name=rem.medicine_name,
                        dosage=rem.dosage,
                        frequency=rem.frequency,
                    )
                # Advance next run time (e.g., by 12 hours or next day depending on frequency)
                rem.next_run_at = now_utc + timedelta(hours=12)
                db.commit()
    except Exception as exc:
        logger.error(f"Error in medication reminder background job: {exc}")
    finally:
        db.close()


def process_failed_notification_retries():
    """Background job: Retries failed notifications with exponential backoff up to 5 attempts."""
    db: Session = SessionLocal()
    try:
        failed_notifs = db.query(Notification).filter(
            Notification.status == NotificationStatus.FAILED,
            Notification.retry_count < 5
        ).all()

        for notif in failed_notifs:
            try:
                notif.retry_count += 1
                logger.info(f"Retrying notification #{notif.id} to {notif.recipient_email} (Attempt {notif.retry_count}/5)")
                email_service._send_raw_email(notif.recipient_email, notif.subject, notif.body)
                notif.status = NotificationStatus.SENT
                notif.sent_at = datetime.now(timezone.utc)
                notif.error_message = None
                db.commit()
            except Exception as exc:
                notif.error_message = f"Retry {notif.retry_count} failed: {str(exc)}"
                db.commit()
    except Exception as exc:
        logger.error(f"Error in notification retry background job: {exc}")
    finally:
        db.close()


def cleanup_expired_slot_holds():
    """Background job: Releases expired temporary slot holds."""
    db: Session = SessionLocal()
    try:
        now_utc = datetime.now(timezone.utc).replace(tzinfo=None)
        expired_count = db.query(SlotHold).filter(
            SlotHold.status == SlotHoldStatus.HELD,
            SlotHold.expires_at <= now_utc
        ).update({"status": SlotHoldStatus.EXPIRED})
        if expired_count > 0:
            db.commit()
            logger.info(f"Cleaned up {expired_count} expired slot holds.")
    except Exception as exc:
        logger.error(f"Error in slot hold cleanup job: {exc}")
    finally:
        db.close()


def start_scheduler():
    """Register and start all background jobs."""
    if not scheduler.running:
        scheduler.add_job(
            process_medication_reminders,
            trigger=IntervalTrigger(minutes=2),
            id="medication_reminders_job",
            name="Medication Reminders Dispatcher",
            replace_existing=True,
        )
        scheduler.add_job(
            process_failed_notification_retries,
            trigger=IntervalTrigger(minutes=2),
            id="failed_notifications_retry_job",
            name="Failed Notifications Retry Queue",
            replace_existing=True,
        )
        scheduler.add_job(
            cleanup_expired_slot_holds,
            trigger=IntervalTrigger(minutes=1),
            id="slot_hold_cleanup_job",
            name="Expired Slot Holds Cleanup",
            replace_existing=True,
        )
        scheduler.start()
        logger.info("APScheduler initialized and started successfully.")


def stop_scheduler():
    """Gracefully shutdown background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("APScheduler stopped.")
