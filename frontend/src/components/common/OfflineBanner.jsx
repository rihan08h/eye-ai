import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';

export default function OfflineBanner() {
  const { isOnline, syncStatus, pendingCount, syncPendingRecords } = useOffline();

  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={`px-4 py-2.5 text-xs font-medium flex items-center justify-between border-b transition-all duration-300 ${
        !isOnline
          ? 'bg-amber-950/80 border-amber-500/30 text-amber-200'
          : pendingCount > 0
          ? 'bg-cyan-950/80 border-cyan-500/30 text-cyan-200'
          : 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        {!isOnline ? (
          <>
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span>
              <strong className="font-bold text-amber-300">Offline Mode Active:</strong> Patient
              registrations and captured images are queued locally. AI analysis runs on the server,
              so queued screenings have <strong className="font-bold text-amber-300">not been
              analysed yet</strong> — results appear once connectivity returns.
            </span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 flex items-center justify-center shrink-0">
              <Wifi className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <span>
              <strong className="font-bold text-cyan-300">Connection Restored:</strong> {pendingCount} offline screening record(s) queued for cloud sync.
            </span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={syncPendingRecords}
          disabled={syncStatus === 'Syncing'}
          className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-3 py-1 rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'Syncing' ? 'animate-spin' : ''}`} />
          {syncStatus === 'Syncing' ? 'Syncing...' : 'Sync to Cloud'}
        </button>
      )}
    </div>
  );
}
