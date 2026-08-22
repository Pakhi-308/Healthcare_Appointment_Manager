import React, { useState, useEffect } from 'react';
import { Lock, AlertCircle, Clock } from 'lucide-react';

const parseUtcDate = (dateStr) => {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return dateStr;
  const str = String(dateStr);
  const hasTimezone = /Z|[+-]\d{2}:?\d{2}$/.test(str);
  return new Date(hasTimezone ? str : `${str}Z`);
};

export const SlotHoldTimer = ({ expiresAt, onExpired, totalSeconds = 600 }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    if (!expiresAt) return totalSeconds;
    const parsed = parseUtcDate(expiresAt);
    if (!parsed || isNaN(parsed.getTime())) return totalSeconds;
    const diff = Math.floor((parsed.getTime() - Date.now()) / 1000);
    // If diff is negative (e.g. clock skew between client/server), default safely to 600s
    return diff > 0 ? diff : totalSeconds;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onExpired) onExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const percentage = Math.min(100, (timeLeft / totalSeconds) * 100);

  const isUrgent = timeLeft < 120; // less than 2 mins

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isUrgent 
        ? 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)]' 
        : 'bg-purple-950/40 border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
    }`}>
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-rose-900/60 text-rose-300' : 'bg-purple-900/60 text-purple-300'}`}>
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Slot Reserved for You</h4>
            <p className="text-xs text-slate-400">Complete symptoms intake to confirm</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-mono font-bold ${isUrgent ? 'text-rose-400 animate-pulse' : 'text-purple-300'}`}>
            {formattedTime}
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Remaining</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div 
          className={`h-full transition-all duration-1000 ${
            isUrgent 
              ? 'bg-gradient-to-r from-rose-600 to-amber-500' 
              : 'bg-gradient-to-r from-purple-600 via-purple-400 to-cyan-400'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
