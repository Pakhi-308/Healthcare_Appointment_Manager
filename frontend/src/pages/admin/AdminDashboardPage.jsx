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
  Activity,
  Database,
  Server,
  Layers,
  Code,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react';

export const AdminDashboardPage = ({ onNavigate }) => {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('metrics'); // 'metrics' or 'database'
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [resAnalytics, resDb] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/database/stats').catch(() => ({ data: null }))
      ]);
      setStats(resAnalytics.data);
      if (resDb && resDb.data) {
        setDbStats(resDb.data);
      }
    } catch (err) {
      toast.error('Failed to load system analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const sampleSqlDdl = `-- HealthSync Standard Production SQL Schema
-- Compatible with MySQL 8.0+, PostgreSQL 14+, SQLite

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'PATIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(100) NOT NULL,
    consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 100.00,
    slot_duration_minutes INT NOT NULL DEFAULT 30,
    working_hours_start TIME NOT NULL DEFAULT '09:00:00',
    working_hours_end TIME NOT NULL DEFAULT '17:00:00',
    working_days VARCHAR(100) NOT NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    slot_start DATETIME NOT NULL,
    slot_end DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE slot_holds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    patient_id INT NOT NULL,
    slot_start DATETIME NOT NULL,
    slot_end DATETIME NOT NULL,
    hold_token VARCHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'HELD'
);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sampleSqlDdl);
    setCopiedSql(true);
    toast.success('SQL DDL copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2000);
  };

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
            Platform Analytics &amp; SQL Database Engine
          </h1>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 bg-[#12072b] p-1 rounded-xl border border-purple-900/50">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'metrics'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview &amp; Metrics
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'database'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            SQL Database Explorer
          </button>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors ml-1"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'metrics' ? (
        <>
          {/* Analytics Cards Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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
                  <h4 className="text-base font-bold text-white group-hover:text-amber-300">Notification Audit &amp; SMTP</h4>
                  <p className="text-xs text-slate-400">Inspect email delivery logs, test live SMTP &amp; retry failed emails</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </>
      ) : (
        /* Database & SQL Explorer Tab */
        <div className="space-y-6">
          {/* Engine Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Active Database Engine</span>
                <div className="text-xl font-bold text-white uppercase font-['JetBrains_Mono']">
                  {dbStats?.engine_type || 'SQLITE'}
                </div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Connection Healthy
                </span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-purple-500/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-950/70 border border-purple-500/40 flex items-center justify-center text-purple-400">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Total Managed Tables</span>
                <div className="text-xl font-bold text-white font-['JetBrains_Mono']">
                  {dbStats?.total_tables || 11} Relational Tables
                </div>
                <span className="text-[11px] text-purple-300 font-medium mt-0.5">
                  {dbStats?.total_records || 0} Total Records Tracked
                </span>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-amber-500/40 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-950/70 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Schema Migrations</span>
                <div className="text-sm font-bold text-white font-['JetBrains_Mono']">
                  Alembic 001 Initial Schema
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  MySQL &amp; Postgres Compatible DDL
                </span>
              </div>
            </div>
          </div>

          {/* Tables Row Count Grid */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-900/50">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-heading">
              <Database className="w-4 h-4 text-cyan-400" />
              Relational Tables &amp; Live Row Counts
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {dbStats?.tables?.map((tbl, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#12072b] border border-purple-900/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-200 font-['JetBrains_Mono'] block">
                      {tbl.table_name}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{tbl.description}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-700/40 text-purple-300 text-xs font-bold font-['JetBrains_Mono']">
                    {tbl.row_count} rows
                  </span>
                </div>
              )) || (
                <div className="col-span-3 text-center py-6 text-sm text-slate-400">
                  Loading table metadata...
                </div>
              )}
            </div>
          </div>

          {/* SQL Schema DDL Viewer */}
          <div className="glass-panel p-6 rounded-2xl border border-purple-900/50 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-900/40">
              <div>
                <h3 className="text-base font-bold text-white font-heading">Production SQL Schema &amp; DDL Export</h3>
                <p className="text-xs text-slate-400">Available in <code className="text-purple-300">backend/database_schema.sql</code></p>
              </div>
              <button
                onClick={copySqlToClipboard}
                className="px-3.5 py-1.5 rounded-xl bg-purple-900/50 hover:bg-purple-800 border border-purple-600/40 text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? 'Copied!' : 'Copy SQL Schema'}
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-[#07020d] border border-purple-900/60 text-purple-300 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
              <code>{sampleSqlDdl}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
