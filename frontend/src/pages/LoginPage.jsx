import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Activity, 
  Lock, 
  Mail, 
  ArrowRight, 
  UserCheck, 
  ShieldCheck, 
  Stethoscope,
  KeyRound,
  UserPlus,
  Sparkles,
  Zap,
  CheckCircle2
} from 'lucide-react';

export const LoginPage = ({ onNavigate }) => {
  const { login, quickLogin } = useAuth();
  const toast = useToast();
  
  // Tabs: 'patient', 'doctor', 'admin', 'guest'
  const [activeTab, setActiveTab] = useState('patient');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.full_name}!`);
      if (user.role === 'doctor') onNavigate('doctor-dashboard');
      else if (user.role === 'admin') onNavigate('admin-dashboard');
      else onNavigate('patient-doctors');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (roleType) => {
    setLoading(true);
    try {
      const user = await quickLogin(roleType);
      toast.success(`Welcome to Guest Mode (${roleType.toUpperCase()})`);
      if (roleType === 'doctor') onNavigate('doctor-dashboard');
      else if (roleType === 'admin') onNavigate('admin-dashboard');
      else onNavigate('patient-doctors');
    } catch (err) {
      toast.error('Guest login failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (userEmail, userPass) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-xl w-full glass-panel p-6 sm:p-10 rounded-3xl border border-purple-600/30 shadow-[0_0_60px_rgba(139,92,246,0.18)] relative">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              <div className="w-full h-full bg-[#0d051f] rounded-[14px] flex items-center justify-center">
                <Activity className="w-7 h-7 text-purple-400" />
              </div>
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
            HealthSync Access Portal
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose your login mode to access clinical triage, consultations, or system administration
          </p>
        </div>

        {/* 4 Mode Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 rounded-2xl bg-[#0a0314] border border-purple-900/60 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('patient');
              setEmail('');
              setPassword('');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'patient'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Patient</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('doctor');
              setEmail('dr.sarah.mitchell@healthsync.care');
              setPassword('DoctorPassword123!');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'doctor'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" />
            <span>Doctor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setEmail('admin@healthsync.care');
              setPassword('AdminPassword123!');
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guest')}
            className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'guest'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-emerald-400 hover:text-white hover:bg-purple-950/40'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Guest Mode</span>
          </button>
        </div>

        {/* Tab 1: Patient Login */}
        {activeTab === 'patient' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between text-xs text-purple-300 font-semibold mb-1">
              <span>Patient Account Sign In</span>
              <button
                type="button"
                onClick={() => fillCredentials('patient@healthsync.care', 'PatientPassword123!')}
                className="text-[11px] text-cyan-400 hover:underline"
              >
                Auto-fill demo patient
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="w-full bg-[#120627] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#120627] border border-purple-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 mt-4 shadow-[0_4px_25px_rgba(124,58,237,0.35)] disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In as Patient'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="mt-4 p-3 rounded-xl bg-purple-950/30 border border-purple-900/40 text-center">
              <span className="text-xs text-slate-400 block mb-1">New Patient?</span>
              <button
                type="button"
                onClick={() => onNavigate('register')}
                className="text-xs font-bold text-purple-300 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Patient Account (Takes 30s)</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Doctor Login */}
        {activeTab === 'doctor' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-900/60 text-xs text-cyan-200 flex items-center gap-2 mb-2">
              <Stethoscope className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Doctor Clinical Portal • Manage Triage Queue, Consultations &amp; Leaves</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Doctor Professional Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dr.sarah.mitchell@healthsync.care"
                  required
                  className="w-full bg-[#081525] border border-cyan-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#081525] border border-cyan-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center gap-2 mt-4 shadow-[0_4px_25px_rgba(6,182,212,0.35)] disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In as Doctor'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 3: Admin Login */}
        {activeTab === 'admin' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-xs text-amber-200 flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>Operations Command • SQL Explorer, Doctor Hours &amp; Outbound Mail Hub</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@healthsync.care"
                  required
                  className="w-full bg-[#1e1305] border border-amber-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#1e1305] border border-amber-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm bg-amber-600 hover:bg-amber-500 flex items-center justify-center gap-2 mt-4 shadow-[0_4px_25px_rgba(245,158,11,0.35)] disabled:opacity-50 transition-all"
            >
              {loading ? 'Authenticating...' : 'Sign In as Administrator'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Tab 4: 1-Click Guest Mode */}
        {activeTab === 'guest' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#090312] border border-emerald-500/30 text-center">
              <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Instant Evaluator Guest Access</span>
              </div>
              <p className="text-xs text-slate-400">
                Click any profile below to explore with pre-loaded mock consultations and live AI triage:
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleGuestLogin('patient')}
                className="p-4 rounded-2xl bg-[#140628] border border-purple-500/40 hover:border-purple-400 hover:bg-purple-950/60 text-left transition-all group flex flex-col justify-between h-32 shadow-md disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-purple-300">Patient Guest</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Book slots &amp; AI triage</div>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleGuestLogin('doctor')}
                className="p-4 rounded-2xl bg-[#061826] border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-950/60 text-left transition-all group flex flex-col justify-between h-32 shadow-md disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-cyan-300">Doctor Guest</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Urgent queue &amp; Rx</div>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleGuestLogin('admin')}
                className="p-4 rounded-2xl bg-[#1e1004] border border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/60 text-left transition-all group flex flex-col justify-between h-32 shadow-md disabled:opacity-50"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-amber-300">Admin Guest</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">SQL Explorer &amp; Mail</div>
                </div>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
