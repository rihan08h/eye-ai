import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is currently no data matching your query.',
  action,
  className = '',
}) {
  return (
    <div className={`glass-card rounded-2xl p-10 text-center space-y-4 flex flex-col items-center justify-center border border-slate-800/80 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center text-slate-400 shadow-inner">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>

      <div className="space-y-1 max-w-sm">
        <h3 className="text-base font-bold text-white tracking-tight">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed">{description}</p>
      </div>

      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
