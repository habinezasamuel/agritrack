import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { ConfirmDialog } from '../common/Modal';
import { getPortalTheme, type PortalThemeConfig } from '../../utils/portalThemes';

interface HeaderProps {
  portal?: PortalThemeConfig;
}

export function Header({ portal }: HeaderProps) {
  const { user, logout, hasRole } = useAuth();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const activePortal = portal || getPortalTheme(location.pathname, user?.role);

  const handleLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setShowUserMenu(false);
    navigate('/login', { replace: true });
  };

  const getPageTitle = () => {
    const pageKeys: Record<string, { key: string; fallback: string }> = {
      '/dashboard': { key: 'dashboard', fallback: 'Dashboard' },
      '/farms': { key: 'myFarms', fallback: 'My Farms' },
      '/crop-seasons': { key: 'cropSeasons', fallback: 'Crop Seasons' },
      '/monitoring': { key: 'monitoring', fallback: 'Crop Monitoring' },
      '/tasks': { key: 'tasks', fallback: 'Tasks & Operations' },
      '/input-requests': { key: 'applyForInputs', fallback: 'Input Requests' },
      '/orders': { key: 'paymentHistory', fallback: 'Orders & Payments' },
      '/harvests': { key: 'harvestsSales', fallback: 'Harvests & Sales' },
      '/ai-assistant': { key: 'aiAssistant', fallback: 'AI Farm Assistant' },
      '/admin': { key: 'administration', fallback: 'Admin Overview' },
      '/admin/users': { key: 'users', fallback: 'User Management' },
      '/admin/farms': { key: 'myFarms', fallback: 'Farms & Fields' },
      '/admin/products': { key: 'inputCatalogue', fallback: 'Products Catalogue' },
      '/admin/requests': { key: 'inputApplications', fallback: 'Request Review' },
      '/admin/reports': { key: 'reports', fallback: 'Reports & Analytics' },
      '/livestock/dashboard': { key: 'livestockDashboard', fallback: 'Livestock Dashboard' },
      '/livestock/animals': { key: 'myAnimals', fallback: 'My Animals' },
      '/livestock/register': { key: 'registerAnimal', fallback: 'Register Livestock' },
      '/livestock/disease-reports': { key: 'reportAnimalDisease', fallback: 'Animal Disease Reports' },
      '/livestock/feed-shortages': { key: 'reportFeedShortage', fallback: 'Feed Shortage Reports' },
      '/livestock/records': { key: 'animalHealthRecords', fallback: 'Livestock Health Records' },
      '/livestock/vaccinations': { key: 'vaccinationsReminders', fallback: 'Vaccinations & Reminders' },
      '/livestock/requests': { key: 'assistanceRequests', fallback: 'Livestock Assistance Requests' },
      '/officer': { key: 'officerPortal', fallback: 'Officer Dashboard' },
      '/profile': { key: 'profile', fallback: 'My Profile' },
      '/settings': { key: 'settings', fallback: 'Account Settings' },
    };

    for (const [path, obj] of Object.entries(pageKeys)) {
      if (location.pathname.startsWith(path) && path !== '/dashboard') {
        return t(obj.key, obj.fallback);
      }
    }
    if (location.pathname === '/dashboard') return t('dashboard', 'Dashboard');
    return t('rwandaAgriTrackOnline', 'AgriTrack Platform');
  };

  return (
    <header className={clsx("fixed inset-y-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b transition-all duration-300 lg:left-[var(--sidebar-width)]", activePortal.headerBorderClass)}>
      <div className="flex items-center justify-between h-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('agritrack:toggle-sidebar'))}
            className="rounded-xl border border-[var(--color-border)] bg-white p-2 text-[var(--color-text-muted)] shadow-2xs transition hover:bg-light-green/60 hover:text-primary lg:hidden"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Active Portal Indicator Badge */}
          <div className={clsx("hidden lg:flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border transition-all duration-300", activePortal.badgeClass)}>
            <span className="relative flex h-2 w-2">
              <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", activePortal.dotColor)} />
              <span className={clsx("relative inline-flex rounded-full h-2 w-2", activePortal.dotColor)} />
            </span>
            <span>{activePortal.icon} {t(activePortal.nameKey, activePortal.shortLabel)}</span>
          </div>

          <h1 className="text-base sm:text-xl font-bold text-[var(--color-text)] tracking-tight truncate max-w-[42vw] sm:max-w-none">
            {getPageTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Portal Switcher */}
          {(user?.role === 'ADMIN' || user?.role === 'OFFICER') && (
            <div className="hidden xl:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80 text-xs font-semibold shadow-2xs">
              <Link
                to="/dashboard"
                className={clsx(
                  "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                  activePortal.type === 'farmer' ? "bg-emerald-700 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                )}
                title="Switch to Farmer Portal"
              >
                <span>🌾</span>
                <span>Farmer</span>
              </Link>
              <Link
                to="/officer"
                className={clsx(
                  "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                  activePortal.type === 'officer' ? "bg-teal-700 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                )}
                title="Switch to Agriculture Officer Portal"
              >
                <span>🌱</span>
                <span>Officer</span>
              </Link>
              {user?.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  className={clsx(
                    "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                    activePortal.type === 'admin' ? "bg-indigo-700 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  )}
                  title="Switch to Administrator Portal"
                >
                  <span>🏛️</span>
                  <span>Admin</span>
                </Link>
              )}
              <Link
                to="/livestock/dashboard"
                className={clsx(
                  "px-2.5 py-1 rounded-lg transition-all flex items-center gap-1",
                  activePortal.type === 'livestock' ? "bg-amber-600 text-white shadow-xs font-bold" : "text-slate-600 hover:text-slate-900 hover:bg-white"
                )}
                title="Switch to Livestock Portal"
              >
                <span>🐄</span>
                <span>Livestock</span>
              </Link>
            </div>
          )}

          <LanguageSwitcher />

          <div className="relative">
            <button
              onClick={() => {
                fetchNotifications();
                setShowNotifications(true);
              }}
              className="relative p-2.5 rounded-xl text-[var(--color-text-muted)] hover:text-primary hover:bg-light-green/60 transition-all border border-[var(--color-border)] bg-white shadow-2xs cursor-pointer active:scale-95"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-error text-white text-[0.625rem] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl bg-white border border-[var(--color-border)] shadow-xl shadow-gold/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-subtle)]">
                    <h3 className="text-sm font-bold text-[var(--color-text)]">Notifications</h3>
                    <button
                      onClick={markAllAsRead}
                      className="text-xs font-semibold text-primary hover:text-primary-dark transition-colors"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
                      </div>
                    ) : (
                      <div className="p-2 space-y-1.5">
                        {notifications.slice(0, 20).map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => markAsRead(notification.id)}
                            className={clsx(
                              'w-full text-left px-3.5 py-2.5 rounded-xl border transition-all',
                              !notification.isRead
                                ? 'bg-light-green/40 border-light-green-200 shadow-2xs'
                                : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                            )}
                            aria-pressed={notification.isRead}
                          >
                            <div className="flex items-start gap-3">
                              <div className={clsx(
                                'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                notification.type === 'SUCCESS' || notification.type === 'INFO'
                                  ? 'bg-primary'
                                  : notification.type === 'WARNING'
                                  ? 'bg-gold'
                                  : 'bg-error'
                              )} />
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--color-text)]">{notification.title}</p>
                                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">{notification.message}</p>
                                <p className="text-[0.625rem] text-[var(--color-text-muted)] mt-1">
                                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : ''}
                                </p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-3 border-t border-[var(--color-border-subtle)]">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={markAllAsRead}
                          className="flex-1 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 rounded-lg py-1.5 transition-colors"
                        >
                          Mark all as read
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-xl text-[var(--color-text-muted)] hover:text-primary hover:bg-light-green/60 transition-all border border-[var(--color-border)] bg-white shadow-2xs cursor-pointer active:scale-95"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                <span className="text-xs font-black text-white">
                  {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-semibold text-[var(--color-text)]">
                {user?.firstName} {user?.lastName || user?.username}
              </span>
              <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl bg-white border border-[var(--color-border)] shadow-xl shadow-gold/5 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--color-border-subtle)]">
                    <p className="text-sm font-bold text-[var(--color-text)]">{user?.firstName} {user?.lastName || user?.username}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{user?.email}</p>
                    <Badge variant="primary" size="sm">{user?.role || 'User'}</Badge>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-light-green/60 hover:text-primary transition-colors"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-light-green/60 hover:text-primary transition-colors"
                      role="menuitem"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                    {hasRole('ADMIN') && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--color-text)] hover:bg-light-green/60 hover:text-primary transition-colors"
                        role="menuitem"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Administration
                      </Link>
                    )}
                  </div>
                  <hr className="my-1 border-[var(--color-border-subtle)]" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="m-2 w-[calc(100%-1rem)] flex items-center gap-3 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-red-50 px-4 py-3 text-sm font-extrabold !text-rose-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-rose-100 hover:!text-rose-800 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 cursor-pointer"
                    role="menuitem"
                    aria-label="Logout of AgriTrack"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 !text-white shadow-sm" aria-hidden="true">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </span>
                    <span className="flex flex-col items-start leading-tight">
                      <span>Logout</span>
                      <span className="text-[0.65rem] font-semibold !text-rose-500">Sign out securely</span>
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm logout"
        message="Are you sure you want to logout? Your current session will be ended securely."
        confirmText="Logout"
        cancelText="Stay signed in"
        variant="danger"
      />
    </header>
  );
}
