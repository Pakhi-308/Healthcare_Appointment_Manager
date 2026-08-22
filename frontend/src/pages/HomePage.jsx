import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Stethoscope, 
  Activity, 
  Bot, 
  ArrowRight, 
  Lock, 
  Users, 
  Zap, 
  CheckCircle2 
} from 'lucide-react';

export const HomePage = ({ onNavigate }) => {
  const { isAuthenticated, role, quickLogin } = useAuth();
  const [searchSpecialty, setSearchSpecialty] = useState('');

  const specialties = ['Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Oncology'];

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden">
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-indigo-900/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-[0_0_20px_rgba(168,85,247,0.25)] mb-8">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Next-Generation Intelligent Healthcare Management</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] font-['Outfit']">
            Clinical Care Meets{' '}
            <span className="gradient-text-purple">Intelligent Automation</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Experience friction-free healthcare appointments with <strong>concurrency-safe slot locking</strong>, 
            instant <strong>Groq LLaMA 3.3 AI pre-visit triage</strong>, and automated patient follow-ups.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('patient-doctors')}
              className="gradient-btn px-8 py-3.5 rounded-xl font-semibold text-white text-base flex items-center gap-2 shadow-[0_0_30px_rgba(124,58,237,0.4)]"
            >
              <Stethoscope className="w-5 h-5" />
              Find Specialists &amp; Book
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="px-8 py-3.5 rounded-xl font-semibold text-purple-200 bg-purple-950/50 border border-purple-800/50 hover:bg-purple-900/40 hover:text-white transition-all text-base"
            >
              Sign In to Portal
            </button>
          </div>

          {/* Interactive Specialty Quick-Tags */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs text-slate-400 font-medium mr-2">Specialists Available:</span>
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => onNavigate('patient-doctors')}
                className="px-3 py-1 rounded-full text-xs font-medium bg-[#160a30] border border-purple-800/40 text-purple-300 hover:border-purple-500/60 hover:text-white hover:bg-purple-900/40 transition-all"
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl sm:text-4xl font-bold text-white font-['Outfit']">
            Engineered for Precision &amp; Trust
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            A rock-solid architecture combining resilient concurrency control and advanced medical AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center mb-6 text-purple-400 group-hover:text-purple-300">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Zero Double-Booking</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Database-level pessimistic row locking (`FOR UPDATE`) with a temporary 10-minute hold lock prevents simultaneous collision and race conditions.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-purple-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Atomic Transaction Guaranteed</span>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center mb-6 text-cyan-400 group-hover:text-cyan-300">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Groq LLaMA 3.3 Triage</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Automated pre-visit urgency scoring and 3 clinical questions for the doctor, plus patient-friendly post-visit medication instructions with graceful offline fallbacks.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Resilient Error Degradation</span>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center mb-6 text-amber-400 group-hover:text-amber-300">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Leave &amp; Sync Engine</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              When doctors take leave, conflicting visits are automatically resolved, notifying affected patients with priority rebooking vouchers and cleaning up calendar events.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-amber-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Google Meet &amp; OAuth 2.0 Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* One-Click Role Simulator Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-purple-600/30 bg-gradient-to-br from-[#180a33] via-[#120627] to-[#0a0316] relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-purple-900/60 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Zap className="w-3.5 h-3.5 text-purple-400" />
              <span>Live Evaluation Mode</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">
              Test All 3 Portals Instantly
            </h3>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">
              Seamlessly switch roles to experience the end-to-end patient booking journey, doctor triage and digital prescription workflow, or administrator analytics dashboard.
            </p>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => {
                  quickLogin('patient');
                  onNavigate('patient-doctors');
                }}
                className="p-4 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-left transition-all hover:translate-y-[-2px] shadow-[0_4px_20px_rgba(168,85,247,0.15)]"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-purple-400">Patient Portal</div>
                <div className="text-sm font-semibold text-white mt-1">Eleanor Hughes</div>
                <div className="text-xs text-slate-400 mt-1">Book slots, fill symptoms &amp; view AI notes &rarr;</div>
              </button>

              <button
                onClick={() => {
                  quickLogin('doctor');
                  onNavigate('doctor-dashboard');
                }}
                className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 hover:border-cyan-400 text-left transition-all hover:translate-y-[-2px] shadow-[0_4px_20px_rgba(56,189,248,0.15)]"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-cyan-400">Doctor Portal</div>
                <div className="text-sm font-semibold text-white mt-1">Dr. Sarah Mitchell</div>
                <div className="text-xs text-slate-400 mt-1">View AI triage, write notes &amp; prescriptions &rarr;</div>
              </button>

              <button
                onClick={() => {
                  quickLogin('admin');
                  onNavigate('admin-dashboard');
                }}
                className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 hover:border-amber-400 text-left transition-all hover:translate-y-[-2px] shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Admin Portal</div>
                <div className="text-sm font-semibold text-white mt-1">System Administrator</div>
                <div className="text-xs text-slate-400 mt-1">Manage doctors, monitor leaves &amp; audit retries &rarr;</div>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
