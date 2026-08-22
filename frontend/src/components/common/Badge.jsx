import React from 'react';

export const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const variantClasses = {
    default: 'bg-purple-950/70 border border-purple-500/30 text-purple-200',
    primary: 'bg-purple-900/60 border border-purple-400/40 text-purple-100 shadow-[0_0_10px_rgba(168,85,247,0.2)]',
    cyan: 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 shadow-[0_0_10px_rgba(56,189,248,0.2)]',
    success: 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200',
    warning: 'bg-amber-950/60 border border-amber-500/40 text-amber-200',
    danger: 'bg-rose-950/60 border border-rose-500/40 text-rose-200',
    // Urgency Badges
    urgencyLow: 'bg-emerald-950/80 border border-emerald-400/60 text-emerald-300 font-semibold shadow-[0_0_12px_rgba(16,185,129,0.25)]',
    urgencyMedium: 'bg-amber-950/80 border border-amber-400/60 text-amber-300 font-semibold shadow-[0_0_12px_rgba(245,158,11,0.25)]',
    urgencyHigh: 'bg-rose-950/90 border border-rose-400/70 text-rose-300 font-bold animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.4)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide ${sizeClasses[size]} ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {children}
    </span>
  );
};
