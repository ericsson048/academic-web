import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'teacher';
}

/**
 * ProtectedRoute component that checks authentication and role-based access.
 * 
 * - Redirects to login if not authenticated
 * - Checks user role if requiredRole is specified
 * - Preserves the intended destination for redirect after login
 */
export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    // Save the location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access if required
  if (requiredRole && user?.role !== requiredRole) {
    // User doesn't have required role - show access denied or redirect
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md border border-slate-200 text-center">
          <div className="text-red-500 text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-[#1E3A8A] mb-2 font-['Fira_Code']">
            {t('protected.denied')}
          </h2>
          <p className="text-slate-600 mb-4 font-['Fira_Sans']">
            {t('protected.noPermission')}
          </p>
          <p className="text-sm text-slate-500 font-['Fira_Sans']">
            {t('protected.requiredRole')}: <span className="font-semibold">{requiredRole}</span>
            <br />
            {t('protected.yourRole')}: <span className="font-semibold">{user?.role}</span>
          </p>
          <button
            onClick={() => window.history.back()}
            className="mt-6 px-4 py-2 bg-[#1E40AF] text-white rounded-lg hover:opacity-90 transition-all duration-200 cursor-pointer font-['Fira_Sans']"
          >
            {t('protected.goBack')}
          </button>
        </div>
      </div>
    );
  }

  // Authenticated and authorized - render children
  return <>{children}</>;
}
