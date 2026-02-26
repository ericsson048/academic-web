import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { LayoutDashboard, Users, FileText, BarChart3, LogOut } from 'lucide-react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const { locale, setLocale, t } = useI18n();
  const location = useLocation();

  // Define navigation items with role-based visibility
  const navItems = [
      { 
        icon: LayoutDashboard, 
        label: t('layout.nav.dashboard'), 
        path: '/',
        roles: ['admin', 'teacher'] 
      },
      { 
        icon: Users, 
        label: t('layout.nav.students'), 
        path: '/students',
        roles: ['admin', 'teacher'] 
      },
      { 
        icon: BarChart3, 
        label: t('layout.nav.grades'), 
        path: '/grades',
        roles: ['admin', 'teacher'] 
      },
      { 
        icon: FileText, 
        label: t('layout.nav.reports'), 
        path: '/reports',
        roles: ['admin', 'teacher'] 
      },
  ];

  // Filter navigation items based on user role
  const visibleNavItems = navItems.filter(item => 
    user?.role && item.roles.includes(user.role)
  );

  const handleLogout = async () => {
    await logout();
  };

  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <aside 
      className="w-64 bg-[#1E3A8A] text-slate-300 flex flex-col"
      role="navigation"
      aria-label={t('layout.mainNavigation')}
    >
      {/* Logo/Brand */}
      <div className="p-6 border-b border-[#1E40AF]/30 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center text-white font-bold font-['Fira_Code']">
          A
        </div>
        <span className="font-bold text-white text-lg tracking-tight font-['Fira_Code']">
          APAS
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1" aria-label={t('layout.mainNavigation')}>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg 
                transition-all duration-200 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 focus:ring-offset-[#1E3A8A]
                ${isActive 
                  ? 'bg-[#1E40AF] text-white shadow-lg' 
                  : 'hover:bg-[#1E40AF]/50 hover:text-white'
                }
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="font-medium font-['Fira_Sans']">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info and Logout */}
      <div className="p-4 border-t border-[#1E40AF]/30">
        <label className="mb-3 flex items-center justify-between gap-2 px-3 text-xs text-slate-300 font-['Fira_Sans']">
          <span>{t('layout.language')}</span>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as 'fr' | 'en')}
            className="rounded-md border border-[#1E40AF] bg-[#1E40AF]/40 px-2 py-1 text-xs text-white"
          >
            <option value="fr">{t('layout.lang.fr')}</option>
            <option value="en">{t('layout.lang.en')}</option>
          </select>
        </label>
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <div 
            className="w-8 h-8 rounded-full bg-[#F59E0B] flex items-center justify-center text-xs font-bold text-white font-['Fira_Code']"
            aria-hidden="true"
          >
            {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate font-['Fira_Sans']">
              {user?.first_name && user?.last_name 
                ? `${user.first_name} ${user.last_name}`
                : user?.username || t('layout.user')
              }
            </p>
            <p className="text-xs text-slate-400 truncate capitalize font-['Fira_Sans']">
              {user?.role || 'user'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          onKeyDown={(e) => handleKeyDown(e, handleLogout)}
          className="
            w-full flex items-center gap-2 px-3 py-2 text-sm 
            text-slate-400 hover:text-white hover:bg-[#1E40AF]/50 
            rounded-lg transition-colors duration-200 cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-2 focus:ring-offset-[#1E3A8A]
          "
          aria-label={t('layout.signOut')}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          <span className="font-['Fira_Sans']">{t('layout.signOut')}</span>
        </button>
      </div>
    </aside>
  );
}
