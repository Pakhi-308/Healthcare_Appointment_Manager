import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Patient Pages
import { DoctorsListPage } from './pages/patient/DoctorsListPage';
import { BookAppointmentPage } from './pages/patient/BookAppointmentPage';
import { MyAppointmentsPage } from './pages/patient/MyAppointmentsPage';
import { MyPrescriptionsPage } from './pages/patient/MyPrescriptionsPage';

// Doctor Pages
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { ConsultationPage } from './pages/doctor/ConsultationPage';
import { DoctorSchedulePage } from './pages/doctor/DoctorSchedulePage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { ManageDoctorsPage } from './pages/admin/ManageDoctorsPage';
import { NotificationAuditPage } from './pages/admin/NotificationAuditPage';

const AppContent = () => {
  const { user, isAuthenticated, role } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');

  // Navigation payload states
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [selectedAppointmentForConsult, setSelectedAppointmentForConsult] = useState(null);

  const navigateTo = (tab) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctorForBooking(doctor);
    navigateTo('book-appointment');
  };

  const handleStartConsultation = (appointment) => {
    setSelectedAppointmentForConsult(appointment);
    navigateTo('doctor-consultation');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#090312] text-slate-100 selection:bg-purple-600 selection:text-white">
      <Navbar currentTab={currentTab} onNavigate={navigateTo} />

      <main className="flex-grow">
        {currentTab === 'home' && (
          <HomePage onNavigate={navigateTo} />
        )}

        {currentTab === 'login' && (
          <LoginPage onNavigate={navigateTo} />
        )}

        {currentTab === 'register' && (
          <RegisterPage onNavigate={navigateTo} />
        )}

        {/* Patient Views */}
        {currentTab === 'patient-doctors' && (
          <DoctorsListPage onSelectDoctor={handleSelectDoctor} />
        )}

        {currentTab === 'book-appointment' && (
          <BookAppointmentPage
            doctor={selectedDoctorForBooking}
            onBack={() => navigateTo('patient-doctors')}
            onComplete={() => navigateTo('patient-appointments')}
          />
        )}

        {currentTab === 'patient-appointments' && (
          <MyAppointmentsPage
            onBookNew={() => navigateTo('patient-doctors')}
            onViewPrescription={() => navigateTo('patient-prescriptions')}
          />
        )}

        {currentTab === 'patient-prescriptions' && (
          <MyPrescriptionsPage
            onBookFollowup={() => navigateTo('patient-doctors')}
          />
        )}

        {/* Doctor Views */}
        {currentTab === 'doctor-dashboard' && (
          <DoctorDashboardPage
            onStartConsultation={handleStartConsultation}
          />
        )}

        {currentTab === 'doctor-consultation' && (
          <ConsultationPage
            appointment={selectedAppointmentForConsult}
            onBack={() => navigateTo('doctor-dashboard')}
            onComplete={() => navigateTo('doctor-dashboard')}
          />
        )}

        {currentTab === 'doctor-schedule' && (
          <DoctorSchedulePage />
        )}

        {/* Admin Views */}
        {currentTab === 'admin-dashboard' && (
          <AdminDashboardPage onNavigate={navigateTo} />
        )}

        {currentTab === 'admin-doctors' && (
          <ManageDoctorsPage />
        )}

        {currentTab === 'admin-notifications' && (
          <NotificationAuditPage />
        )}
      </main>

      <Footer />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
}
