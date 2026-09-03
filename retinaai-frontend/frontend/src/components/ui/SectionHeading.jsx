export default function SectionHeading({
  title,
  subtitle,
  badge,
  icon: Icon,
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}>
      <div className="space-y-1">
        {badge && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {badge}
          </div>
        )}
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  );
}
