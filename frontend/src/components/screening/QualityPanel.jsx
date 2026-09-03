import { Check, X, Minus } from 'lucide-react';

/**
 * Image quality breakdown from the OpenCV assessor.
 *
 * Shows the four checks individually rather than a single score, because
 * "72%" tells a health worker nothing actionable while "retina not centered"
 * tells them how to recapture.
 *
 * Every field can be null. When the assessment is missing this says so
 * instead of falling back to "Good", which is what the previous inline
 * markup did via `screening.imageQuality?.status || 'Good'`.
 */
export default function QualityPanel({ imageQuality }) {
  if (!imageQuality || imageQuality.score == null) {
    return (
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800">
        <p className="text-xs font-bold text-slate-200">Image quality</p>
        <p className="text-xs text-slate-400 mt-1.5">
          No quality assessment is recorded for this screening.
        </p>
      </div>
    );
  }

  const { score, status, gradable, issues = [], metrics = {} } = imageQuality;

  const checks = [
    { key: 'blurOk', label: 'Sharpness', value: metrics.blur },
    { key: 'brightnessOk', label: 'Brightness', value: metrics.brightness },
    { key: 'contrastOk', label: 'Contrast', value: metrics.contrast },
    { key: 'centeredOk', label: 'Centering', value: metrics.centering },
  ];

  const scorePercent = Math.round(score * 100);

  const statusTone =
    gradable === false
      ? 'text-red-400'
      : status === 'good'
        ? 'text-emerald-400'
        : 'text-amber-400';

  return (
    <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs font-bold text-slate-200">Image quality</p>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-black text-white">{scorePercent}%</span>
          <span className={`text-xs font-bold capitalize ${statusTone}`}>
            {gradable === false ? 'Ungradable' : status}
          </span>
        </div>
      </div>

      <div
        className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden"
        role="meter"
        aria-valuenow={scorePercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Overall image quality score"
      >
        <div
          className={`h-full rounded-full ${gradable === false ? 'bg-red-500' : scorePercent >= 85 ? 'bg-emerald-500' : 'bg-amber-500'}`}
          style={{ width: `${scorePercent}%` }}
        />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
        {checks.map(({ key, label, value }) => {
          const ok = metrics[key];
          const Icon = ok === true ? Check : ok === false ? X : Minus;
          const tone =
            ok === true ? 'text-emerald-400' : ok === false ? 'text-red-400' : 'text-slate-500';
          return (
            <div key={key} className="flex items-center justify-between gap-2 text-xs">
              <dt className="text-slate-400 flex items-center gap-1.5">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${tone}`} />
                {label}
              </dt>
              <dd className="font-mono text-slate-300">
                {value == null ? '—' : typeof value === 'number' ? value.toFixed(1) : value}
              </dd>
            </div>
          );
        })}
      </dl>

      {issues.length > 0 && (
        <ul className="text-xs text-amber-300 space-y-1 pt-1 border-t border-slate-800">
          {issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
