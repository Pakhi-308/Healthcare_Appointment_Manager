from contextlib import asynccontextmanager
from datetime import time
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, engine, SessionLocal
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.api.v1.router import api_router
from app.services.scheduler_service import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("healthsync")


def seed_initial_data(db: Session):
    """Seed default Administrator and sample specialized Doctors if database is empty."""
    # 1. Seed Admin
    admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if not admin:
        logger.info("Seeding initial System Administrator...")
        admin = User(
            email=settings.ADMIN_EMAIL.lower().strip(),
            password_hash=get_password_hash(settings.ADMIN_PASSWORD),
            full_name=settings.ADMIN_NAME,
            phone="+1 (555) 019-2831",
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.commit()

    # 2. Seed Sample Doctors if none exist
    doctor_count = db.query(Doctor).count()
    if doctor_count == 0:
        logger.info("Seeding initial medical specialists...")
        specialists = [
            {
                "email": "dr.sarah.mitchell@healthsync.care",
                "full_name": "Dr. Sarah Mitchell",
                "specialization": "Cardiology",
                "bio": "Board-certified Cardiologist with over 12 years of clinical experience specializing in cardiovascular health, hypertension management, and preventative cardiology.",
                "consultation_fee": 120.0,
                "slot_duration_minutes": 30,
                "working_hours_start": time(9, 0),
                "working_hours_end": time(17, 0),
                "working_days": "Mon,Tue,Wed,Thu,Fri",
                "room_number": "Suite 401A",
                "rating": 4.95,
                "experience_years": 12,
            },
            {
                "email": "dr.marcus.vance@healthsync.care",
                "full_name": "Dr. Marcus Vance",
                "specialization": "Neurology",
                "bio": "Specialist in neurodegenerative diagnostics, migraine disorders, and advanced neurological therapeutics with fellowship from Johns Hopkins.",
                "consultation_fee": 150.0,
                "slot_duration_minutes": 30,
                "working_hours_start": time(10, 0),
                "working_hours_end": time(18, 0),
                "working_days": "Mon,Tue,Wed,Thu,Fri",
                "room_number": "Suite 205B",
                "rating": 4.90,
                "experience_years": 15,
            },
            {
                "email": "dr.elena.rostova@healthsync.care",
                "full_name": "Dr. Elena Rostova",
                "specialization": "Dermatology",
                "bio": "Specializing in clinical dermatology, autoimmune skin conditions, advanced dermatosurgery, and non-invasive cosmetic consultations.",
                "consultation_fee": 95.0,
                "slot_duration_minutes": 30,
                "working_hours_start": time(8, 30),
                "working_hours_end": time(16, 30),
                "working_days": "Mon,Tue,Wed,Thu,Fri",
                "room_number": "Suite 102",
                "rating": 4.88,
                "experience_years": 9,
            },
            {
                "email": "dr.arjun.patel@healthsync.care",
                "full_name": "Dr. Arjun Patel",
                "specialization": "Orthopedics",
                "bio": "Consultant Orthopedic Surgeon focusing on sports injuries, joint preservation, spine biomechanics, and rapid arthroscopic recovery.",
                "consultation_fee": 110.0,
                "slot_duration_minutes": 30,
                "working_hours_start": time(9, 0),
                "working_hours_end": time(17, 0),
                "working_days": "Mon,Tue,Wed,Thu,Fri",
                "room_number": "Suite 308",
                "rating": 4.92,
                "experience_years": 11,
            },
        ]

        for s in specialists:
            u = User(
                email=s["email"].lower().strip(),
                password_hash=get_password_hash("DoctorPassword123!"),
                full_name=s["full_name"],
                phone="+1 (555) 304-9811",
                role=UserRole.DOCTOR,
            )
            db.add(u)
            db.flush()

            doc = Doctor(
                user_id=u.id,
                specialization=s["specialization"],
                bio=s["bio"],
                consultation_fee=s["consultation_fee"],
                slot_duration_minutes=s["slot_duration_minutes"],
                working_hours_start=s["working_hours_start"],
                working_hours_end=s["working_hours_end"],
                working_days=s["working_days"],
                room_number=s["room_number"],
                rating=s["rating"],
                experience_years=s["experience_years"],
            )
            db.add(doc)
        db.commit()
        logger.info("Successfully seeded doctors.")

    # 3. Seed Sample Patient for immediate demo convenience
    patient = db.query(User).filter(User.email == "patient@healthsync.care").first()
    if not patient:
        patient = User(
            email="patient@healthsync.care",
            password_hash=get_password_hash("PatientPassword123!"),
            full_name="Eleanor Hughes",
            phone="+1 (555) 789-0123",
            role=UserRole.PATIENT,
        )
        db.add(patient)
        db.commit()
        logger.info("Seeded demo patient: patient@healthsync.care")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup & shutdown events."""
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)

    # Seed initial users & doctors
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

    # Start background jobs scheduler
    start_scheduler()
    logger.info("HealthSync API started successfully.")
    
    yield
    
    logger.info("Stopping background scheduler and shutting down...")
    stop_scheduler()


app = FastAPI(
    title=settings.APP_NAME,
    description="Full-stack Healthcare Appointment & Follow-up Manager with LLaMA 3.3 70B AI triage, Google Calendar Sync, and Concurrency-safe Booking.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits local dev and deployed frontend domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routes
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
