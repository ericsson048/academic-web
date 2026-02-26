import { useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { useNavigate } from 'react-router-dom';
import { api, ValidationError, AuthenticationError, NetworkError } from '../services/apiClient';
import {
  AlertCircle,
  Lock,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';

interface LoginResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    username: string;
    email: string;
    first_name?: string;
    last_name?: string;
    role: 'admin' | 'teacher';
    created_at?: string;
  };
}

export default function Login() {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Client-side validation
  const validateForm = (): boolean => {
    const newErrors: { username?: string; password?: string } = {};
    
    if (!username.trim()) {
      newErrors.username = t('login.validation.usernameRequired');
    }
    
    if (!password) {
      newErrors.password = t('login.validation.passwordRequired');
    } else if (password.length < 4) {
      newErrors.password = t('login.validation.passwordMin');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call login API
      const data = await api.post<LoginResponse>('/auth/login/', {
        username: username.trim(),
        password,
      });
      
      // Store tokens and user data
      login(data.access, data.refresh, data.user);
      
      // Redirect to dashboard
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      
      if (error instanceof ValidationError) {
        // Handle validation errors from backend
        const validationErrors: any = {};
        
        if (error.data.username) {
          validationErrors.username = Array.isArray(error.data.username) 
            ? error.data.username[0] 
            : error.data.username;
        }
        
        if (error.data.password) {
          validationErrors.password = Array.isArray(error.data.password)
            ? error.data.password[0]
            : error.data.password;
        }
        
        if (error.data.non_field_errors) {
          validationErrors.general = Array.isArray(error.data.non_field_errors)
            ? error.data.non_field_errors[0]
            : error.data.non_field_errors;
        }
        
        setErrors(validationErrors);
      } else if (error instanceof AuthenticationError) {
        setErrors({ general: t('login.error.invalidCredentials') });
      } else if (error instanceof NetworkError) {
        setErrors({ general: t('login.error.network') });
      } else {
        setErrors({ general: t('login.error.generic') });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-4 py-8 sm:px-8">
      <div className="login-orb login-orb--one" aria-hidden="true" />
      <div className="login-orb login-orb--two" aria-hidden="true" />
      <div className="login-orb login-orb--three" aria-hidden="true" />

      <div className="relative z-10 grid w-full max-w-6xl items-stretch gap-7 xl:grid-cols-[1fr_0.95fr]">
        <aside className="login-aside-enter hidden rounded-3xl border border-blue-200/50 bg-gradient-to-br from-[#1E3A8A] via-[#1E40AF] to-[#3B82F6] p-10 text-white shadow-[0_28px_70px_-34px_rgba(30,58,138,0.7)] xl:flex xl:flex-col xl:justify-between">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-medium backdrop-blur-sm font-['Fira_Sans']">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t('login.securePortal')}
            </div>
            <div>
              <h1 className="text-4xl leading-[1.1] font-semibold font-['Fira_Code']">
                {t('login.controlCenter')}
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100/95 font-['Fira_Sans']">
                {t('login.description')}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/25 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-100/85 font-['Fira_Code']">
              {t('login.securityNotice')}
            </p>
            <p className="mt-2 text-base leading-relaxed text-blue-50 font-['Fira_Sans']">
              {t('login.securityText')}
            </p>
          </div>
        </aside>

        <section className="login-card-enter p-4 mx-auto w-full max-w-[560px] rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_28px_65px_-38px_rgba(30,64,175,0.55)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-blue-700/80 font-['Fira_Code']">
                {t('login.systemName')}
              </p>
              <h2 className="mt-2 text-3xl leading-tight font-semibold text-slate-900 font-['Fira_Code']">
                {t('login.signIn')}
              </h2>
              <p className="mt-2 text-sm text-slate-600 font-['Fira_Sans']">
                {t('login.continue')}
              </p>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
          </div>

          {errors.general && (
            <div
              className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 font-['Fira_Sans']"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span>{errors.general}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700 font-['Fira_Sans']">
                  {t('login.username')}
                </label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errors.username) {
                      setErrors((prev) => ({ ...prev, username: undefined }));
                    }
                  }}
                  className={`login-field w-full rounded-xl border bg-white py-3 pl-10 pr-16 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 font-['Fira_Sans'] ${
                    errors.username
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-300 focus:border-[#1E40AF] focus:ring-[#1E40AF]/25'
                  }`}
                  placeholder={t('login.usernamePlaceholder')}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.username)}
                  autoComplete="username"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-xs text-red-600 font-['Fira_Sans']">{errors.username}</p>
              )}
            </div>

            <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700 font-['Fira_Sans']">
                  {t('login.password')}
                </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                  className={`login-field w-full rounded-xl border bg-white py-3 pl-10 pr-16 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-0 font-['Fira_Sans'] ${
                    errors.password
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-slate-300 focus:border-[#1E40AF] focus:ring-[#1E40AF]/25'
                  }`}
                  placeholder={t('login.passwordPlaceholder')}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password"
                  autoCorrect="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-600 font-['Fira_Sans']">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#F59E0B] px-4 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(245,158,11,0.9)] transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 font-['Fira_Sans']"
            >
              {isLoading && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent"
                  aria-hidden="true"
                />
              )}
              {isLoading ? t('login.signingIn') : t('login.signIn')}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-500 font-['Fira_Sans']">
            {t('login.restrictedAccess')}
          </p>
        </section>
      </div>
    </div>
  );
}
