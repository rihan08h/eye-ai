/**
 * Route chunk prefetching.
 *
 * Code splitting trades bundle size for a network round-trip on first
 * navigation. Prefetching on hover or focus recovers that: by the time a
 * click lands, the chunk is usually already cached, so the split costs
 * nothing perceptually.
 *
 * Each importer is called at most once — the dynamic import cache handles
 * repeats, but tracking here avoids even constructing the promise again.
 */
const prefetched = new Set();

const IMPORTERS = {
  '/dashboard': () => import('../pages/dashboard/Dashboard'),
  '/patients': () => import('../pages/patients/PatientList'),
  '/patients/new': () => import('../pages/patients/NewPatient'),
  '/screenings': () => import('../pages/screening/ScreeningList'),
  '/screenings/new': () => import('../pages/screening/NewScreening'),
  '/referrals': () => import('../pages/referrals/ReferralList'),
  '/camps': () => import('../pages/camps/CampList'),
  '/analytics': () => import('../pages/analytics/Analytics'),
  '/reports': () => import('../pages/screening/ScreeningList'),
  '/assistant': () => import('../pages/assistant/AIAssistant'),
  '/settings': () => import('../pages/settings/Settings'),
};

/**
 * Warm the chunk for a route. Safe to call repeatedly and on every hover.
 * Failures are swallowed: a prefetch that doesn't land just means the chunk
 * loads on navigation instead, which is the un-prefetched behaviour anyway.
 */
export function prefetchRoute(path) {
  if (prefetched.has(path)) return;

  const importer = IMPORTERS[path];
  if (!importer) return;

  prefetched.add(path);
  importer().catch(() => prefetched.delete(path));
}

/**
 * Props to spread onto a link. Covers pointer, keyboard and touch:
 * touchstart fires before the click, which buys ~100ms on mobile.
 */
export function prefetchProps(path) {
  const warm = () => prefetchRoute(path);
  return { onMouseEnter: warm, onFocus: warm, onTouchStart: warm };
}
