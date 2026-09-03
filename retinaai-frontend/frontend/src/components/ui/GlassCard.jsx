import React from 'react';

export default function GlassCard({
  children,
  className = '',
  variant = 'default', // 'default' | 'elevated' | 'glow-cyan' | 'glow-blue' | 'glow-purple' | 'interactive'
  onClick,
  ...props
}) {
  const variantClasses = {
    default: 'glass-card',
    elevated: 'glass-panel-elevated',
    'glow-cyan': 'glass-panel border-cyan-500/30 shadow-[0_0_25px_-5px_rgba(6,182,212,0.25)]',
    'glow-blue': 'glass-panel border-blue-500/30 shadow-[0_0_25px_-5px_rgba(59,130,246,0.25)]',
    'glow-purple': 'glass-panel border-purple-500/30 shadow-[0_0_25px_-5px_rgba(139,92,246,0.25)]',
    interactive: 'glass-card hover:border-cyan-500/40 hover:bg-slate-900/80 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0',
  };

  return (
    <div
      className={`rounded-2xl p-5 relative overflow-hidden transition-all duration-300 ${variantClasses[variant] || variantClasses.default} ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Subtle top glare line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
