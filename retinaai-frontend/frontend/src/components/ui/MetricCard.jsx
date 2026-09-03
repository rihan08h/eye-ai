import { Link } from 'react-router-dom';
import AnimatedCounter from './AnimatedCounter';

export default function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'cyan', // 'cyan' | 'blue' | 'purple' | 'red' | 'emerald' | 'amber'
  to,
  trend,
  className = '',
}) {
  const colorMap = {
    cyan: {
      border: 'hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]',
      glow: 'group-hover:text-cyan-400',
      lineGlow: 'from-cyan-500/30',
    },
    blue: {
      border: 'hover:border-blue-500/40',
      iconBg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)]',
      glow: 'group-hover:text-blue-400',
      lineGlow: 'from-blue-500/30',
    },
    purple: {
      border: 'hover:border-purple-500/40',
      iconBg: 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]',
      glow: 'group-hover:text-purple-400',
      lineGlow: 'from-purple-500/30',
    },
    red: {
      border: 'hover:border-red-500/40',
      iconBg: 'bg-red-500/10 text-red-400 border border-red-500/20 shadow-[0_0_15px_-3px_rgba(239,68,68,0.3)]',
      glow: 'group-hover:text-red-400',
      lineGlow: 'from-red-500/30',
    },
    emerald: {
      border: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-200/20 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]',
      glow: 'group-hover:text-emerald-400',
      lineGlow: 'from-emerald-500/30',
    },
    amber: {
      border: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]',
      glow: 'group-hover:text-amber-400',
      lineGlow: 'from-amber-500/30',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  const content = (
    <div
      className={`glass-card rounded-2xl p-5 relative overflow-hidden transition-all duration-300 group ${scheme.border} ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 z-10">
          <p className="text-[11px] font-mono tracking-wider uppercase text-slate-400 font-medium">
            {label}
          </p>
          <p className={`text-3xl font-extrabold tracking-tight text-white transition duration-200 ${scheme.glow}`}>
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {subtext && (
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 pt-0.5">
              {subtext}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Futuristic accent corner line */}
      <div className={`absolute -bottom-1 -right-1 w-16 h-16 bg-gradient-to-tl ${scheme.lineGlow} to-transparent rounded-full blur-xl opacity-40 group-hover:opacity-80 transition duration-500`} />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
