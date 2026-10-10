import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { getPortalTheme } from '../../utils/portalThemes';

interface MainLayoutProps {
  children?: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { fetchNotifications } = useNotifications();
  const location = useLocation();

  const portal = getPortalTheme(location.pathname, user?.role);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f8f4]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-glow">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="w-20 h-2 bg-border rounded-full overflow-hidden">
            <div className="w-full h-full bg-primary animate-pulse" />
          </div>
          <p className="text-text-secondary">Loading AgriTrack...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Outlet />;
  }

  return (
    <div className={clsx('min-h-screen transition-colors duration-500', portal.pageBgClass)}>
      <Sidebar />
      <div className="transition-all duration-300 lg:pl-[var(--sidebar-width)]">
        <Header portal={portal} />
        <main
          className={clsx(
            'min-h-screen px-4 pb-8 pt-24 sm:px-6 sm:pt-24 lg:px-8 lg:pt-24 transition-all duration-500',
            portal.gradientClass
          )}
          role="main"
          id="main-content"
          data-main
        >
          <div className="content-wrapper">
            {children || <Outlet />}
          </div>
        </main>
        <Link
          to="/ai-assistant"
          aria-label="Open AI Farm Assistant"
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-4 py-3 text-sm font-extrabold !text-white shadow-lg shadow-fuchsia-900/30 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-fuchsia-900/40 focus:outline-none focus:ring-4 focus:ring-fuchsia-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <span className="hidden sm:inline">AI Assistant</span>
        </Link>
      </div>
    </div>
  );
}