import { useState } from 'react';
import { Layers, Eye, Sparkles, ZoomIn, ZoomOut, RotateCcw, ImageOff, Info } from 'lucide-react';

/**
 * Retinal image viewer with Grad-CAM attention overlay.
 *
 * The heatmap rendered here is the actual Grad-CAM output returned by the
 * inference service. An earlier version drew a fixed CSS radial-gradient in
 * the same two spots on every image while ignoring the heatmapUrl prop
 * entirely, which made every screening look explained whether or not the
 * model had produced anything.
 *
 * When no heatmap exists, this says so. It does not draw one.
 */
export default function ImageViewer({ originalUrl, heatmapUrl }) {
  const [activeTab, setActiveTab] = useState('overlay');
  const [overlayOpacity, setOverlayOpacity] = useState(0.55);
  const [zoom, setZoom] = useState(1);

  const hasHeatmap = Boolean(heatmapUrl);
  const hasOriginal = Boolean(originalUrl);

  // Fall back to the original image view if explainability is unavailable.
  const effectiveTab = hasHeatmap ? activeTab : 'original';

  const tabs = [
    { id: 'original', label: 'Original', icon: Eye, active: 'bg-cyan-500 text-slate-950' },
    { id: 'heatmap', label: 'Attention map', icon: Sparkles, active: 'bg-purple-600 text-white' },
    { id: 'overlay', label: 'Overlay', icon: Layers, active: 'bg-blue-600 text-white' },
  ];

  if (!hasOriginal) {
    return (
      <div className="glass-panel-elevated rounded-3xl border border-slate-800 flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
        <ImageOff className="w-8 h-8" />
        <p className="text-sm">No retinal image is attached to this screening.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel-elevated rounded-3xl overflow-hidden border border-cyan-500/20 flex flex-col h-full shadow-2xl">
      <div className="bg-slate-950/90 backdrop-blur-md px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-2xl border border-slate-800"
          role="tablist"
          aria-label="Image view mode"
        >
          {tabs.map(({ id, label, icon: Icon, active }) => {
            const disabled = id !== 'original' && !hasHeatmap;
            const selected = effectiveTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                disabled={disabled}
                onClick={() => setActiveTab(id)}
                title={disabled ? 'No attention map available for this screening' : undefined}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  selected
                    ? `${active} shadow-md`
                    : disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-cyan-400 min-w-[40px] text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom(1)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition cursor-pointer"
            aria-label="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative flex-1 min-h-[400px] bg-black flex items-center justify-center overflow-hidden p-6 select-none">
        <div
          className="relative transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full motion-reduce:transition-none"
          style={{ transform: `scale(${zoom})` }}
        >
          <img
            src={originalUrl}
            alt="Retinal fundus photograph"
            className="max-h-[460px] w-auto object-contain rounded-2xl shadow-2xl"
            style={{ opacity: effectiveTab === 'heatmap' ? 0.12 : 1 }}
          />

          {hasHeatmap && effectiveTab !== 'original' && (
            <img
              src={heatmapUrl}
              alt="Grad-CAM attention map showing regions that influenced the prediction"
              className="absolute inset-0 w-full h-full object-contain rounded-2xl pointer-events-none"
              style={{ opacity: effectiveTab === 'heatmap' ? 1 : overlayOpacity }}
            />
          )}
        </div>

        {!hasHeatmap && (
          <div className="absolute bottom-4 left-4 right-4 glass-panel px-3 py-2 rounded-xl text-[11px] text-amber-300 border border-amber-500/30 flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Attention map unavailable for this screening.</span>
          </div>
        )}
      </div>

      {hasHeatmap && (
        <>
          {effectiveTab === 'overlay' && (
            <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center gap-4 text-xs text-slate-400">
              <label htmlFor="overlay-opacity" className="text-slate-300 shrink-0">
                Overlay strength
              </label>
              <input
                id="overlay-opacity"
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={overlayOpacity}
                onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                className="flex-1 accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <span className="text-cyan-400 font-bold font-mono min-w-[42px] text-right">
                {Math.round(overlayOpacity * 100)}%
              </span>
            </div>
          )}

          <p className="bg-slate-950 px-5 py-2.5 border-t border-slate-800 text-[11px] leading-relaxed text-slate-400">
            Warm regions show where the model's attention concentrated when making this
            prediction. This is not a confirmed lesion map and does not identify specific
            abnormalities.
          </p>
        </>
      )}
    </div>
  );
}
