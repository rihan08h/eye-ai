import { useState } from 'react';
import { Layers, Sparkles, ScanEye, GitBranch, ShieldCheck, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';

const PIPELINE_STEPS = [
  {
    id: 1,
    title: 'Fundus Image Ingestion',
    subtitle: 'High-Resolution Retinal Capture',
    desc: 'Frontline worker uploads fundus photograph. Automated quality check validates optical focus and illumination.',
    visualState: 'original',
    tag: 'STAGE 01',
    badge: 'Input',
  },
  {
    id: 2,
    title: 'Deep Feature Extraction',
    subtitle: 'Deep Convolutional Inference',
    desc: 'Neural network grades severity across five ICDR stages, with a Grad-CAM map showing which regions drove the result.',
    visualState: 'scanning',
    tag: 'STAGE 02',
    badge: 'Inference',
  },
  {
    id: 3,
    title: 'Grad-CAM Explainability',
    subtitle: 'Explainable AI Visualization',
    desc: 'Gradient Class Activation Mapping highlights the precise pathological retinal regions governing prediction.',
    visualState: 'heatmap',
    tag: 'STAGE 03',
    badge: 'XAI Heatmap',
  },
  {
    id: 4,
    title: 'Clinical Risk Stratification',
    subtitle: '5-Stage ICDR Classification',
    desc: 'Outputs clear diagnostic classification (No DR to Proliferative DR) paired with model confidence metrics.',
    visualState: 'risk',
    tag: 'STAGE 04',
    badge: 'Triage Grade',
  },
  {
    id: 5,
    title: 'Automated Referral & Follow-up',
    subtitle: 'Connecting Rural to Specialist',
    desc: 'High-risk cases generate electronic referral packets dispatched directly to district ophthalmologists.',
    visualState: 'referral',
    tag: 'STAGE 05',
    badge: 'Specialist Bridge',
  },
];

export default function WhatSection() {
  const [activeStep, setActiveStep] = useState(1);
  const currentStep = PIPELINE_STEPS.find((s) => s.id === activeStep) || PIPELINE_STEPS[0];

  return (
    <section className="py-32 relative overflow-hidden bg-slate-950/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-20">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <ScanEye className="w-3.5 h-3.5" />
            <span>Diagnostic Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            How RetinaAI Works <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">In Real Time</span>
          </h2>
          <p className="text-base text-slate-300 font-normal">
            Step through each stage to observe how raw retinal images transform into transparent, clinician-verified diagnostic referrals.
          </p>
        </div>

        {/* Spacious Interactive Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* LEFT: Dynamic Visual Simulation Container */}
          <div className="lg:col-span-6 relative">
            <div className="glass-panel-elevated rounded-3xl p-6 sm:p-8 border border-cyan-500/20 overflow-hidden shadow-2xl relative min-h-[460px] flex flex-col items-center justify-center">
              {/* Scanline HUD frame */}
              <div className="absolute inset-5 rounded-2xl border border-dashed border-cyan-500/20 pointer-events-none" />

              {/* Fundus Image with dynamic overlays */}
              <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-black shadow-2xl flex items-center justify-center">
                <img
                  src="/samples/13_left.jpeg"
                  alt="Retina Fundus Simulation"
                  className="w-full h-full object-cover rounded-2xl transition-all duration-500"
                  style={{
                    filter: currentStep.visualState === 'heatmap' ? 'brightness(0.7)' : 'brightness(1)',
                  }}
                />

                {/* Scanline Animation Overlay for Step 2 */}
                {currentStep.visualState === 'scanning' && (
                  <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/0 via-cyan-400/40 to-cyan-500/0 h-28 animate-scanline pointer-events-none" />
                )}

                {/* Grad-CAM Heatmap Shader Overlay for Step 3, 4, 5 */}
                {(currentStep.visualState === 'heatmap' || currentStep.visualState === 'risk' || currentStep.visualState === 'referral') && (
                  <div
                    className="absolute inset-0 rounded-2xl pointer-events-none mix-blend-screen transition-opacity duration-500 animate-in fade-in"
                    style={{
                      background:
                        'radial-gradient(circle at 62% 48%, rgba(239, 68, 68, 0.9) 0%, rgba(249, 115, 22, 0.75) 25%, rgba(234, 179, 8, 0.5) 45%, rgba(59, 130, 246, 0.2) 65%, transparent 80%), radial-gradient(circle at 40% 55%, rgba(239, 68, 68, 0.8) 0%, rgba(245, 158, 11, 0.5) 30%, transparent 60%)',
                    }}
                  />
                )}

                {/* Step 4: Triage Badge Pill on Image */}
                {(currentStep.visualState === 'risk' || currentStep.visualState === 'referral') && (
                  <div className="absolute top-5 left-5 right-5 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-red-500/40 shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                    <div>
                      <p className="text-[10px] font-mono uppercase text-slate-400">Classified Result</p>
                      <p className="text-base font-bold text-white">Severe NPDR</p>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                      High Risk (94% Conf)
                    </span>
                  </div>
                )}

                {/* Step 5: Referral Dispatch Animation */}
                {currentStep.visualState === 'referral' && (
                  <div className="absolute bottom-5 left-5 right-5 bg-gradient-to-r from-red-600/95 to-rose-600/95 text-white p-4 rounded-2xl border border-white/20 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-300">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5 text-white animate-pulse" />
                      <div>
                        <p className="text-xs font-bold leading-tight">Referral Dispatched</p>
                        <p className="text-[11px] text-red-100">District Eye Hospital • 7-day priority</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-white/20 px-2.5 py-1 rounded-lg font-bold">
                      ACTIVE
                    </span>
                  </div>
                )}
              </div>

              {/* Status Footer */}
              <div className="w-full flex items-center justify-between mt-5 px-3 text-xs text-slate-400 font-mono">
                <span>MODE: {currentStep.badge.toUpperCase()}</span>
                <span className="text-cyan-400 font-bold">STEP {currentStep.id} OF 5</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Step Selection List with Generous Spacing */}
          <div className="lg:col-span-6 space-y-3.5">
            {PIPELINE_STEPS.map((step) => {
              const isActive = activeStep === step.id;
              return (
                <div
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`p-5 sm:p-6 rounded-3xl border transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'glass-panel border-cyan-400/50 bg-slate-900/95 shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)] scale-102'
                      : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className={`text-xs font-mono font-bold ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                          {step.tag}
                        </span>
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <span className="text-xs font-semibold text-slate-400">{step.subtitle}</span>
                      </div>
                      <h4 className={`text-base sm:text-lg font-bold tracking-tight ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {step.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pt-0.5">
                        {step.desc}
                      </p>
                    </div>

                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-600'
                    }`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
