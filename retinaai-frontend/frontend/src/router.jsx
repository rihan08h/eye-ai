import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute, PublicRoute, RoleRoute } from './components/auth/RouteGuards';
import AppLayout from './layouts/AppLayout';
import RouteFallback from './components/common/RouteFallback';

/**
 * Every route is code-split.
 *
 * Previously all 17 pages were imported eagerly, producing a single 945 kB
 * bundle that a health worker on a rural 3G connection had to download in
 * full before seeing a login form — including the analytics charts, the
 * Three.js landing hero and the camp management screens they may never open.
 *
 * Splitting per route means the login page ships login code. Everything else
 * arrives on navigation, and is prefetched on hover for routes reached from
 * the sidebar so the transition still feels instant.
 */

// Landing is the public entry point and its 3D hero is already lazy inside it.
const LandingPage = lazy(() => import('./pages/landing/LandingPage'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

const PatientList = lazy(() => import('./pages/patients/PatientList'));
const NewPatient = lazy(() => import('./pages/patients/NewPatient'));
const PatientDetail = lazy(() => import('./pages/patients/PatientDetail'));

const ScreeningList = lazy(() => import('./pages/screening/ScreeningList'));
const NewScreening = lazy(() => import('./pages/screening/NewScreening'));
const ScreeningResult = lazy(() => import('./pages/screening/ScreeningResult'));

const ReferralList = lazy(() => import('./pages/referrals/ReferralList'));

const CampList = lazy(() => import('./pages/camps/CampList'));
const NewCamp = lazy(() => import('./pages/camps/NewCamp'));
const CampDetail = lazy(() => import('./pages/camps/CampDetail'));

// Recharts is ~90 kB and only analytics uses it, so it leaves the main bundle.
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const ReportViewer = lazy(() => import('./pages/reports/ReportViewer'));

const AIAssistant = lazy(() => import('./pages/assistant/AIAssistant'));
const Settings = lazy(() => import('./pages/settings/Settings'));

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* ── Public Landing Page ── */}
        <Route path="/" element={<LandingPage />} />

        {/* ── Public Auth Routes ── */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* ── Protected Application Routes ── */}
        <Route element={<PrivateRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Patients */}
            <Route path="/patients" element={<PatientList />} />
            <Route path="/patients/new" element={<NewPatient />} />
            <Route path="/patients/:id" element={<PatientDetail />} />

            {/* Screenings */}
            <Route path="/screenings" element={<ScreeningList />} />
            <Route path="/screenings/new" element={<NewScreening />} />
            <Route path="/screenings/:id" element={<ScreeningResult />} />

            {/* Referrals */}
            <Route path="/referrals" element={<ReferralList />} />

            {/* Screening Camps */}
            <Route path="/camps" element={<CampList />} />
            <Route path="/camps/new" element={<NewCamp />} />
            <Route path="/camps/:id" element={<CampDetail />} />

            {/* Analytics */}
            <Route path="/analytics" element={<Analytics />} />

            {/* Clinical Reports */}
            <Route path="/reports" element={<ScreeningList />} />
            <Route path="/reports/:id" element={<ReportViewer />} />

            {/* Educational AI Assistant */}
            <Route path="/assistant" element={<AIAssistant />} />

            {/* Settings & Language */}
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>

        {/* Fallbacks */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

