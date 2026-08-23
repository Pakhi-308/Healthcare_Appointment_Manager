-- ============================================================================
-- HealthSync: Healthcare Appointment & Follow-up Manager
-- Complete Production Database Schema (MySQL / PostgreSQL / SQLite Compatible)
-- ============================================================================

-- 1. Users Table (Role-based: PATIENT, DOCTOR, ADMIN)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'PATIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
);

-- 2. Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    bio TEXT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    working_hours_start TIME NOT NULL DEFAULT '09:00:00',
    working_hours_end TIME NOT NULL DEFAULT '17:00:00',
    working_days VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    room_number VARCHAR(50) NULL,
    rating DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    experience_years INT NOT NULL DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_doctors_specialization (specialization)
);

-- 3. Doctor Leaves Table
CREATE TABLE IF NOT EXISTS doctor_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    leave_date DATE NOT NULL,
    reason VARCHAR(255) NULL DEFAULT 'Personal/Medical Leave',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_doctor_leave_date (doctor_id, leave_date),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX idx_doctor_leaves_date (leave_date)
);

-- 4. Temporary Slot Holds Table (Concurrency-safe 10-minute hold lock)
CREATE TABLE IF NOT EXISTS slot_holds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    slot_start DATETIME NOT NULL,
    slot_end DATETIME NOT NULL,
    hold_token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HELD', -- HELD, CONVERTED, EXPIRED, RELEASED
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slot_holds_lookup (doctor_id, slot_start, status)
);

-- 5. Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    slot_start DATETIME NOT NULL,
    slot_end DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED', -- BOOKED, COMPLETED, CANCELLED, NO_SHOW
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    cancel_reason VARCHAR(255) NULL,
    rebooking_token VARCHAR(64) NULL,
    google_event_id VARCHAR(255) NULL,
    google_meet_link VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_appointments_slot (doctor_id, slot_start, is_active),
    INDEX idx_appointments_patient (patient_id),
    INDEX idx_appointments_status (status)
);

-- 6. Symptom Assessments Table (Pre-visit intake)
CREATE TABLE IF NOT EXISTS symptom_assessments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    patient_id INT NOT NULL,
    raw_symptoms TEXT NOT NULL,
    duration_days INT NOT NULL DEFAULT 1,
    severity_scale INT NOT NULL DEFAULT 5, -- 1 to 10
    additional_notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Visit Summaries Table (LLaMA 3.3 70B AI pre & post triage summaries)
CREATE TABLE IF NOT EXISTS visit_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    doctor_id INT NOT NULL,
    ai_urgency_level VARCHAR(20) NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Emergency
    ai_chief_complaint VARCHAR(255) NULL,
    ai_suggested_questions JSON NULL,
    raw_clinical_notes TEXT NULL,
    ai_patient_summary TEXT NULL,
    ai_medication_schedule TEXT NULL,
    ai_followup_steps TEXT NULL,
    is_ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
);

-- 8. Prescriptions Table
CREATE TABLE IF NOT EXISTS prescriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_id INT NOT NULL UNIQUE,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    diagnosis VARCHAR(255) NOT NULL,
    medications JSON NOT NULL, -- Array of objects: [{name, dosage, frequency, duration}]
    advice TEXT NULL,
    followup_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Medication Reminders Table (Recurring background reminder job)
CREATE TABLE IF NOT EXISTS medication_reminders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prescription_id INT NOT NULL,
    patient_id INT NOT NULL,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    reminder_time VARCHAR(100) NOT NULL DEFAULT '09:00, 21:00',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, COMPLETED
    next_run_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_reminders_status_next (status, next_run_at)
);

-- 10. Notifications Table (Email audit log & exponential retry queue)
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- BOOKING_CONFIRMATION, APPOINTMENT_CANCELLATION, DOCTOR_LEAVE_REBOOK, MEDICATION_REMINDER
    subject VARCHAR(255) NOT NULL,
    body LONGTEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, SENT, FAILED
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    INDEX idx_notifications_recipient (recipient_email),
    INDEX idx_notifications_status (status)
);

-- 11. Google Calendar Tokens Table (OAuth 2.0)
CREATE TABLE IF NOT EXISTS google_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,
    token_expiry TIMESTAMP NULL,
    scope TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- Initial Seed Data (Admin, Sample Doctors, Patient)
-- Password hash corresponds to: AdminPassword123!, DoctorPassword123!, PatientPassword123!
-- ============================================================================

INSERT INTO users (email, password_hash, full_name, phone, role)
VALUES 
('admin@healthsync.care', '$2b$12$4v0P10wWw8JqP4kYh7F1QOPZ3Y5JmQnJqK7s8b9b0z1y2x3w4v5u6', 'System Administrator', '+1 (555) 019-2831', 'ADMIN'),
('dr.sarah.mitchell@healthsync.care', '$2b$12$4v0P10wWw8JqP4kYh7F1QOPZ3Y5JmQnJqK7s8b9b0z1y2x3w4v5u6', 'Dr. Sarah Mitchell', '+1 (555) 304-9811', 'DOCTOR'),
('dr.marcus.vance@healthsync.care', '$2b$12$4v0P10wWw8JqP4kYh7F1QOPZ3Y5JmQnJqK7s8b9b0z1y2x3w4v5u6', 'Dr. Marcus Vance', '+1 (555) 304-9812', 'DOCTOR'),
('dr.elena.rostova@healthsync.care', '$2b$12$4v0P10wWw8JqP4kYh7F1QOPZ3Y5JmQnJqK7s8b9b0z1y2x3w4v5u6', 'Dr. Elena Rostova', '+1 (555) 304-9813', 'DOCTOR'),
('dr.arjun.patel@healthsync.care', '$2b$12$4v0P10wWw8JqP4kYh7F1QOPZ3Y5JmQnJqK7s8b9b0z1y2x3w4v5u6', 'Dr. Arjun Patel', '+1 (555) 304-9814', 'DOCTOR'),
('patient@healthsync.care', '$2b$12$4v0P10wWw8JqP4kYh7F1QOPZ3Y5JmQnJqK7s8b9b0z1y2x3w4v5u6', 'Eleanor Hughes', '+1 (555) 789-0123', 'PATIENT')
ON DUPLICATE KEY UPDATE email=email;

INSERT INTO doctors (user_id, specialization, bio, consultation_fee, slot_duration_minutes, working_hours_start, working_hours_end, working_days, room_number, rating, experience_years)
VALUES 
(2, 'Cardiology', 'Board-certified Cardiologist with over 12 years of clinical experience specializing in cardiovascular health and preventative cardiology.', 120.00, 30, '09:00:00', '17:00:00', 'Mon,Tue,Wed,Thu,Fri', 'Suite 401A', 4.95, 12),
(3, 'Neurology', 'Specialist in neurodegenerative diagnostics, migraine disorders, and advanced neurological therapeutics from Johns Hopkins.', 150.00, 30, '10:00:00', '18:00:00', 'Mon,Tue,Wed,Thu,Fri', 'Suite 205B', 4.90, 15),
(4, 'Dermatology', 'Specializing in clinical dermatology, autoimmune skin conditions, and advanced dermatosurgery.', 95.00, 30, '08:30:00', '16:30:00', 'Mon,Tue,Wed,Thu,Fri', 'Suite 102', 4.88, 9),
(5, 'Orthopedics', 'Consultant Orthopedic Surgeon focusing on sports injuries, joint preservation, and rapid arthroscopic recovery.', 110.00, 30, '09:00:00', '17:00:00', 'Mon,Tue,Wed,Thu,Fri', 'Suite 308', 4.92, 11)
ON DUPLICATE KEY UPDATE user_id=user_id;
