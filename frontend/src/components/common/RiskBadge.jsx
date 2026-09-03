export default function RiskBadge({ riskLevel = 'low', label, className = '' }) {
  const config = {
    low: {
      bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
      defaultLabel: 'Routine / Low Risk',
    },
    medium: {
      bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      dot: 'bg-orange-400',
      defaultLabel: 'Specialist Referral',
    },
    high: {
      bg: 'bg-red-500/10 text-red-400 border-red-500/30 shadow-[0_0_15px_-3px_rgba(239,68,68,0.25)]',
      dot: 'bg-red-400 animate-ping',
      defaultLabel: 'Urgent Referral',
    },
    critical: {
      bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.3)]',
      dot: 'bg-purple-400 animate-ping',
      defaultLabel: 'Critical / Immediate Review',
    },
  };

  const style = config[riskLevel] || config.low;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${className}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span>{label || style.defaultLabel}</span>
    </span>
  );
}
