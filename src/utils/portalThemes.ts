export type PortalType = 'farmer' | 'officer' | 'admin' | 'livestock';

export interface PortalThemeConfig {
  type: PortalType;
  name: string;
  nameKey: string;
  shortLabel: string;
  icon: string;
  bgCanvas: string;
  pageBgClass: string;
  gradientClass: string;
  headerBorderClass: string;
  badgeClass: string;
  dotColor: string;
  bannerGradient: string;
  bannerBorder: string;
  accentPill: string;
}

export const PORTAL_THEMES: Record<PortalType, PortalThemeConfig> = {
  farmer: {
    type: 'farmer',
    name: 'Farmer Operations Portal',
    nameKey: 'farmerPortal',
    shortLabel: 'Farmer Portal',
    icon: '🌾',
    bgCanvas: '#f4f8f4',
    pageBgClass: 'bg-[#f4f8f4]',
    gradientClass: 'bg-[radial-gradient(circle_at_top_right,rgba(167,243,208,0.40),transparent_38rem),radial-gradient(circle_at_bottom_left,rgba(236,253,245,0.55),transparent_30rem)]',
    headerBorderClass: 'border-emerald-200/90 shadow-[0_4px_20px_rgba(20,83,45,0.05)]',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300/80 shadow-xs',
    dotColor: 'bg-emerald-600',
    bannerGradient: 'from-[#0d3f25] via-[#14532d] to-[#1e4620]',
    bannerBorder: 'border-emerald-700/40',
    accentPill: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  },
  officer: {
    type: 'officer',
    name: 'Agriculture Officer Portal',
    nameKey: 'officerPortal',
    shortLabel: 'Agri-Officer Portal',
    icon: '🌱',
    bgCanvas: '#edf6f6',
    pageBgClass: 'bg-[#edf6f6]',
    gradientClass: 'bg-[radial-gradient(circle_at_top_right,rgba(153,246,228,0.45),transparent_38rem),radial-gradient(circle_at_bottom_left,rgba(204,251,241,0.50),transparent_30rem)]',
    headerBorderClass: 'border-teal-200/90 shadow-[0_4px_20px_rgba(13,92,86,0.06)]',
    badgeClass: 'bg-teal-50 text-teal-900 border-teal-300/80 shadow-xs',
    dotColor: 'bg-teal-600',
    bannerGradient: 'from-[#042f2e] via-[#0d5c56] to-[#0f766e]',
    bannerBorder: 'border-teal-600/40',
    accentPill: 'bg-teal-400/20 text-teal-200 border-teal-400/30',
  },
  admin: {
    type: 'admin',
    name: 'Administrator Portal',
    nameKey: 'adminPortal',
    shortLabel: 'Admin Portal',
    icon: '🏛️',
    bgCanvas: '#f1f3f9',
    pageBgClass: 'bg-[#f1f3f9]',
    gradientClass: 'bg-[radial-gradient(circle_at_top_right,rgba(199,210,254,0.42),transparent_38rem),radial-gradient(circle_at_bottom_left,rgba(224,231,255,0.45),transparent_30rem)]',
    headerBorderClass: 'border-indigo-200/90 shadow-[0_4px_20px_rgba(49,46,129,0.06)]',
    badgeClass: 'bg-indigo-50 text-indigo-950 border-indigo-300/80 shadow-xs',
    dotColor: 'bg-indigo-600',
    bannerGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    bannerBorder: 'border-indigo-700/40',
    accentPill: 'bg-indigo-400/20 text-indigo-200 border-indigo-400/30',
  },
  livestock: {
    type: 'livestock',
    name: 'Livestock & Veterinary Portal',
    nameKey: 'livestockManagement',
    shortLabel: 'Livestock Portal',
    icon: '🐄',
    bgCanvas: '#f7faf4',
    pageBgClass: 'bg-[#f7faf4]',
    gradientClass: 'bg-[radial-gradient(circle_at_top_right,rgba(254,240,138,0.30),transparent_38rem),radial-gradient(circle_at_bottom_left,rgba(209,250,229,0.45),transparent_30rem)]',
    headerBorderClass: 'border-amber-200/90 shadow-[0_4px_20px_rgba(180,83,9,0.05)]',
    badgeClass: 'bg-amber-50 text-amber-950 border-amber-300/80 shadow-xs',
    dotColor: 'bg-amber-600',
    bannerGradient: 'from-emerald-950 via-teal-900 to-slate-900',
    bannerBorder: 'border-emerald-800/40',
    accentPill: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
  },
};

export function getPortalTheme(pathname: string, userRole?: string): PortalThemeConfig {
  if (pathname.startsWith('/admin')) {
    return PORTAL_THEMES.admin;
  }
  if (pathname.startsWith('/officer')) {
    return PORTAL_THEMES.officer;
  }
  if (pathname.startsWith('/livestock')) {
    return PORTAL_THEMES.livestock;
  }
  // If at root dashboard and user is officer or admin
  if (pathname === '/dashboard') {
    if (userRole === 'OFFICER') return PORTAL_THEMES.officer;
    if (userRole === 'ADMIN') return PORTAL_THEMES.admin;
  }
  return PORTAL_THEMES.farmer;
}
