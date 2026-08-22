"""Initial schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-08-22 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('role', sa.Enum('PATIENT', 'DOCTOR', 'ADMIN', name='userrole'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # 2. doctors table
    op.create_table(
        'doctors',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('specialization', sa.String(length=100), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('consultation_fee', sa.Float(), nullable=False),
        sa.Column('slot_duration_minutes', sa.Integer(), nullable=False),
        sa.Column('working_hours_start', sa.Time(), nullable=False),
        sa.Column('working_hours_end', sa.Time(), nullable=False),
        sa.Column('working_days', sa.String(length=100), nullable=False),
        sa.Column('room_number', sa.String(length=50), nullable=True),
        sa.Column('rating', sa.Float(), nullable=False),
        sa.Column('experience_years', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index(op.f('ix_doctors_id'), 'doctors', ['id'], unique=False)
    op.create_index(op.f('ix_doctors_specialization'), 'doctors', ['specialization'], unique=False)

    # 3. doctor_leaves table
    op.create_table(
        'doctor_leaves',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('leave_date', sa.Date(), nullable=False),
        sa.Column('reason', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('doctor_id', 'leave_date', name='uq_doctor_leave_date'),
    )
    op.create_index(op.f('ix_doctor_leaves_id'), 'doctor_leaves', ['id'], unique=False)
    op.create_index(op.f('ix_doctor_leaves_leave_date'), 'doctor_leaves', ['leave_date'], unique=False)

    # 4. slot_holds table
    op.create_table(
        'slot_holds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('slot_start', sa.DateTime(), nullable=False),
        sa.Column('slot_end', sa.DateTime(), nullable=False),
        sa.Column('hold_token', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('HELD', 'CONVERTED', 'EXPIRED', 'RELEASED', name='slotholdstatus'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_slot_holds_hold_token'), 'slot_holds', ['hold_token'], unique=True)
    op.create_index(op.f('ix_slot_holds_lookup'), 'slot_holds', ['doctor_id', 'slot_start', 'status'], unique=False)

    # 5. appointments table
    op.create_table(
        'appointments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('slot_start', sa.DateTime(), nullable=False),
        sa.Column('slot_end', sa.DateTime(), nullable=False),
        sa.Column('status', sa.Enum('BOOKED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED', name='appointmentstatus'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('cancel_reason', sa.String(length=255), nullable=True),
        sa.Column('google_event_id', sa.String(length=255), nullable=True),
        sa.Column('google_meet_link', sa.String(length=255), nullable=True),
        sa.Column('rebooking_token', sa.String(length=64), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_appointments_doctor_slot'), 'appointments', ['doctor_id', 'slot_start'], unique=False)
    op.create_index(op.f('ix_appointments_active_slot'), 'appointments', ['doctor_id', 'slot_start', 'is_active'], unique=False)

    # 6. symptom_forms table
    op.create_table(
        'symptom_forms',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('raw_symptoms', sa.Text(), nullable=False),
        sa.Column('duration_days', sa.Integer(), nullable=False),
        sa.Column('severity_scale', sa.Integer(), nullable=False),
        sa.Column('additional_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id'),
    )

    # 7. visit_summaries table
    op.create_table(
        'visit_summaries',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('ai_urgency_level', sa.Enum('LOW', 'MEDIUM', 'HIGH', name='urgencylevel'), nullable=True),
        sa.Column('ai_chief_complaint', sa.Text(), nullable=True),
        sa.Column('ai_suggested_questions', sa.JSON(), nullable=True),
        sa.Column('raw_clinical_notes', sa.Text(), nullable=True),
        sa.Column('ai_patient_summary', sa.Text(), nullable=True),
        sa.Column('ai_medication_schedule', sa.Text(), nullable=True),
        sa.Column('ai_followup_steps', sa.Text(), nullable=True),
        sa.Column('is_ai_generated', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id'),
    )

    # 8. prescriptions table
    op.create_table(
        'prescriptions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('appointment_id', sa.Integer(), nullable=False),
        sa.Column('doctor_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('diagnosis', sa.Text(), nullable=False),
        sa.Column('medications', sa.JSON(), nullable=False),
        sa.Column('advice', sa.Text(), nullable=True),
        sa.Column('followup_date', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['appointment_id'], ['appointments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['doctor_id'], ['doctors.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('appointment_id'),
    )

    # 9. medication_reminders table
    op.create_table(
        'medication_reminders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('prescription_id', sa.Integer(), nullable=False),
        sa.Column('patient_id', sa.Integer(), nullable=False),
        sa.Column('medicine_name', sa.String(length=255), nullable=False),
        sa.Column('dosage', sa.String(length=100), nullable=False),
        sa.Column('frequency', sa.String(length=100), nullable=False),
        sa.Column('reminder_time', sa.String(length=50), nullable=False),
        sa.Column('status', sa.Enum('ACTIVE', 'COMPLETED', 'PAUSED', name='reminderstatus'), nullable=False),
        sa.Column('next_run_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['prescription_id'], ['prescriptions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )

    # 10. notifications table
    op.create_table(
        'notifications',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('recipient_email', sa.String(length=255), nullable=False),
        sa.Column('recipient_name', sa.String(length=255), nullable=False),
        sa.Column('notification_type', sa.Enum('BOOKING_CONFIRMATION', 'APPOINTMENT_REMINDER', 'APPOINTMENT_CANCELLATION', 'DOCTOR_LEAVE_REBOOK', 'MEDICATION_REMINDER', name='notificationtype'), nullable=False),
        sa.Column('subject', sa.String(length=255), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('PENDING', 'SENT', 'FAILED', name='notificationstatus'), nullable=False),
        sa.Column('retry_count', sa.Integer(), nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_notifications_recipient_email'), 'notifications', ['recipient_email'], unique=False)
    op.create_index(op.f('ix_notifications_status'), 'notifications', ['status'], unique=False)

    # 11. google_tokens table
    op.create_table(
        'google_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('access_token', sa.Text(), nullable=False),
        sa.Column('refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expiry', sa.DateTime(), nullable=True),
        sa.Column('scope', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )


def downgrade() -> None:
    op.drop_table('google_tokens')
    op.drop_table('notifications')
    op.drop_table('medication_reminders')
    op.drop_table('prescriptions')
    op.drop_table('visit_summaries')
    op.drop_table('symptom_forms')
    op.drop_table('appointments')
    op.drop_table('slot_holds')
    op.drop_table('doctor_leaves')
    op.drop_table('doctors')
    op.drop_table('users')
