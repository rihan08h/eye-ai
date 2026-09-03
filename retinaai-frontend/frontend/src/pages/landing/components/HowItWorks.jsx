import { useState } from 'react';
import { UploadCloud, Cpu, Sparkles, GitBranch, HeartHandshake, Camera, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    tag: 'CAPTURE',
    tagColor: '#06b6d4',
    title: 'Capture or Upload\nRetinal Image',
    desc: 'Capture high-quality retinal fundus images using a portable fundus camera or upload existing images from the patient\'s record. Supports JPEG, PNG, and DICOM formats.',
    icon: UploadCloud,
    visual: 'capture',
    visualLabel: 'Fundus Camera Input',
  },
  {
    step: '02',
    tag: 'ANALYZE',
    tagColor: '#3b82f6',
    title: 'AI Analyzes\nRetinal Image',
    desc: 'Our deep learning model analyzes the image and classifies diabetic retinopathy severity across 5 clinical stages with high confidence probability scores.',
    icon: Cpu,
    visual: 'analyze',
    visualLabel: 'AI Classification',
    visualData: [
      { label: 'No DR', pct: 0.3, color: '#10b981' },
      { label: 'Mild DR', pct: 5.8, color: '#84cc16' },
      { label: 'Moderate DR', pct: 16.7, color: '#f59e0b' },
      { label: 'Severe DR', pct: 63.2, color: '#ef4444', active: true },
      { label: 'Proliferative DR', pct: 12.0, color: '#dc2626' },
    ],
    prediction: 'Severe DR',
    isExample: true,  // illustrative mock-up, not a real screening
  },
  {
    step: '03',
    tag: 'EXPLAIN',
    tagColor: '#8b5cf6',
    title: 'Understand with\nExplainable AI',
    desc: 'Grad-CAM heatmaps highlight the exact retinal regions that influenced the AI decision, helping you trust every result with visual evidence.',
    icon: Sparkles,
    visual: 'explain',
    visualLabel: 'Grad-CAM Heatmap',
    confidence: 92,
  },
  {
    step: '04',
    tag: 'ACT',
    tagColor: '#f59e0b',
    title: 'Take Action &\nRefer High-Risk',
    desc: 'High-risk patients are automatically prioritized for specialist referral and follow-up, ensuring timely treatment through our integrated triage system.',
    icon: GitBranch,
    visual: 'refer',
    visualLabel: 'Automated Triage',
    referralFlow: ['Screened', 'High Risk (Severe DR)', 'Refer to Specialist', 'Follow-up & Treatment'],
  },
  {
    step: '05',
    tag: 'IMPACT',
    tagColor: '#10b981',
    title: 'Built for\nRural Healthcare',
    desc: 'Designed for the unique challenges of rural India. Works completely offline, uses minimal bandwidth, and operates in low-connectivity environments for maximum reach.',
    icon: HeartHandshake,
    visual: 'rural',
    visualLabel: 'Rural Deployment',
    features: ['Works Offline', 'Low Bandwidth', 'Easy to Use'],
  },
];

function CaptureVisual() {
  return (
    <div className="relative w-full h-64 flex items-center justify-center rounded-3xl overflow-hidden border border-cyan-500/20"
      style={{ background: 'radial-gradient(ellipse at center, #0c1e38 0%, #060b18 100%)' }}>
      {/* Simulated retinal fundus */}
      <div className="relative w-44 h-44 rounded-full overflow-hidden border-2 border-cyan-500/40 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
        <div className="absolute inset-0 rounded-full" style={{
          background: 'radial-gradient(circle at 60% 48%, #7f1d1d 0%, #450a0a 40%, #1a0303 70%, #030712 100%)'
        }} />
        <div className="absolute" style={{
          top: '42%', left: '62%',
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fde68a 0%, #f59e0b 60%, transparent 100%)',
        }} />
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3 py-1.5">
        <Camera className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[10px] font-mono font-bold text-cyan-400">Image Loaded</span>
      </div>
      <div className="absolute bottom-4 left-4 text-[10px] font-mono text-slate-400">
        patient_id: P-0042 · eye: OD · quality: HIGH
      </div>
    </div>
  );
}

function AnalyzeVisual({ data, prediction }) {
  return (
    <div className="w-full rounded-3xl border border-blue-500/20 p-6 space-y-4"
      style={{ background: 'radial-gradient(ellipse at top, #0d1a35 0%, #060b18 100%)' }}>
      <p className="text-xs font-mono font-bold text-blue-400 uppercase tracking-wider">AI Classification</p>
      <div className="space-y-2.5">
        {data.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className={`font-semibold ${item.active ? 'text-white' : 'text-slate-400'}`}>{item.label}</span>
              <span className="font-mono font-bold" style={{ color: item.color }}>{item.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(item.pct / 70) * 100}%`, background: item.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
        <span className="text-xs text-slate-400">Predicted:</span>
        <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full">{prediction}</span>
      </div>
    </div>
  );
}

function ExplainVisual({ confidence }) {
  return (
    <div className="w-full rounded-3xl border border-purple-500/20 p-6 space-y-4"
      style={{ background: 'radial-gradient(ellipse at top, #14102a 0%, #060b18 100%)' }}>
      <p className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">Grad-CAM Heatmap</p>
      <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-purple-500/20">
        {/* Simulated heatmap */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 55% 48%, #7f1d1d 0%, #450a0a 40%, #1a0303 70%, #030712 100%)'
        }} />
        <div className="absolute" style={{
          top: '28%', left: '38%', width: 52, height: 52, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(239,68,68,0.9) 0%, rgba(251,146,60,0.6) 50%, transparent 100%)',
          filter: 'blur(4px)',
        }} />
        <div className="absolute" style={{
          top: '35%', left: '55%', width: 34, height: 34, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(250,204,21,0.8) 0%, transparent 80%)',
          filter: 'blur(3px)',
        }} />
        <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1 text-[9px] font-mono text-purple-300">
          GRAD-CAM · OVERLAY
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">Confidence Score</span>
        <span className="text-xl font-black text-purple-400">{confidence}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
          style={{ width: `${confidence}%` }} />
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        AI focused on lesions and abnormal regions shown in heatmap.
      </p>
    </div>
  );
}

function ReferralVisual({ flow }) {
  return (
    <div className="w-full rounded-3xl border border-amber-500/20 p-6 space-y-4"
      style={{ background: 'radial-gradient(ellipse at top, #1a1106 0%, #060b18 100%)' }}>
      <p className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">Triage Pathway</p>
      <div className="flex items-center gap-1.5 flex-wrap">
        {flow.map((step, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border ${i === 1
              ? 'bg-red-500/15 border-red-500/40 text-red-400'
              : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}>
              {step}
            </div>
            {i < flow.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
          </div>
        ))}
      </div>
      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
        Automated referral packet dispatched to regional ophthalmologist
      </div>
    </div>
  );
}

function RuralVisual({ features }) {
  return (
    <div className="w-full rounded-3xl border border-emerald-500/20 p-6 space-y-4"
      style={{ background: 'radial-gradient(ellipse at top, #061510 0%, #060b18 100%)' }}>
      <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Deployment Specs</p>
      <div className="space-y-3">
        {features.map((feat) => (
          <div key={feat} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-white">{feat}</span>
          </div>
        ))}
      </div>
      <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl text-[10px] text-emerald-400 leading-relaxed">
        Designed for ASHA workers and village health centers across Tier-3 India
      </div>
    </div>
  );
}

export default function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState(null);

  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Subtle vertical gradient separator */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            Standardized Screening Workflow
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            How It Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            A guided clinical protocol that empowers healthcare workers with zero AI experience.
          </p>
        </div>

        {/* Full-width alternating step rows — exactly like reference, but premium */}
        <div className="space-y-0">
          {STEPS.map((step, idx) => {
            const isEven = idx % 2 === 0;
            const Icon = step.icon;

            let VisualComponent;
            if (step.visual === 'capture') VisualComponent = <CaptureVisual />;
            else if (step.visual === 'analyze') VisualComponent = <AnalyzeVisual data={step.visualData} prediction={step.prediction} />;
            else if (step.visual === 'explain') VisualComponent = <ExplainVisual confidence={step.confidence} />;
            else if (step.visual === 'refer') VisualComponent = <ReferralVisual flow={step.referralFlow} />;
            else VisualComponent = <RuralVisual features={step.features} />;

            return (
              <div
                key={step.step}
                onMouseEnter={() => setHoveredStep(idx)}
                onMouseLeave={() => setHoveredStep(null)}
                className={`relative grid grid-cols-1 lg:grid-cols-2 gap-0 border-t border-slate-800/60 transition-all duration-300 ${hoveredStep === idx ? 'bg-slate-900/30' : ''}`}
              >
                {/* Step Number Vertical Line (left side indicator) */}
                <div className="absolute left-0 top-0 bottom-0 w-1 rounded-full"
                  style={{
                    background: hoveredStep === idx
                      ? `linear-gradient(to bottom, ${step.tagColor}, transparent)`
                      : 'transparent',
                    transition: 'background 0.3s ease',
                  }}
                />

                {/* Text Content Side */}
                <div className={`px-8 sm:px-12 py-14 flex flex-col justify-center space-y-6 ${isEven ? 'lg:order-1' : 'lg:order-2'}`}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-4xl font-black text-slate-700">{step.step}</span>
                    <span
                      className="text-[10px] font-mono font-bold tracking-[0.18em] px-2.5 py-0.5 rounded-full border uppercase"
                      style={{
                        color: step.tagColor,
                        background: `${step.tagColor}15`,
                        borderColor: `${step.tagColor}30`,
                      }}
                    >
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight whitespace-pre-line">
                    {step.title}
                  </h3>

                  <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-md">
                    {step.desc}
                  </p>

                  <div className="flex items-center gap-2.5 pt-2">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                      style={{
                        background: `${step.tagColor}15`,
                        borderColor: `${step.tagColor}30`,
                        color: step.tagColor,
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      {step.visualLabel}
                    </span>
                  </div>
                </div>

                {/* Visual Content Side */}
                <div className={`px-8 sm:px-12 py-14 flex items-center justify-center border-slate-800/40 ${isEven ? 'lg:order-2 lg:border-l' : 'lg:order-1 lg:border-r'}`}>
                  <div className="w-full max-w-sm lg:max-w-none">
                    {VisualComponent}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
    </section>
  );
}
