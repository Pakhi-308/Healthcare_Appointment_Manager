import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  ShieldCheck, 
  Users, 
  Calendar, 
  DollarSign, 
  Bell, 
  Bot, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Stethoscope,
  Activity
} from 'lucide-react';

export const AdminDashboardPage = ({ onNavigate }) => {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics');
      setStats(res.data);
    } catch (err) {
      toast.error('Failed to load system analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Hospital Administration Console</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Platform Analytics &amp; Operations
          </h1>
        </div>

        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs font-semibold hover:bg-amber-900/40 self-start"
        >
          Refresh Metrics
        </button>
      </div>

      {/* Analytics Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Appointments */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Bookings</span>
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-['Outfit']">
              {stats?.total_appointments || 0}
            </div>
            <div className="flex items-center gap-2 text-xs text-purple-300 mt-2">
              <span>{stats?.active_bookings || 0} Active</span>
              <span>•</span>
              <span>{stats?.completed_visits || 0} Completed</span>
            </div>
          </div>

          {/* Card 2: Platform Revenue */}
          <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Gross Fee Volume</span>
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2 font-['Outfit']">
              ${stats?.total_revenue?.toLocaleString() || '0.00'}
            </div>
            <span className="text-xs text-slate-400 mt-2">Aggregated consultation fees</span>
          </div>

          {/* Card 3: Doctors & Patients */}
          <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Staff &amp; Patients</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-extrabold text-white mt-2 font-['Outfit']">
              {stats?.total_doctors || 0} Docs
            </div>
            <span className="text-xs text-slate-400 mt-2">{stats?.total_patients || 0} Registered Patients</span>
          </div>

          {/* Card 4: AI Summaries */}
          <div className="glass-panel p-6 rounded-2xl border border-amber-500/30 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Groq AI Generations</span>
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold text-amber-300 mt-2 font-['Outfit']">
              {stats?.ai_summaries_generated || 0}
            </div>
            <span className="text-xs text-slate-400 mt-2">LLaMA 3.3 70B Clinical Runs</span>
          </div>
        </div>
      )}

      {/* Secondary Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Health */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-950">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-bold text-white font-['Outfit']">Notification Delivery Health</h3>
            </div>
            <button
              onClick={() => onNavigate('admin-notifications')}
              className="text-xs text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
            >
              <span>View Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
              <span className="text-emerald-300 block font-semibold">Sent Notifications</span>
              <div className="text-2xl font-bold text-white mt-1">{stats?.notifications_sent || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30">
              <span className="text-rose-300 block font-semibold">Failed Dispatches</span>
              <div className="text-2xl font-bold text-rose-400 mt-1">{stats?.notifications_failed || 0}</div>
            </div>
          </div>
        </div>

        {/* Cancellation Metrics */}
        <div className="glass-panel p-6 rounded-2xl border border-purple-900/50 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-purple-950">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white font-['Outfit']">Booking Stability Metrics</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
              <span className="text-purple-300 block font-semibold">Cancelled Bookings</span>
              <div className="text-2xl font-bold text-white mt-1">{stats?.cancelled_appointments || 0}</div>
            </div>
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-800/40">
              <span className="text-purple-300 block font-semibold">Cancellation Rate</span>
              <div className="text-2xl font-bold text-white mt-1">{stats?.cancellation_rate || 0}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div
          onClick={() => onNavigate('admin-doctors')}
          className="glass-panel glass-panel-hover p-6 rounded-2xl border border-purple-900/60 cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-900/60 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-purple-300">Manage Doctors &amp; Hours</h4>
              <p className="text-xs text-slate-400">Add physicians, update specializations, working slots and fees</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <div
          onClick={() => onNavigate('admin-notifications')}
          className="glass-panel glass-panel-hover p-6 rounded-2xl border border-purple-900/60 cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white group-hover:text-amber-300">Notification Audit &amp; Retry Queue</h4>
              <p className="text-xs text-slate-400">Inspect email delivery logs, retry failed reminders &amp; triggers</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
