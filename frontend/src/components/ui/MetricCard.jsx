import { Link } from 'react-router-dom';
import AnimatedCounter from './AnimatedCounter';

export default function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'cyan', // 'cyan' | 'blue' | 'purple' | 'red' | 'emerald' | 'amber'
  to,
  className = '',
}) {
  const colorMap = {
    cyan: {
      iconBg: 'bg-[#18b8d4]/10 text-[#18b8d4] border border-[#18b8d4]/20',
      accentText: 'text-[#18b8d4]',
      hoverBorder: 'hover:border-[#18b8d4]/40',
    },
    blue: {
      iconBg: 'bg-[#3d6ee8]/10 text-[#3d6ee8] border border-[#3d6ee8]/20',
      accentText: 'text-[#3d6ee8]',
      hoverBorder: 'hover:border-[#3d6ee8]/40',
    },
    purple: {
      iconBg: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20',
      accentText: 'text-[#8b5cf6]',
      hoverBorder: 'hover:border-[#8b5cf6]/40',
    },
    red: {
      iconBg: 'bg-[#ef5b5b]/10 text-[#ef5b5b] border border-[#ef5b5b]/20',
      accentText: 'text-[#ef5b5b]',
      hoverBorder: 'hover:border-[#ef5b5b]/40',
    },
    emerald: {
      iconBg: 'bg-[#34c98c]/10 text-[#34c98c] border border-[#34c98c]/20',
      accentText: 'text-[#34c98c]',
      hoverBorder: 'hover:border-[#34c98c]/40',
    },
    amber: {
      iconBg: 'bg-[#e08a3c]/10 text-[#e08a3c] border border-[#e08a3c]/20',
      accentText: 'text-[#e08a3c]',
      hoverBorder: 'hover:border-[#e08a3c]/40',
    },
  };

  const scheme = colorMap[color] || colorMap.cyan;

  const content = (
    <div
      className={`bg-[#0f1d23] border border-white/[0.085] rounded-2xl p-5 relative overflow-hidden transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] ${scheme.hoverBorder} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 flex-1 min-w-0">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#a3b1b7]">
            {label}
          </p>
          <p className="text-3xl font-bold tracking-tight text-[#f2f6f7]">
            {typeof value === 'number' ? <AnimatedCounter value={value} /> : value}
          </p>
          {subtext && (
            <p className="text-xs text-[#6f8188] font-medium truncate pt-0.5">
              {subtext}
            </p>
          )}
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${scheme.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return <Link to={to} className="block no-underline">{content}</Link>;
  }

  return content;
}
