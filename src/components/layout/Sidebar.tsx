import { useState, useEffect } from 'react';
import { Link, useLocation, NavLink } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface NavItem {
  key: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: ('ADMIN' | 'FARMER' | 'OFFICER' | 'VETERINARY_OFFICER')[];
  children?: NavItem[];
}

interface NavGroup {
  groupKey: string;
  label: string;
  items: NavItem[];
}

const navigationGroups: NavGroup[] = [
  {
    groupKey: 'overview',
    label: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/dashboard',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        ),
      },
    ],
  },
  {
    groupKey: 'portals',
    label: 'Portals',
    items: [
      {
        key: 'farmerPortal',
        label: 'Farmer Portal',
        path: '/dashboard',
        icon: <span className="text-base">🌾</span>,
        roles: ['FARMER', 'ADMIN', 'OFFICER'],
      },
      {
        key: 'officerPortal',
        label: 'Officer Portal',
        path: '/officer',
        icon: <span className="text-base">🌱</span>,
        roles: ['OFFICER', 'ADMIN'],
      },
      {
        key: 'adminPortal',
        label: 'Admin Portal',
        path: '/admin',
        icon: <span className="text-base">🏛️</span>,
        roles: ['ADMIN'],
      },
    ],
  },
  {
    groupKey: 'farmManagement',
    label: 'Farm Management',
    items: [
      {
        key: 'myFarms',
        label: 'My Farms',
        path: '/farms',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'bananaFarming',
        label: '🍌 Banana Farming',
        path: '/banana-farming',
        icon: <span className="text-lg">🍌</span>,
        badge: 'New',
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'cropSeasons',
        label: 'Crop Seasons',
        path: '/crop-seasons',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'monitoring',
        label: 'Monitoring',
        path: '/monitoring',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'tasks',
        label: 'Tasks',
        path: '/tasks',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
    ],
  },
  {
    groupKey: 'livestockManagement',
    label: 'Livestock Management',
    items: [
      {
        key: 'livestockDashboard',
        label: 'Livestock Dashboard',
        path: '/livestock/dashboard',
        icon: <span className="text-lg">🐄</span>,
        roles: ['FARMER', 'OFFICER', 'VETERINARY_OFFICER', 'ADMIN'],
      },
      {
        key: 'myAnimals',
        label: 'My Animals',
        path: '/livestock/animals',
        icon: <span className="text-lg">🐐</span>,
        roles: ['FARMER', 'OFFICER', 'VETERINARY_OFFICER', 'ADMIN'],
      },
      {
        key: 'registerAnimal',
        label: 'Register Animal',
        path: '/livestock/register',
        icon: <span className="text-lg">➕</span>,
        roles: ['FARMER', 'ADMIN'],
      },
      {
        key: 'reportAnimalDisease',
        label: 'Report Animal Disease',
        path: '/livestock/disease-reports',
        icon: <span className="text-lg">🩺</span>,
        roles: ['FARMER', 'OFFICER', 'VETERINARY_OFFICER', 'ADMIN'],
      },
      {
        key: 'reportFeedShortage',
        label: 'Report Feed Shortage',
        path: '/livestock/feed-shortages',
        icon: <span className="text-lg">🌾</span>,
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'animalHealthRecords',
        label: 'Health & Production Records',
        path: '/livestock/records',
        icon: <span className="text-lg">📋</span>,
        roles: ['FARMER', 'OFFICER', 'VETERINARY_OFFICER', 'ADMIN'],
      },
      {
        key: 'vaccinationsReminders',
        label: 'Vaccinations & Reminders',
        path: '/livestock/vaccinations',
        icon: <span className="text-lg">💉</span>,
        roles: ['FARMER', 'OFFICER', 'VETERINARY_OFFICER', 'ADMIN'],
      },
      {
        key: 'assistanceRequests',
        label: 'Reports & Assistance Requests',
        path: '/livestock/requests',
        icon: <span className="text-lg">📢</span>,
        roles: ['FARMER', 'OFFICER', 'VETERINARY_OFFICER', 'ADMIN'],
      },
    ],
  },
  {
    groupKey: 'agriculturalInputs',
    label: 'Agricultural Inputs',
    items: [
      {
        key: 'applyForInputs',
        label: 'Apply for Inputs',
        path: '/input-requests',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'myApplications',
        label: 'My Applications',
        path: '/input-requests',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5h6m-8 4h10m-8 4h8m-8 4h5M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
          </svg>
        ),
        roles: ['FARMER'],
      },
      {
        key: 'paymentHistory',
        label: 'Payment History',
        path: '/orders',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
      {
        key: 'harvestsSales',
        label: 'Harvests & Sales',
        path: '/harvests',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        roles: ['FARMER', 'ADMIN'],
      },
      {
        key: 'aiAssistant',
        label: 'AI Assistant',
        path: '/ai-assistant',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM12 2.25v2.25M4.5 12H2.25" />
          </svg>
        ),
        roles: ['FARMER', 'OFFICER', 'ADMIN'],
      },
    ],
  },
  {
    groupKey: 'administration',
    label: 'Administration',
    items: [
      {
        key: 'users',
        label: 'Users',
        path: '/admin/users',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        roles: ['ADMIN'],
      },
      {
        key: 'inputApplications',
        label: 'Input Applications',
        path: '/admin/requests',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.197a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.665 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.665m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.25 2.25v2.25m-4.5 0h3m-3 0h3m-6 3h6a2.25 2.25 0 002.25-2.25V9a2.25 2.25 0 00-2.25-2.25H7.5a2.25 2.25 0 00-2.25 2.25v2.25c0 .687.556 1.238 1.275 1.329m-5.7 0h.008v.008h-.008v-.008Z" />
          </svg>
        ),
        roles: ['ADMIN'],
      },
      {
        key: 'inputCatalogue',
        label: 'Input Catalogue',
        path: '/admin/products',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        ),
        roles: ['ADMIN'],
      },
      {
        key: 'reports',
        label: 'Reports',
        path: '/admin/reports',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        ),
        roles: ['ADMIN'],
      },
      {
        key: 'attendanceReview',
        label: 'Officer Attendance Review',
        path: '/admin/attendance-review',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        ),
        badge: 'Audit',
        roles: ['ADMIN'],
      },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const location = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const path = location.pathname;
    for (const group of navigationGroups) {
      for (const item of group.items) {
        if (path.startsWith(item.path)) {
          setActiveGroup(group.label);
          return;
        }
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const toggleSidebar = () => setMobileOpen((prev) => !prev);
    window.addEventListener('agritrack:toggle-sidebar', toggleSidebar);
    return () => window.removeEventListener('agritrack:toggle-sidebar', toggleSidebar);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  return (
    <aside
      className={clsx(
        'fixed top-0 left-0 z-40 h-screen w-[var(--sidebar-width)] bg-gradient-to-b from-[#123f2b] via-dark-forest to-[#0d3324] text-white transition-all duration-300',
        'border-r border-white/10',
        'shadow-2xs',
        collapsed ? 'w-[var(--sidebar-width-collapsed)]' : 'w-[var(--sidebar-width)]',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      aria-label="Sidebar"
    >
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-dark to-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3C8 3 8 9 8 9c-2 2-4 5-4 8a8 8 0 1016 0c0-3-2-6-4-8 0 0 0-6-4-6z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h8" />
            </svg>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-base font-black tracking-tight block">AgriTrack</span>
              <span className="text-[0.625rem] font-bold tracking-widest text-white/60 uppercase mt-0.5">Rice Farming</span>
            </div>
          )}
        </div>
        <button
          onClick={toggleCollapse}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      <nav className="px-3 sm:px-5 mt-4 overflow-y-auto h-[calc(100vh-9rem)] pb-6">
        {navigationGroups.map((group) => {
          const groupTitle = t(group.groupKey, group.label);
          const isActive = activeGroup === group.label || activeGroup === groupTitle;
          return (
            <div key={group.groupKey}>
              {!collapsed && (
                <div className="px-3 mb-1">
                  <div className={clsx(
                    'text-[0.625rem] font-bold tracking-widest uppercase',
                    group.groupKey === 'agriculturalInputs' ? 'text-[#f6c453]' : 'text-[#c7ded3]'
                  )}>{groupTitle}</div>
                </div>
              )}

              <ul className="space-y-1">
                {group.items
                  .filter((item) => !item.roles || (user && item.roles.includes(user.role)))
                  .map((item) => {
                    const itemTitle = t(item.key, item.label);
                    const isActiveItem = location.pathname.startsWith(item.path);
                    const isAssistant = item.key === 'aiAssistant';
                    const hasChildren = item.children && item.children.length > 0;

                    if (collapsed) {
                      return (
                        <li key={item.path}>
                          <Link
                            to={item.path}
                            className={clsx(
                              'flex items-center justify-center p-2 rounded-xl transition-all duration-200',
                              isActiveItem
                                ? 'bg-[#2f8f6b] !text-white shadow-sm'
                                : '!text-[#d8eee4] hover:!text-white hover:bg-white/10'
                            )}
                            title={itemTitle}
                            aria-label={itemTitle}
                            aria-current={isActiveItem ? 'page' : undefined}
                          >
                            <span className="relative">
                              <span className={clsx(
                                'block w-5 h-5 rounded-lg flex items-center justify-center',
                                isActiveItem
                                  ? 'bg-white/25'
                                  : 'bg-white/10'
                              )}>
                                {item.icon}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    }

                    if (hasChildren) {
                      return (
                        <li key={item.path}>
                          <button
                            onClick={() => setActiveGroup(isActive ? null : group.label)}
                            className={clsx(
                              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200',
                              isActive
                                ? 'bg-[#24694f] !text-white border border-[#61b997]/50'
                                : '!text-[#d8eee4] hover:bg-white/10 hover:!text-white'
                            )}
                            aria-expanded={isActive}
                            aria-controls={`${item.path}-submenu`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className={clsx(
                                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                                isActive ? 'bg-white/15' : 'bg-white/5'
                              )}>
                                {item.icon}
                              </span>
                              <span className="truncate font-medium text-sm">{itemTitle}</span>
                            </div>
                            <svg
                              className={clsx('w-4 h-4 transition-transform duration-200', isActive && 'rotate-180')}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          <ul
                            id={`${item.path}-submenu`}
                            role="menu"
                            className={clsx(
                              'mt-1 ml-5 pl-2 border-l-2 border-white/10 space-y-1 overflow-hidden transition-all duration-200',
                              isActive ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                            )}
                          >
                            {item.children?.map((child) => (
                              <li key={child.path} role="none">
                                <NavLink
                                  to={child.path}
                                  className={({ isActive: childActive }) =>
                                    clsx(
                                      'block px-3 py-2 rounded-lg text-xs transition-colors',
                                      childActive
                                        ? 'bg-[#24694f] !text-white font-semibold'
                                        : '!text-[#c7ded3] hover:bg-white/10 hover:!text-white'
                                    )
                                  }
                                  role="menuitem"
                                >
                                  {t(child.key, child.label)}
                                </NavLink>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    }

                    return (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          className={({ isActive: linkActive }) =>
                            clsx(
                              'flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium',
                              isAssistant && linkActive
                                ? 'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500 !text-white border border-white/40 shadow-lg shadow-fuchsia-950/30'
                                : isAssistant
                                ? 'bg-gradient-to-r from-violet-500/20 via-fuchsia-500/15 to-cyan-400/20 !text-[#f5eaff] border border-fuchsia-300/30 hover:from-violet-500/35 hover:via-fuchsia-500/30 hover:to-cyan-400/30 hover:!text-white'
                                : linkActive
                                ? 'bg-[#24694f] !text-white border border-[#61b997]/50'
                                : '!text-[#d8eee4] hover:bg-white/10 hover:!text-white'
                            )
                          }
                          aria-current={isActiveItem ? 'page' : undefined}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={clsx(
                              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                              isAssistant
                                ? 'bg-gradient-to-br from-violet-400 to-cyan-400 !text-white shadow-md shadow-fuchsia-950/30'
                                : isActiveItem ? 'bg-[#3b9c77]' : 'bg-white/10'
                            )}>
                              {item.icon}
                            </span>
                            <span className={clsx('truncate', isAssistant && 'font-extrabold tracking-wide')}>{itemTitle}</span>
                          </div>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[0.625rem] font-extrabold bg-gradient-to-r from-white/30 to-transparent text-white/70">
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className={clsx('absolute bottom-0 left-0 right-0 p-4', collapsed ? 'pb-6' : 'pt-4')}>
        <div className={clsx(
          'rounded-xl p-3 text-xs transition-all duration-200',
          collapsed ? 'flex items-center justify-center' : 'flex items-center gap-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-black text-white">
              {user?.firstName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f8fafc] truncate">{user?.firstName} {user?.lastName || user?.username}</p>
              <p className="text-[0.625rem] text-[#b9d5c8] font-medium uppercase tracking-wider">{user?.role || 'User'}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
