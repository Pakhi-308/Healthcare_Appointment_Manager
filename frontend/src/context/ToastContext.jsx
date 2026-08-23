import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

const formatMessage = (msg) => {
  if (typeof msg === 'string') return msg;
  if (!msg) return 'An event occurred.';
  if (Array.isArray(msg)) {
    return msg.map(item => typeof item === 'object' ? item.msg || JSON.stringify(item) : String(item)).join(', ');
  }
  if (typeof msg === 'object') {
    return msg.msg || msg.message || msg.detail || JSON.stringify(msg);
  }
  return String(msg);
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4500) => {
    const id = Date.now() + Math.random();
    const cleanMessage = formatMessage(message);
    setToasts((prev) => [...prev, { id, message: cleanMessage, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4">
        {toasts.map((t) => {
          let bg = 'bg-[#1e0d3b] border-purple-500/40 text-purple-200';
          let Icon = Info;
          if (t.type === 'success') {
            bg = 'bg-[#0f2d1e] border-emerald-500/50 text-emerald-100';
            Icon = CheckCircle2;
          } else if (t.type === 'error') {
            bg = 'bg-[#3b0d1e] border-rose-500/50 text-rose-100';
            Icon = AlertCircle;
          } else if (t.type === 'warning') {
            bg = 'bg-[#3b280d] border-amber-500/50 text-amber-100';
            Icon = AlertTriangle;
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 transform translate-y-0 ${bg}`}
            >
              <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
