import { useState } from 'react';
import {
  Users, ScanEye, Sparkles, GitBranch, BarChart3, FileText,
  WifiOff, Bot, ChevronRight, CheckCircle2, Eye, ShieldCheck
} from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';

const PLATFORM_MODULES = [
  {
    id: 'registry',
    title: 'Patient Registry',
    icon: Users,
    color: '#06b6d4',
    badge: 'Clinical EHR',
    desc: 'Structured demographic registry tracking age, duration of diabetes, symptoms, village location, and longitudinal DR progression timelines.',
    features: ['Demographic records', 'Disease progression timeline', 'Right & Left eye history', 'Quick-screen routing'],
  },
  {
    id: 'workspace',
    title: 'Screening Workspace',
    icon: ScanEye,
    color: '#3b82f6',
    badge: 'Capture & Test',
    desc: 'Medical imaging workstation with instant drag-and-drop, automated quality scoring, and one-click demo fundus sample loaders for training.',
    features: ['Illumination verification', 'OD/OS eye selection', 'Clinical exam notes', 'Multi-step inference pipeline'],
  },
  {
    id: 'xai',
    title: 'AI Result & Explainability',
    icon: Sparkles,
    color: '#8b5cf6',
    badge: 'Grad-CAM XAI',
    desc: 'Interactive dual-image viewer comparing original fundus photographs with color-mapped Grad-CAM heatmaps to justify AI decisions.',
    features: ['Opacity slider overlay', 'Class probabilities', 'Model uncertainty detection', 'ICDR severity badge'],
  },
  {
    id: 'referrals',
    title: 'Referral Management',
    icon: GitBranch,
    color: '#ef4444',
    badge: 'Specialist Bridge',
    desc: 'Complete triage pipeline from high-risk detection to hospital scheduling, doctor feedback, and confirmed ophthalmic diagnoses.',
    features: ['Urgent & High priority flags', 'Hospital appointment scheduling', 'Doctor diagnosis recording', 'Status workflow tabs'],
  },
  {
    id: 'analytics',
    title: 'Population Analytics',
    icon: BarChart3,
    color: '#f59e0b',
    badge: 'Epidemiology',
    desc: 'Visual indicators of diabetic retinopathy prevalence across rural camps, 7-day screening volumes, and village-wise patient distributions.',
    features: ['DR severity breakdown', 'Screening volume trends', 'Village demographic metrics', 'Referral conversion tracking'],
  },
  {
    id: 'reports',
    title: 'Clinical Reports',
    icon: FileText,
    color: '#10b981',
    badge: 'Print & PDF',
    desc: 'Standardized clinical reports complete with patient history, dual fundus & Grad-CAM images, probability tables, and signature lines.',
    features: ['One-click print/PDF', 'Patient & exam metadata', 'Mandatory medical disclaimers', 'Doctor signature section'],
  },
  {
    id: 'offline',
    title: 'Offline Field Mode',
    icon: WifiOff,
    color: '#06b6d4',
    badge: 'Edge Ready',
    desc: 'IndexedDB client storage queues patient registrations and screenings in remote non-network zones, auto-syncing when connection resumes.',
    features: ['Zero internet operation', 'Local image queueing', 'One-click manual sync', 'Auto cloud reconciliation'],
  },
  {
    id: 'assistant',
    title: 'AI Clinical Assistant',
    icon: Bot,
    color: '#ec4899',
    badge: 'Knowledge Base',
    desc: 'Conversational eye health assistant answering clinical staging questions, glycemic targets, and rural screening guidelines.',
    features: ['Contextual floating widget', 'Dedicated knowledge page', 'Pre-configured clinical prompts', 'Multi-turn dialog'],
  },
];

export default function PlatformPreview() {
  const [activeModuleId, setActiveModuleId] = useState('xai');
  const activeModule = PLATFORM_MODULES.find((m) => m.id === activeModuleId) || PLATFORM_MODULES[0];

  return (
    <section id="platform" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-20">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <span>Comprehensive Suite</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            More Than An ML Model
          </h2>
          <p className="text-base text-slate-300 font-normal">
            A full-stack clinical ecosystem built from the ground up for rural healthcare screening and specialist triage.
          </p>
        </div>

        {/* Module Selector Pills */}
        <div className="flex items-center gap-3 overflow-x-auto pb-3 scrollbar-none justify-start lg:justify-center">
          {PLATFORM_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeModuleId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setActiveModuleId(mod.id)}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-800 text-white border border-cyan-400/60 shadow-[0_0_25px_-5px_rgba(6,182,212,0.35)] scale-105'
                    : 'bg-slate-950/70 text-slate-400 border border-slate-800/90 hover:text-slate-200 hover:bg-slate-900/80'
                }`}
              >
                <Icon
                  className="w-4 h-4"
                  style={{ color: isActive ? mod.color : 'currentColor' }}
                />
                <span>{mod.title}</span>
              </button>
            );
          })}
        </div>

        {/* Active Module Showcase Card */}
        <div className="glass-panel-elevated rounded-3xl p-8 sm:p-12 border border-cyan-500/20 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Description */}
            <div className="lg:col-span-6 space-y-6">
              <div className="space-y-3">
                <span
                  className="text-xs font-mono font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border inline-block"
                  style={{
                    backgroundColor: `${activeModule.color}15`,
                    borderColor: `${activeModule.color}35`,
                    color: activeModule.color,
                  }}
                >
                  {activeModule.badge}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {activeModule.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal pt-1">
                  {activeModule.desc}
                </p>
              </div>

              {/* Key Features Bullet List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                {activeModule.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Mini Interactive Representation */}
            <div className="lg:col-span-6 bg-slate-950/90 rounded-3xl border border-slate-800 p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">
                    RetinaAI System • {activeModule.title}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                  LIVE MODULE
                </span>
              </div>

              {/* Simulated UI Card */}
              <div className="space-y-4 text-xs">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Active Module:</span>
                    <span className="font-bold text-white text-sm">{activeModule.title}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Integration Status:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Production Connected
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-medium">Target Users:</span>
                    <span className="text-slate-300">ASHA Workers, Doctors, Admins</span>
                  </div>
                </div>

                <p className="text-xs text-slate-500 italic text-center pt-2">
                  Integrated with authenticated role-based access control and live backend persistence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
