import { EyeOff, MapPin, HeartPulse, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import GlassCard from '../../../components/ui/GlassCard';

export default function WhySection() {
  const challenges = [
    {
      icon: EyeOff,
      number: '01',
      title: 'Silent Vision Loss',
      desc: 'Diabetic Retinopathy progresses silently in early stages without noticeable pain or blurred vision, causing irreversible retinal damage before diagnosis.',
      badge: 'Silent Threat',
      badgeColor: 'text-amber-400 border-amber-500/20 bg-amber-500/10',
    },
    {
      icon: MapPin,
      number: '02',
      title: 'Rural Specialist Shortage',
      desc: 'Retina specialists in India are heavily concentrated in large cities, leaving primary health centres and rural villages with limited access to screening.',
      badge: 'Geographic Gap',
      badgeColor: 'text-red-400 border-red-500/20 bg-red-500/10',
    },
    {
      icon: HeartPulse,
      number: '03',
      title: 'Delayed Referral Pathways',
      desc: 'Without structured frontline screening tools, high-risk proliferative cases are identified late, when sight-saving interventions are most difficult.',
      badge: 'Triage Bottleneck',
      badgeColor: 'text-purple-400 border-purple-500/20 bg-purple-500/10',
    },
  ];

  return (
    <section id="technology" className="py-32 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 space-y-20">
        {/* Section Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Rural Healthcare Challenge</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Why <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">RetinaAI</span> Exists
          </h2>
          <p className="text-base text-slate-300 leading-relaxed font-normal">
            Empowering frontline Accredited Social Health Activists (ASHA) and Primary Health Centre (PHC) staff
            with explainable AI tools to bridge the diagnostic divide in underserved communities.
          </p>
        </div>

        {/* 3 Spacious Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {challenges.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="glass-panel rounded-3xl p-8 sm:p-10 border border-slate-800/90 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between space-y-8 shadow-xl group"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-lg group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="font-mono text-3xl font-black text-slate-700 group-hover:text-cyan-500/50 transition-colors">
                      {item.number}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border inline-block ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <h3 className="text-xl font-bold text-white tracking-tight pt-1">{item.title}</h3>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed font-normal">{item.desc}</p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center gap-2 text-xs text-slate-400 font-mono">
                  <span className="text-cyan-400 font-bold">{item.number}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700" />
                  <span>Why this matters</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Responsible Healthcare Mission Banner */}
        <div className="glass-panel-elevated rounded-3xl p-8 sm:p-12 border border-cyan-500/20 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                Ethical & Explainable Medical AI
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
                Designed for Rural Reality: Transparent, Offline-Ready, and Safe
              </h3>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal pt-2">
                RetinaAI does not replace doctors. It gives frontline health workers AI-assisted screening support, Grad-CAM visualisation showing where the network's attention fell, and a transparent rule-based triage protocol that flags sight-threatening cases for specialist review. Every result requires clinician confirmation, and the model has not been clinically validated.
              </p>
            </div>

            <div className="lg:col-span-4 grid grid-cols-2 gap-4 text-center">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="text-3xl font-black text-cyan-400 font-mono">Offline</p>
                <p className="text-xs text-slate-400 font-medium">Capture &amp; queue</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="text-3xl font-black text-blue-400 font-mono">Grad-CAM</p>
                <p className="text-xs text-slate-400 font-medium">XAI Heatmaps</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="text-3xl font-black text-purple-400 font-mono">5-Tier</p>
                <p className="text-xs text-slate-400 font-medium">ICDR Triage</p>
              </div>
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <p className="text-3xl font-black text-emerald-400 font-mono">5 Langs</p>
                <p className="text-xs text-slate-400 font-medium">Navigation (in progress)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
