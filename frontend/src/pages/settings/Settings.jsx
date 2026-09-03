import { useState } from 'react';
import { Settings as SettingsIcon, Globe, Wifi, Shield, Database, Cpu, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import SectionHeading from '../../components/ui/SectionHeading';
import Button from '../../components/ui/Button';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user } = useAuth();
  const { currentLang, changeLanguage, languages } = useLanguage();
  const { isOnline, syncStatus, pendingCount, syncPendingRecords } = useOffline();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <SectionHeading
        badge="System Configuration"
        icon={SettingsIcon}
        title="Platform Settings"
        subtitle="Configure multilingual interface, offline cache, and account preferences"
      />

      <div className="space-y-6">
        {/* Multilingual Selector */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Globe className="w-4 h-4 text-cyan-400" />
            Language Preference / भाषा / ಭಾಷೆ / భాష / மொழி
          </h2>
          <p className="text-xs text-slate-400">
            Select preferred language for rural healthcare workers and community volunteers
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {languages.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  toast.success(`Language set to ${lang.label}`);
                }}
                className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                  currentLang === lang.code
                    ? 'border-cyan-400 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/30'
                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <p className="font-bold text-sm text-white">{lang.native}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{lang.label}</p>
                {currentLang === lang.code && (
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mx-auto mt-1.5" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Offline Cache & Synchronization */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Wifi className="w-4 h-4 text-emerald-400" />
            Offline Mode & Local Queue Status
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-500 font-mono">Network Connectivity:</span>
              <p className="font-bold text-xs sm:text-sm text-white mt-1 flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                {isOnline ? 'Online (Connected)' : 'Offline (Disconnected)'}
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-500 font-mono">Sync Telemetry Status:</span>
              <p className="font-bold text-xs sm:text-sm text-cyan-400 mt-1">{syncStatus}</p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs text-slate-500 font-mono">Pending Local IndexedDB Queue:</span>
              <p className="font-bold text-xs sm:text-sm text-white mt-1 font-mono">{pendingCount} records</p>
            </div>
          </div>

          {pendingCount > 0 && (
            <Button
              variant="cyan"
              size="sm"
              onClick={syncPendingRecords}
              className="shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              Sync Pending Records Now
            </Button>
          )}
        </div>

        {/* Account & Role */}
        <div className="glass-panel rounded-3xl p-6 sm:p-7 space-y-4 border border-slate-800 shadow-xl">
          <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-purple-400" />
            Clinician Account & Authorization
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-500 font-mono">Authenticated Session:</span>
              <p className="font-bold text-white text-sm mt-0.5">{user?.name}</p>
              <p className="text-slate-400">{user?.email}</p>
            </div>
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
              <span className="text-slate-500 font-mono">Assigned Clinical Role:</span>
              <p className="font-bold text-cyan-400 text-sm mt-0.5 capitalize">{user?.role}</p>
              <p className="text-slate-400">{user?.organization || 'Primary Health Centre'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
