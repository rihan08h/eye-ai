import { AlertTriangle } from 'lucide-react';

const CLASS_CONFIG = [
  { key: 'noDR', label: 'No DR', color: 'text-emerald-400', barBg: 'bg-gradient-to-r from-emerald-500 to-teal-400' },
  { key: 'mild', label: 'Mild DR', color: 'text-amber-400', barBg: 'bg-gradient-to-r from-amber-500 to-yellow-400' },
  { key: 'moderate', label: 'Moderate DR', color: 'text-orange-400', barBg: 'bg-gradient-to-r from-orange-500 to-amber-500' },
  { key: 'severe', label: 'Severe DR', color: 'text-red-400', barBg: 'bg-gradient-to-r from-red-600 to-rose-500' },
  { key: 'proliferative', label: 'Proliferative DR', color: 'text-purple-400', barBg: 'bg-gradient-to-r from-purple-600 to-fuchsia-500' },
];

export default function ProbabilityBars({ probabilities = {}, prediction }) {
  // Sort values to check for model uncertainty
  const values = CLASS_CONFIG.map((c) => ({
    ...c,
    value: Number(probabilities[c.key] ?? 0),
  })).sort((a, b) => b.value - a.value);

  const top1 = values[0] || { value: 0 };
  const top2 = values[1] || { value: 0 };

  // Uncertainty threshold: top 2 probabilities differ by 12% (0.12) or less
  const isUncertain = top1.value > 0 && top2.value > 0 && top1.value - top2.value <= 0.12;

  return (
    <div className="space-y-4">
      {/* Uncertainty Alert if top 2 are close */}
      {isUncertain && (
        <div className="flex items-start gap-3 bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-amber-200 shadow-md">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-300">
              Prediction Uncertainty Detected
            </p>
            <p className="text-amber-200/90 leading-relaxed">
              Top class predictions are close ({top1.label}: {(top1.value * 100).toFixed(0)}% vs{' '}
              {top2.label}: {(top2.value * 100).toFixed(0)}%). Secondary ophthalmic review strongly recommended.
            </p>
          </div>
        </div>
      )}

      {/* Probability Bars */}
      <div className="space-y-3">
        {CLASS_CONFIG.map((item) => {
          const val = Number(probabilities[item.key] ?? 0);
          const percent = Math.min(100, Math.max(0, Math.round(val * 100)));
          const isHighest = item.key === top1.key;

          return (
            <div key={item.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-semibold ${isHighest ? 'text-white font-bold' : 'text-slate-400'}`}>
                  {item.label}
                </span>
                <span className={`font-mono text-xs ${isHighest ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}>
                  {percent}%
                </span>
              </div>
              <div className="h-2.5 w-full bg-slate-900 border border-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${item.barBg} ${
                    isHighest ? 'shadow-[0_0_15px_rgba(6,182,212,0.5)]' : 'opacity-60'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
