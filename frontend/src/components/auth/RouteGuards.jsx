import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Redirects unauthenticated users to /login.
 * Preserves the intended destination in location state.
 */
export const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
};

/**
 * Restricts access to specified roles.
 * Usage: <RoleRoute roles={['admin', 'doctor']} />
 */
export const RoleRoute = ({ roles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

/**
 * Redirects authenticated users away from login/register.
 */
export const PublicRoute = () => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#030712] text-slate-100">
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-14 h-14 flex items-center justify-center">
        <div className="w-14 h-14 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <div className="absolute w-8 h-8 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-white tracking-wide">RetinaAI Portal</p>
        <p className="text-xs font-mono text-cyan-400/80">Verifying session credentials...</p>
      </div>
    </div>
  </div>
);
