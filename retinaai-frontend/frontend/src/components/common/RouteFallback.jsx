/**
 * Fallback shown while a lazily-loaded route chunk downloads.
 *
 * A content skeleton rather than a spinner: it reserves the space the page
 * will occupy, so arriving content doesn't shift the layout underneath a
 * finger that's already reaching for a button. On a slow rural connection
 * that shift is the difference between tapping "Start screening" and tapping
 * whatever slid into its place.
 *
 * `aria-busy` and the live region tell a screen reader that content is
 * loading rather than leaving it to announce an empty page.
 */
export default function RouteFallback() {
  return (
    <div className="p-6 sm:p-8 space-y-6 animate-pulse" aria-busy="true">
      <span className="sr-only" role="status" aria-live="polite">
        Loading page
      </span>

      <div className="space-y-2.5">
        <div className="h-7 w-56 rounded-xl bg-slate-800/70" />
        <div className="h-3.5 w-80 max-w-full rounded-lg bg-slate-800/50" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-900/80 border border-slate-800/80" />
        ))}
      </div>

      <div className="h-64 rounded-3xl bg-slate-900/60 border border-slate-800/80" />
    </div>
  );
}
