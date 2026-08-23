from datetime import datetime, timezone
import logging
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.notification import Notification, NotificationType, NotificationStatus

logger = logging.getLogger(__name__)


def _get_base_email_html(title: str, preheader: str, content_html: str) -> str:
    """Styled HTML email template matching the deep purple luxury healthcare design."""
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{ margin: 0; padding: 0; background-color: #0b0416; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc; }}
        .wrapper {{ max-width: 600px; margin: 30px auto; background: #14092b; border: 1px solid #2e1065; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .header {{ background: linear-gradient(135deg, #1a0a3e 0%, #2e1065 50%, #4c1d95 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #3b0764; }}
        .header h1 {{ margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }}
        .header p {{ margin: 6px 0 0 0; font-size: 14px; color: #c084fc; }}
        .content {{ padding: 32px 28px; line-height: 1.6; font-size: 15px; color: #e2e8f0; }}
        .card {{ background: rgba(30, 15, 60, 0.6); border: 1px solid #3b0764; border-radius: 12px; padding: 20px; margin: 20px 0; }}
        .highlight {{ color: #a855f7; font-weight: 600; }}
        .btn {{ display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #7c3aed, #9333ea); color: #ffffff !important; text-decoration: none; font-weight: 600; border-radius: 8px; margin: 20px 0; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4); }}
        .footer {{ background: #0a0314; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e1035; }}
        .badge {{ display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; background: #3b0764; color: #e9d5ff; }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>HealthSync</h1>
            <p>Healthcare Appointment &amp; Follow-up Portal</p>
        </div>
        <div class="content">
            {content_html}
        </div>
        <div class="footer">
            <p>&copy; {datetime.now().year} HealthSync Medical Technologies. All rights reserved.</p>
            <p>Need assistance? Contact our care concierge at support@healthsync.care</p>
        </div>
    </div>
</body>
</html>
"""


class EmailService:
    def __init__(self):
        self.smtp_server = settings.MAIL_SERVER
        self.smtp_port = settings.MAIL_PORT
        self.username = settings.MAIL_USERNAME
        self.password = settings.MAIL_PASSWORD
        self.mail_from = settings.MAIL_FROM
        self.mail_from_name = settings.MAIL_FROM_NAME
        self.starttls = settings.MAIL_STARTTLS
        self.ssl_tls = settings.MAIL_SSL_TLS

    def _is_configured(self) -> bool:
        return bool(self.username and self.password and self.smtp_server)

    def _send_raw_email(self, to_email: str, subject: str, html_body: str) -> None:
        """Send email via SMTP with proper SSL / STARTTLS negotiation and timeout."""
        if not self._is_configured():
            logger.info(f"[Simulated Email Dispatch] To: {to_email} | Subject: {subject}")
            return

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.mail_from_name} <{self.mail_from}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        # Port 465 or SSL_TLS configured
        if self.ssl_tls or self.smtp_port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(self.smtp_server, self.smtp_port, context=context, timeout=12) as server:
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)
        else:
            # Port 587 or 25 with STARTTLS
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=12) as server:
                if self.starttls:
                    context = ssl.create_default_context()
                    server.starttls(context=context)
                if self.username and self.password:
                    server.login(self.username, self.password)
                server.send_message(msg)

    def log_and_send(
        self,
        db: Session,
        recipient_email: str,
        recipient_name: str,
        notification_type: NotificationType,
        subject: str,
        html_body: str
    ) -> Notification:
        """Create notification record in DB and attempt immediate delivery."""
        notif = Notification(
            recipient_email=recipient_email,
            recipient_name=recipient_name,
            notification_type=notification_type,
            subject=subject,
            body=html_body,
            status=NotificationStatus.PENDING,
            retry_count=0,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)

        try:
            self._send_raw_email(recipient_email, subject, html_body)
            notif.status = NotificationStatus.SENT
            notif.sent_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as exc:
            logger.error(f"Failed to send email to {recipient_email}: {exc}")
            notif.status = NotificationStatus.FAILED
            notif.error_message = str(exc)
            db.commit()

        return notif

    def test_smtp_connection_and_send(self, db: Session, test_recipient: str) -> Dict[str, Any]:
        """Test SMTP server connectivity and send a live test message."""
        is_configured = self._is_configured()
        subject = f"HealthSync SMTP Test: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        content = f"""
        <h2>SMTP Connection Verified</h2>
        <p>This is a test notification dispatched from the <strong>HealthSync Healthcare Platform</strong>.</p>
        <div class="card">
            <p><strong>SMTP Server:</strong> {self.smtp_server}:{self.smtp_port}</p>
            <p><strong>Sender Address:</strong> {self.mail_from}</p>
            <p><strong>Recipient Address:</strong> {test_recipient}</p>
            <p><strong>Mode:</strong> {'Live SMTP' if is_configured else 'Simulated / Development (Credentials not in .env)'}</p>
            <p><strong>Status:</strong> <span class="highlight">Successfully Dispatched &amp; Recorded</span></p>
        </div>
        <p>All automated notifications (booking confirmations, doctor urgency alerts, medication reminders) are active.</p>
        """
        html = _get_base_email_html(subject, "SMTP Test Notification", content)
        
        notif = self.log_and_send(
            db=db,
            recipient_email=test_recipient,
            recipient_name="Test Recipient",
            notification_type=NotificationType.BOOKING_CONFIRMATION,
            subject=subject,
            html_body=html
        )

        return {
            "success": notif.status == NotificationStatus.SENT,
            "notification_id": notif.id,
            "is_configured": is_configured,
            "smtp_server": self.smtp_server,
            "smtp_port": self.smtp_port,
            "mail_from": self.mail_from,
            "status": notif.status.value,
            "error": notif.error_message,
            "message": "Email sent successfully!" if notif.status == NotificationStatus.SENT else f"Delivery failed: {notif.error_message}"
        }

    def send_booking_confirmation(
        self,
        db: Session,
        patient_email: str,
        patient_name: str,
        doctor_name: str,
        specialization: str,
        slot_time: str,
        google_meet_link: Optional[str] = None
    ):
        subject = f"Appointment Confirmed: Dr. {doctor_name} ({slot_time})"
        meet_section = f'<p><strong>Video Consultation:</strong> <a href="{google_meet_link}" style="color: #38bdf8;">Join Google Meet</a></p>' if google_meet_link else ""
        
        content = f"""
        <h2>Appointment Confirmed!</h2>
        <p>Dear <strong>{patient_name}</strong>,</p>
        <p>Your healthcare appointment has been successfully booked with our medical specialist.</p>
        <div class="card">
            <p><strong>Doctor:</strong> Dr. {doctor_name} <span class="badge">{specialization}</span></p>
            <p><strong>Date &amp; Time:</strong> <span class="highlight">{slot_time}</span></p>
            {meet_section}
            <p><strong>Status:</strong> Confirmed &amp; Synchronized with Calendar</p>
        </div>
        <p>Please arrive 10 minutes early. Your pre-visit symptom assessment has been prepared for Dr. {doctor_name}.</p>
        <a href="{settings.FRONTEND_URL}/appointments" class="btn">View Appointment Portal</a>
        """
        html = _get_base_email_html(subject, "Your appointment is confirmed", content)
        return self.log_and_send(db, patient_email, patient_name, NotificationType.BOOKING_CONFIRMATION, subject, html)

    def send_doctor_booking_notification(
        self,
        db: Session,
        doctor_email: str,
        doctor_name: str,
        patient_name: str,
        slot_time: str,
        urgency_level: str,
        chief_complaint: str
    ):
        subject = f"New Booking: {patient_name} - Urgency: {urgency_level}"
        urgency_color = "#10b981" if urgency_level == "Low" else ("#f59e0b" if urgency_level == "Medium" else "#ef4444")
        content = f"""
        <h2>New Patient Appointment Booked</h2>
        <p>Dr. <strong>{doctor_name}</strong>,</p>
        <p>A new consultation has been booked on your calendar.</p>
        <div class="card">
            <p><strong>Patient:</strong> {patient_name}</p>
            <p><strong>Time:</strong> <span class="highlight">{slot_time}</span></p>
            <p><strong>Triage Urgency:</strong> <span style="color: {urgency_color}; font-weight: 700;">{urgency_level}</span></p>
            <p><strong>Chief Complaint:</strong> {chief_complaint}</p>
        </div>
        <p>AI pre-visit clinical questions have been drafted in your doctor consultation dashboard.</p>
        <a href="{settings.FRONTEND_URL}/doctor/dashboard" class="btn">Open Doctor Portal</a>
        """
        html = _get_base_email_html(subject, "New patient appointment", content)
        return self.log_and_send(db, doctor_email, doctor_name, NotificationType.BOOKING_CONFIRMATION, subject, html)

    def send_appointment_cancellation(
        self,
        db: Session,
        recipient_email: str,
        recipient_name: str,
        slot_time: str,
        reason: str
    ):
        subject = f"Appointment Cancelled: {slot_time}"
        content = f"""
        <h2>Appointment Cancelled</h2>
        <p>Dear <strong>{recipient_name}</strong>,</p>
        <p>Your appointment scheduled for <strong>{slot_time}</strong> has been cancelled.</p>
        <div class="card">
            <p><strong>Reason:</strong> {reason}</p>
        </div>
        <p>You can book another appointment anytime through our online portal.</p>
        <a href="{settings.FRONTEND_URL}/doctors" class="btn">Find Doctor &amp; Book</a>
        """
        html = _get_base_email_html(subject, "Appointment cancellation notice", content)
        return self.log_and_send(db, recipient_email, recipient_name, NotificationType.APPOINTMENT_CANCELLATION, subject, html)

    def send_doctor_leave_rebooking_notice(
        self,
        db: Session,
        patient_email: str,
        patient_name: str,
        doctor_name: str,
        original_time: str,
        rebooking_token: str
    ):
        subject = f"Important: Doctor Reschedule Notice - Dr. {doctor_name}"
        rebook_url = f"{settings.FRONTEND_URL}/rebook?token={rebooking_token}"
        content = f"""
        <h2>Important Update: Doctor On Leave</h2>
        <p>Dear <strong>{patient_name}</strong>,</p>
        <p>We regret to inform you that <strong>Dr. {doctor_name}</strong> is unavailable on the date of your scheduled visit (<strong>{original_time}</strong>) due to approved medical/emergency leave.</p>
        <div class="card">
            <p>Your original booking has been cancelled and priority rebooking has been enabled on your account.</p>
            <p>Click below to choose a preferred alternative slot with Dr. {doctor_name} or another specialist.</p>
        </div>
        <a href="{rebook_url}" class="btn">Priority Rebook Now</a>
        """
        html = _get_base_email_html(subject, "Doctor leave notice & rebooking", content)
        return self.log_and_send(db, patient_email, patient_name, NotificationType.DOCTOR_LEAVE_REBOOK, subject, html)

    def send_medication_reminder(
        self,
        db: Session,
        patient_email: str,
        patient_name: str,
        medicine_name: str,
        dosage: str,
        frequency: str
    ):
        subject = f"Medication Reminder: Time for {medicine_name}"
        content = f"""
        <h2>Medication Dose Reminder</h2>
        <p>Hello <strong>{patient_name}</strong>,</p>
        <p>This is a scheduled reminder to take your prescribed medication on time:</p>
        <div class="card">
            <p><strong>Medicine:</strong> <span class="highlight">{medicine_name}</span></p>
            <p><strong>Dosage:</strong> {dosage}</p>
            <p><strong>Instructions:</strong> {frequency}</p>
        </div>
        <p>Staying consistent with your treatment plan helps ensure a speedy recovery.</p>
        <a href="{settings.FRONTEND_URL}/prescriptions" class="btn">View Full Prescription</a>
        """
        html = _get_base_email_html(subject, "Medication reminder", content)
        return self.log_and_send(db, patient_email, patient_name, NotificationType.MEDICATION_REMINDER, subject, html)


email_service = EmailService()
