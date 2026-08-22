import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Activity, 
  Calendar, 
  User as UserIcon, 
  ShieldCheck, 
  Stethoscope, 
  LogOut, 
  FileText, 
  Bell, 
  Sparkles,
  Users,
  Clock,
  Menu,
  X
} from 'lucide-react';

export const Navbar = ({ currentTab, onNavigate }) => {
  const { user, isAuthenticated, role, logout, quickLogin } = useAuth();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleQuickLogin = async (roleType) => {
    try {
      await quickLogin(roleType);
      toast.success(`Switched to ${roleType.toUpperCase()} profile!`);
      if (roleType === 'patient') onNavigate('patient-doctors');
      else if (roleType === 'doctor') onNavigate('doctor-dashboard');
      else if (roleType === 'admin') onNavigate('admin-dashboard');
    } catch (err) {
      toast.error('Quick login failed.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-900/40 bg-[#090312]/80 backdrop-blur-xl">
      {/* Top Demo Bar */}
      <div className="bg-gradient-to-r from-purple-950/80 via-[#1a0a3e] to-indigo-950/80 border-b border-purple-800/30 px-4 py-1.5 text-xs text-purple-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
          <span className="hidden sm:inline">HealthSync AI Healthcare Suite</span>
          <span className="text-purple-400 font-semibold">• LLaMA 3.3 70B &amp; Concurrency Engine</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Quick Demo Switch:</span>
          <button
            onClick={() => handleQuickLogin('patient')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              role === 'patient' 
                ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                : 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/60'
            }`}
          >
            Patient
          </button>
          <button
            onClick={() => handleQuickLogin('doctor')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              role === 'doctor' 
                ? 'bg-cyan-600 text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]' 
                : 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/60'
            }`}
          >
            Doctor
          </button>
          <button
            onClick={() => handleQuickLogin('admin')}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all ${
              role === 'admin' 
                ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]' 
                : 'bg-amber-950/50 text-amber-300 hover:bg-amber-900/60'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_20px_rgba(139,92,246,0.35)] group-hover:shadow-[0_0_25px_rgba(168,85,247,0.6)] transition-all duration-300">
            <div className="w-full h-full bg-[#0d051f] rounded-[10px] flex items-center justify-center">
              <Activity className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold tracking-tight text-white font-['Outfit']">HealthSync</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-purple-900/70 border border-purple-500/30 text-purple-300">PRO</span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-medium">Healthcare Suite</p>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onNavigate('home')}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
              currentTab === 'home' 
                ? 'text-white bg-purple-900/40 border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Overview
          </button>

          {/* Patient Tabs */}
          {(!isAuthenticated || role === 'patient') && (
            <>
              <button
                onClick={() => onNavigate('patient-doctors')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'patient-doctors' || currentTab === 'book-appointment'
                    ? 'text-white bg-purple-900/40 border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Stethoscope className="w-4 h-4 text-purple-400" />
                Find Doctors
              </button>
              {isAuthenticated && (
                <>
                  <button
                    onClick={() => onNavigate('patient-appointments')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      currentTab === 'patient-appointments' 
                        ? 'text-white bg-purple-900/40 border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Calendar className="w-4 h-4 text-purple-400" />
                    My Visits
                  </button>
                  <button
                    onClick={() => onNavigate('patient-prescriptions')}
                    className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      currentTab === 'patient-prescriptions' 
                        ? 'text-white bg-purple-900/40 border border-purple-500/30 shadow-[0_0_12px_rgba(139,92,246,0.2)]' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-400" />
                    Prescriptions &amp; AI
                  </button>
                </>
              )}
            </>
          )}

          {/* Doctor Tabs */}
          {role === 'doctor' && (
            <>
              <button
                onClick={() => onNavigate('doctor-dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'doctor-dashboard' || currentTab === 'doctor-consultation'
                    ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Activity className="w-4 h-4 text-cyan-400" />
                Doctor Queue
              </button>
              <button
                onClick={() => onNavigate('doctor-schedule')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'doctor-schedule' 
                    ? 'text-cyan-300 bg-cyan-950/50 border border-cyan-500/30 shadow-[0_0_12px_rgba(56,189,248,0.2)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                Schedule &amp; Leave
              </button>
            </>
          )}

          {/* Admin Tabs */}
          {role === 'admin' && (
            <>
              <button
                onClick={() => onNavigate('admin-dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin-dashboard' 
                    ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Analytics &amp; Control
              </button>
              <button
                onClick={() => onNavigate('admin-doctors')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin-doctors' 
                    ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4 text-amber-400" />
                Manage Doctors
              </button>
              <button
                onClick={() => onNavigate('admin-notifications')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  currentTab === 'admin-notifications' 
                    ? 'text-amber-300 bg-amber-950/50 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]' 
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bell className="w-4 h-4 text-amber-400" />
                Retry Queue
              </button>
            </>
          )}
        </nav>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white">{user?.full_name}</div>
                <div className="text-[11px] text-purple-400 capitalize font-medium">{role} Portal</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  toast.info('Logged out successfully.');
                  onNavigate('home');
                }}
                className="p-2 rounded-lg border border-purple-800/40 bg-purple-950/40 text-slate-300 hover:text-rose-400 hover:border-rose-900/60 hover:bg-rose-950/20 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-4 py-2 rounded-lg text-sm font-medium text-purple-200 hover:text-white hover:bg-white/5 transition-all"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="gradient-btn px-4 py-2 rounded-lg text-sm font-semibold text-white"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg border border-purple-800/40 text-slate-300 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0e0520] border-b border-purple-900/50 px-4 py-4 space-y-2">
          <button
            onClick={() => { onNavigate('home'); setMobileOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
          >
            Overview
          </button>
          <button
            onClick={() => { onNavigate('patient-doctors'); setMobileOpen(false); }}
            className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
          >
            Find Doctors
          </button>
          {isAuthenticated && (
            <>
              {role === 'patient' && (
                <>
                  <button
                    onClick={() => { onNavigate('patient-appointments'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    My Visits
                  </button>
                  <button
                    onClick={() => { onNavigate('patient-prescriptions'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    Prescriptions &amp; AI
                  </button>
                </>
              )}
              {role === 'doctor' && (
                <>
                  <button
                    onClick={() => { onNavigate('doctor-dashboard'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    Doctor Queue
                  </button>
                  <button
                    onClick={() => { onNavigate('doctor-schedule'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    Schedule &amp; Leave
                  </button>
                </>
              )}
              {role === 'admin' && (
                <>
                  <button
                    onClick={() => { onNavigate('admin-dashboard'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    Admin Analytics
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-doctors'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    Manage Doctors
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-notifications'); setMobileOpen(false); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-200 hover:bg-purple-900/30"
                  >
                    Retry Queue
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </header>
  );
};
