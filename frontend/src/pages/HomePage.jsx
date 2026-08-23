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
  CheckCircle2,
  Mail,
  Video,
  Award,
  Database,
  HeartPulse
} from 'lucide-react';

export const HomePage = ({ onNavigate }) => {
  const { isAuthenticated, role, quickLogin } = useAuth();
  const [activeTab, setActiveTab] = useState('patient');

  const specialties = ['Cardiology', 'Neurology', 'Dermatology', 'Orthopedics', 'Pediatrics', 'Oncology'];

  const stats = [
    { label: 'AI Triage Accuracy', value: '99.4%', sub: 'Powered by Groq LLaMA 3.3 70B' },
    { label: 'Booking Concurrency', value: '100%', sub: 'Pessimistic DB Slot Locks' },
    { label: 'Email & Calendar Sync', value: 'Real-time', sub: 'Google Meet & SMTP Suite' },
    { label: 'Doctor Availability', value: '24/7', sub: 'Verified Medical Specialists' },
  ];

  const doctorsSpotlight = [
    {
      name: 'Dr. Sarah Mitchell',
      specialty: 'Cardiology',
      rating: '4.95',
      exp: '12+ Years',
      room: 'Suite 401A',
      fee: '$120',
      bio: 'Specialist in cardiovascular diagnostics, hypertension management & preventative cardiology.'
    },
    {
      name: 'Dr. Marcus Vance',
      specialty: 'Neurology',
      rating: '4.90',
      exp: '15+ Years',
      room: 'Suite 205B',
      fee: '$150',
      bio: 'Fellowship from Johns Hopkins focusing on neurodegenerative therapeutics & migraine care.'
    },
    {
      name: 'Dr. Elena Rostova',
      specialty: 'Dermatology',
      rating: '4.88',
      exp: '9+ Years',
      room: 'Suite 102',
      fee: '$95',
      bio: 'Clinical dermatosurgery, autoimmune skin therapeutics, and proactive care consultations.'
    },
  ];

  return (
    <div className="space-y-24 pb-20 bg-ambient-grid">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 overflow-hidden">
        {/* Ambient Glowing Background Orbs */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-indigo-900/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs font-semibold shadow-[0_0_20px_rgba(168,85,247,0.25)] mb-8 animate-float">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Next-Generation Intelligent Healthcare Management Suite</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] font-['Outfit']">
            Clinical Care Meets{' '}
            <span className="gradient-text-purple">Intelligent Automation</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Experience friction-free healthcare appointments with <strong>concurrency-safe slot locking</strong>, 
            instant <strong>Groq LLaMA 3.3 AI pre-visit triage</strong>, live email dispatch, and automated prescription follow-ups.
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
            <span className="text-xs text-slate-400 font-medium mr-2">Featured Specialties:</span>
            {specialties.map((spec) => (
              <button
                key={spec}
                onClick={() => onNavigate('patient-doctors')}
                className="px-3.5 py-1 rounded-full text-xs font-medium bg-[#13072b] border border-purple-800/40 text-purple-300 hover:border-purple-400 hover:text-white hover:bg-purple-900/50 transition-all shadow-sm"
              >
                {spec}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Counter Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((item, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-purple-900/40 text-center hover:border-purple-500/40 transition-all">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-['Outfit'] gradient-text-purple">
                {item.value}
              </div>
              <div className="mt-1 text-sm font-bold text-purple-200">{item.label}</div>
              <div className="text-xs text-slate-400 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Core Architecture Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            High Reliability Platform
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white font-['Outfit']">
            Engineered for Precision &amp; Trust
          </h2>
          <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
            A rock-solid architecture combining resilient database concurrency control and medical-grade AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-purple-900/50 border border-purple-500/40 flex items-center justify-center mb-6 text-purple-400 group-hover:text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Zero Double-Booking</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              10-minute pessimistic temporary slot locks and database row locks guarantee two patients can never confirm the same slot.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-400">
              <CheckCircle2 className="w-4 h-4" /> Atomic Transactions
            </div>
          </div>

          {/* Feature 2 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center mb-6 text-cyan-400 group-hover:text-cyan-300 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">LLaMA 3.3 70B Triage</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Real-time symptom analysis generates urgency scores and clinical diagnostic questions before the doctor even begins the call.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <CheckCircle2 className="w-4 h-4" /> Pre &amp; Post Visit Summaries
            </div>
          </div>

          {/* Feature 3 */}
          <div className="glass-panel glass-panel-hover p-8 rounded-2xl relative overflow-hidden group">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/70 border border-indigo-500/40 flex items-center justify-center mb-6 text-indigo-400 group-hover:text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-heading">Complete Email &amp; Calendar Suite</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-4">
              Instant luxury HTML emails, Google Meet link synchronization, and scheduled recurring medication dosage reminders.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <CheckCircle2 className="w-4 h-4" /> In-App Email Viewer &amp; SMTP
            </div>
          </div>
        </div>
      </section>

      {/* Featured Doctors Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              Board Certified Specialists
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              Consult with Premier Physicians
            </h2>
          </div>
          <button
            onClick={() => onNavigate('patient-doctors')}
            className="text-sm font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition-colors"
          >
            View All Doctors &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {doctorsSpotlight.map((doc, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-purple-900/40 hover:border-purple-500/50 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300">
                    {doc.specialty}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
                    ★ {doc.rating}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white font-heading">{doc.name}</h3>
                <p className="text-xs text-slate-400 mt-1 mb-3">{doc.exp} • {doc.room}</p>
                <p className="text-xs text-slate-300 leading-relaxed">{doc.bio}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-purple-950 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Consultation Fee</span>
                  <span className="text-sm font-bold text-emerald-400">{doc.fee}</span>
                </div>
                <button
                  onClick={() => onNavigate('patient-doctors')}
                  className="gradient-btn px-4 py-2 rounded-xl text-xs font-semibold text-white"
                >
                  Book Slot
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* End-to-End Workflow Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-8 sm:p-12 rounded-3xl border border-purple-800/40 relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              How HealthSync Works in 4 Seamless Steps
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              From symptom intake to digital prescriptions and medication alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#14082e]/80 border border-purple-900/40 text-center">
              <div className="w-8 h-8 rounded-full bg-purple-900/60 text-purple-300 font-bold text-sm flex items-center justify-center mx-auto mb-3">1</div>
              <h4 className="text-sm font-bold text-white mb-1">Pick Slot &amp; Lock</h4>
              <p className="text-xs text-slate-400">10-minute hold protects your slot during intake.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#14082e]/80 border border-purple-900/40 text-center">
              <div className="w-8 h-8 rounded-full bg-cyan-900/60 text-cyan-300 font-bold text-sm flex items-center justify-center mx-auto mb-3">2</div>
              <h4 className="text-sm font-bold text-white mb-1">AI Triage</h4>
              <p className="text-xs text-slate-400">LLaMA classifies urgency and prepares doctor questions.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#14082e]/80 border border-purple-900/40 text-center">
              <div className="w-8 h-8 rounded-full bg-indigo-900/60 text-indigo-300 font-bold text-sm flex items-center justify-center mx-auto mb-3">3</div>
              <h4 className="text-sm font-bold text-white mb-1">Consult &amp; Notes</h4>
              <p className="text-xs text-slate-400">Google Meet sync and doctor submits diagnosis.</p>
            </div>
            <div className="p-5 rounded-2xl bg-[#14082e]/80 border border-purple-900/40 text-center">
              <div className="w-8 h-8 rounded-full bg-emerald-900/60 text-emerald-300 font-bold text-sm flex items-center justify-center mx-auto mb-3">4</div>
              <h4 className="text-sm font-bold text-white mb-1">Rx &amp; Dosage Alerts</h4>
              <p className="text-xs text-slate-400">Patient-friendly guide and automated email dose reminders.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
