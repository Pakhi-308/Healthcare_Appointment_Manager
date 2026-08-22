import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/common/Badge';
import { 
  Bell, 
  RotateCw, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Filter, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const NotificationAuditPage = () => {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [retryingId, setRetryingId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status_filter = filter;

      const [logsRes, statsRes] = await Promise.all([
        api.get('/notifications/audit', { params }),
        api.get('/notifications/stats'),
      ]);
      setNotifications(logsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load notification audit records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  const handleManualRetry = async (id) => {
    setRetryingId(id);
    try {
      await api.post(`/notifications/retry/${id}`);
      toast.success(`Notification #${id} retried successfully!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Retry attempt failed.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Delivery &amp; Retry Orchestration</span>
          </div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">
            Notification Audit &amp; Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitored by APScheduler background workers with exponential backoff retry
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/50 text-purple-200 text-xs font-semibold flex items-center gap-2 self-start"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Log</span>
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30">
          <span className="text-[11px] text-emerald-300 font-semibold uppercase tracking-wider block">Sent Successfully</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{stats?.total_sent || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/30">
          <span className="text-[11px] text-amber-300 font-semibold uppercase tracking-wider block">Pending In Queue</span>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{stats?.total_pending || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/30">
          <span className="text-[11px] text-rose-300 font-semibold uppercase tracking-wider block">Failed Deliveries</span>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{stats?.total_failed || 0}</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-purple-500/30">
          <span className="text-[11px] text-purple-300 font-semibold uppercase tracking-wider block">Retried via Queue</span>
          <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">{stats?.total_retried || 0}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-purple-950 pb-4">
        {[
          { key: '', label: 'All Dispatches' },
          { key: 'failed', label: 'Failed Only' },
          { key: 'pending', label: 'Pending Only' },
          { key: 'sent', label: 'Delivered' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filter === t.key
                ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                : 'bg-purple-950/40 border border-purple-900/60 text-purple-300 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Notification Table */}
      <div className="glass-panel rounded-2xl border border-purple-900/50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-12 bg-purple-950/40 rounded-xl animate-pulse" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto" />
            <p>No notification logs matching current filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b0318] border-b border-purple-950 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Trigger Type</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Status &amp; Retries</th>
                  <th className="px-6 py-4">Logged At</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/60 text-slate-300">
                {notifications.map((notif) => {
                  const isSent = notif.status === 'sent';
                  const isPending = notif.status === 'pending';
                  const isFailed = notif.status === 'failed';

                  return (
                    <tr key={notif.id} className="hover:bg-purple-950/20 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{notif.recipient_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{notif.recipient_email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                          {notif.notification_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate text-slate-200">
                        {notif.subject}
                        {notif.error_message && (
                          <div className="text-[11px] text-rose-400 truncate mt-0.5" title={notif.error_message}>
                            Error: {notif.error_message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isSent && <Badge variant="success" size="sm">SENT</Badge>}
                          {isPending && <Badge variant="warning" size="sm">PENDING</Badge>}
                          {isFailed && <Badge variant="danger" size="sm">FAILED</Badge>}
                          {notif.retry_count > 0 && (
                            <span className="text-[10px] text-slate-400 font-mono">({notif.retry_count} retries)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(notif.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {(isFailed || isPending) && (
                          <button
                            disabled={retryingId === notif.id}
                            onClick={() => handleManualRetry(notif.id)}
                            className="px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-200 hover:bg-amber-900/60 text-xs font-semibold flex items-center gap-1.5 ml-auto disabled:opacity-50"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingId === notif.id ? 'animate-spin' : ''}`} />
                            <span>Retry Now</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
