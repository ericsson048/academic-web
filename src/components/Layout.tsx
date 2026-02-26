import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';
import { useI18n } from '../context/I18nContext';

export default function Layout() {
  const location = useLocation();
  const { t } = useI18n();

  // Map paths to page titles
  const pageTitles: Record<string, string> = {
    '/': t('layout.nav.dashboard'),
    '/students': t('layout.nav.students'),
    '/grades': t('layout.nav.grades'),
    '/reports': t('layout.nav.reports'),
    '/docs': t('layout.nav.documentation'),
  };

  const currentPageTitle = pageTitles[location.pathname] || t('layout.overview');

  return (
    <div className="flex h-screen bg-[#F8FAFC] min-w-[1024px]">
      {/* Navigation Sidebar */}
      <Navigation />

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto" role="main">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-[#1E3A8A] font-['Fira_Code']">
              {currentPageTitle}
            </h1>
            <div className="flex items-center gap-4">
              <div className="px-3 py-1 bg-[#1E40AF]/10 text-[#1E40AF] rounded-full text-xs font-medium border border-[#1E40AF]/20 font-['Fira_Sans']">
                {t('layout.academicYear')}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 max-w-[1920px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
