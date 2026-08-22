from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    doctors,
    appointments,
    visits,
    admin,
    notifications,
    calendar,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(doctors.router, prefix="/doctors", tags=["Doctors & Availability"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments & Booking"])
api_router.include_router(visits.router, prefix="/visits", tags=["Clinical Visits & Prescriptions"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Portal"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notification Audit"])
api_router.include_router(calendar.router, prefix="/calendar", tags=["Google Calendar"])
