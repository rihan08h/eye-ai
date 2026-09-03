export default function StatusBadge({
  status = 'default',
  label,
  pulse = false,
  size = 'md',
  className = '',
}) {
  const statusStyles = {
    // DR Grades & Risks
    'No DR': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Mild: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    Moderate: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    Severe: 'bg-red-500/10 text-red-400 border-red-500/30',
    'Proliferative DR': 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]',

    // Risk levels
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    medium: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    high: 'bg-red-500/10 text-red-400 border-red-500/30',
    critical: 'bg-purple-500/10 text-purple-400 border-purple-500/30 animate-pulse',

    // Referral Statuses
    Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'Under Review': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'Appointment Scheduled': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',

    // General
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    Upcoming: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    default: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const dotColors = {
    'No DR': 'bg-emerald-400',
    Mild: 'bg-amber-400',
    Moderate: 'bg-orange-400',
    Severe: 'bg-red-400',
    'Proliferative DR': 'bg-purple-400',
    low: 'bg-emerald-400',
    medium: 'bg-orange-400',
    high: 'bg-red-400',
    critical: 'bg-purple-400',
    Pending: 'bg-amber-400',
    'Under Review': 'bg-purple-400',
    'Appointment Scheduled': 'bg-cyan-400',
    Completed: 'bg-emerald-400',
    Active: 'bg-emerald-400',
    Upcoming: 'bg-blue-400',
    default: 'bg-slate-400',
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-xs font-bold gap-2',
  };

  const currentStyle = statusStyles[status] || statusStyles.default;
  const dotColor = dotColors[status] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${currentStyle} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
          pulse || status === 'critical' || status === 'high' || status === 'Severe' || status === 'Proliferative DR'
            ? 'animate-ping'
            : ''
        }`}
      />
      <span>{label || status}</span>
    </span>
  );
}
