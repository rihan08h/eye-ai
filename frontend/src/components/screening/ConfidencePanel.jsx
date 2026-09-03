/**
 * Confidence and uncertainty, kept visually distinct.
 *
 * Model confidence is the top softmax probability. It says how strongly the
 * network preferred one class over the others on this image — nothing more.
 * It is not a probability that the patient has that disease stage, and the
 * copy here is written so it cannot be read that way.
 *
 * Uncertainty is the separate signal: entropy across the distribution and the
 * margin between the top two classes. A 43% / 38% split is a low-margin
 * prediction regardless of what the headline label says.
 */
export default function ConfidencePanel({ confidence, uncertainty }) {
  const hasConfidence = typeof confidence === 'number';
  const confidencePercent = hasConfidence ? Math.round(confidence * 100) : null;

  const level = uncertainty?.level || null;

  const levelCopy = {
    LOW: { label: 'Low', tone: 'text-emerald-400', ring: 'border-emerald-500/30' },
    MODERATE: { label: 'Moderate', tone: 'text-amber-400', ring: 'border-amber-500/30' },
    HIGH: { label: 'High', tone: 'text-orange-400', ring: 'border-orange-500/30' },
    CRITICAL: { label: 'Critical', tone: 'text-red-400', ring: 'border-red-500/30' },
  };

  const meta = level ? levelCopy[level] : null;

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-slate-900/90 rounded-2xl p-3.5 border border-slate-800">
        <p className="text-[11px] text-slate-400 font-medium">Model confidence</p>
        <p className="text-xl font-black text-cyan-400 font-mono mt-0.5">
          {confidencePercent == null ? '—' : `${confidencePercent}%`}
        </p>
        <p className="text-[10px] text-slate-500 leading-snug mt-1">
          How strongly the model preferred this class. Not a measure of diagnostic accuracy.
        </p>
      </div>

      <div className={`bg-slate-900/90 rounded-2xl p-3.5 border ${meta?.ring || 'border-slate-800'}`}>
        <p className="text-[11px] text-slate-400 font-medium">Uncertainty</p>
        <p className={`text-xl font-black font-mono mt-0.5 ${meta?.tone || 'text-slate-500'}`}>
          {meta?.label || '—'}
        </p>
        {uncertainty?.margin != null ? (
          <p className="text-[10px] text-slate-500 leading-snug mt-1">
            Top-two margin {Math.round(uncertainty.margin * 100)}%
            {uncertainty.entropy != null && ` · entropy ${uncertainty.entropy.toFixed(2)}`}
          </p>
        ) : (
          <p className="text-[10px] text-slate-500 leading-snug mt-1">Not recorded.</p>
        )}
      </div>
    </div>
  );
}
