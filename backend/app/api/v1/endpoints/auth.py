from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.models.user import User, UserRole
from app.models.doctor import Doctor
from app.schemas.auth import LoginRequest, RegisterRequest, Token
from app.schemas.user import UserOut
from app.services.email_service import email_service

router = APIRouter()


@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new patient account."""
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    
    # Patients only can register publicly (Doctor accounts are provisioned by Admin)
    assigned_role = UserRole.PATIENT
    if req.role == UserRole.ADMIN:
        admin_exists = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if admin_exists:
            assigned_role = UserRole.PATIENT
        else:
            assigned_role = UserRole.ADMIN

    user = User(
        email=req.email.lower().strip(),
        password_hash=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        phone=req.phone,
        role=assigned_role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email,
        full_name=user.full_name,
    )

    # Dispatch welcome registration email
    email_service.send_welcome_registration_email(
        db=db,
        patient_email=user.email,
        patient_name=user.full_name,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "doctor_id": None,
    }


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate user and return JWT token."""
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    doctor_id = None
    if user.role == UserRole.DOCTOR:
        doctor = db.query(Doctor).filter(Doctor.user_id == user.id).first()
        if doctor:
            doctor_id = doctor.id

    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        email=user.email,
        full_name=user.full_name,
        doctor_id=doctor_id,
    )

    # Dispatch login notification email
    email_service.send_login_security_notification(
        db=db,
        user_email=user.email,
        user_name=user.full_name,
        role=user.role.value,
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "doctor_id": doctor_id,
    }


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """Retrieve profile of the currently logged-in user."""
    return current_user
