import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type Language = 'en' | 'rw';

export const translations: Record<Language, Record<string, string>> = {
  en: {
    language: 'Language',
    english: 'English',
    kinyarwanda: 'Kinyarwanda',
    selectLanguage: 'Select Language',
    login: 'Login',
    register: 'Create an account',
    logout: 'Logout',
    confirmLogout: 'Confirm logout',
    logoutMessage: 'Are you sure you want to logout? Your current session will be ended securely.',
    staySignedIn: 'Stay signed in',
    profile: 'My Profile',
    settings: 'Account Settings',
    administration: 'Administration',
    dashboard: 'Dashboard',
    farmerPortal: 'Farmer Portal',
    officerPortal: 'Agriculture Officer Portal',
    adminPortal: 'Administrator Portal',
    adminAccess: 'Admin access',
    welcomeBack: 'Welcome back',
    signInDescription: 'Sign in to your AgriTrack Rwanda account',
    username: 'Username',
    password: 'Password',
    signIn: 'Sign In',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    noAccount: "Don't have an account?",
    createAccount: 'Create an account',
    newMembership: 'New Membership',
    createAgriTrackAccount: 'Create AgriTrack Account',
    joinNetwork: 'Join the next-generation smart agriculture network',
    completeRegistration: 'Complete Registration',
    alreadyAccount: 'Already have an active account?',
    portalLoginRequired: 'Login or create an account to access your portal dashboard.',
    demoAccounts: 'Demo Accounts (Quick Select)',
    clickToFill: 'Click to fill',

    // Livestock Management
    livestockManagement: 'Livestock Management',
    livestockDashboard: 'Livestock Dashboard',
    myAnimals: 'My Animals',
    registerAnimal: 'Register Animal',
    reportAnimalDisease: 'Report Animal Disease',
    reportFeedShortage: 'Report Feed Shortage',
    animalHealthRecords: 'Animal Health & Feeding',
    vaccinationsReminders: 'Vaccinations & Reminders',
    assistanceRequests: 'Reports & Assistance Requests',
    veterinaryWarning: 'Important: Serious animal illnesses require prompt assistance from a qualified veterinary professional. AI recommendations do not replace professional diagnosis or treatment.',

    // Navigation & Sections
    overview: 'Overview',
    portals: 'Portals',
    farmManagement: 'Farm Management',
    myFarms: 'My Farms',
    bananaFarming: 'Banana Farming',
    cropSeasons: 'Crop Seasons',
    monitoring: 'Crop Monitoring',
    tasks: 'Tasks & Operations',
    agriculturalInputs: 'Agricultural Inputs',
    applyForInputs: 'Apply for Inputs',
    myApplications: 'My Applications',
    paymentHistory: 'Payment History',
    harvestsSales: 'Harvests & Sales',
    aiAssistant: 'AI Farm Assistant',
    users: 'User Management',
    inputApplications: 'Input Applications',
    inputCatalogue: 'Products Catalogue',
    reports: 'Reports & Analytics',

    // Common UI
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications yet.',
    close: 'Close',
    search: 'Search...',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    delete: 'Delete',
    edit: 'Edit',
    back: 'Back',
    next: 'Next',
    status: 'Status',
    actions: 'Actions',
    rwandaAgriTrackOnline: 'Rwanda AgriTrack Online',
    riceFarming: 'Rice Farming',
    
    // Landing Page
    heroTitle: 'Grow smarter. Harvest better.',
    heroSubtitle: 'A powerful crop management platform that helps farmers monitor crops, manage farms, access inputs, track harvests and make better farming decisions.',
    startFarmingSmarter: 'Start Farming Smarter',
    exploreAgriTrack: 'Explore AgriTrack',
    features: 'Features',
    howItWorks: 'How It Works',
    solutions: 'Solutions',
    about: 'About',
    getStarted: 'Get Started',
    openDashboard: 'Open My Dashboard',
    growSmarterHeadline: 'Grow Smarter with AgriTrack',
    heroDescriptionMain: 'Manage your crops, monitor livestock, track farming activities, and receive helpful agricultural guidance in one place.',
    exploreFeatures: 'Explore Features',
    learnMore: 'Learn More',
  },
  rw: {
    language: 'Ururimi',
    english: 'Icyongereza',
    kinyarwanda: 'Kinyarwanda',
    selectLanguage: 'Hitamo Ururimi',
    login: 'Kwinjira',
    register: 'Gufungura konti',
    logout: 'Gusohoka',
    confirmLogout: 'Emeza gusohoka',
    logoutMessage: 'Wizera ko ushaka gusohoka? Umwanya wawe urafungwa mu mutekano.',
    staySignedIn: 'Guma muri konti',
    profile: 'Umwirondoro Wanjye',
    settings: 'Ibyingenzi bya Konti',
    administration: 'Ubuyobozi',
    dashboard: 'Dashboard (Mbonezabukorwa)',
    farmerPortal: 'Urubuga rw’Umuhinzi',
    officerPortal: 'Urubuga rw’Umukozi w’Ubuhinzi',
    adminPortal: 'Urubuga rw’Ubuyobozi',
    adminAccess: 'Kwinjira nk’Umuyobozi',
    welcomeBack: 'Murakaza neza',
    signInDescription: 'Injira muri konti yawe ya AgriTrack Rwanda',
    username: 'Izina ukoresha',
    password: 'Ijambo ry’ibanga',
    signIn: 'Kwinjira',
    rememberMe: 'Nyibuke',
    forgotPassword: 'Wibagiwe ijambo ry’ibanga?',
    noAccount: 'Ntabwo ufite konti?',
    createAccount: 'Fungura konti',
    newMembership: 'Gufungura konti nshya',
    createAgriTrackAccount: 'Fungura konti ya AgriTrack',
    joinNetwork: 'Injira mu ikoranabuhanga rigezweho ry’ubuhinzi mu Rwanda',
    completeRegistration: 'Soza gufungura konti',
    alreadyAccount: 'Usanzwe ufite konti ikora?',
    portalLoginRequired: 'Injira cyangwa ufungure konti kugira ngo ugere kuri dashboard yawe.',
    demoAccounts: 'Konti z’Igerageza (Hitamo vuba)',
    clickToFill: 'Kanda uzuzuza',

    // Livestock Management
    livestockManagement: 'Ubuyobozi bw’Amatungo',
    livestockDashboard: 'Dashboard y’Amatungo',
    myAnimals: 'Amatungo Yanjye',
    registerAnimal: 'Kwandika Itungo',
    reportAnimalDisease: 'Gutanga Raporo y’Indwara',
    reportFeedShortage: 'Gutanga Raporo y’Icubho/Ubwatsi',
    animalHealthRecords: 'Inyandiko z’Ubuzima n’Ibyo Kurya',
    vaccinationsReminders: 'Inkingo n’Ibibukirwa',
    assistanceRequests: 'Raporo Zanjye & Ubufasha',
    veterinaryWarning: 'Zirikana: Indwara zikomeye z’amatungo zisaba ubufasha bwihuse bw’umuganga w’amatungo wizeye. Inama z’ikoranabuhanga ntitagira icyo zisimbura ku bijyanye no gupima no kuvura.',

    // Navigation & Sections
    overview: 'Inshamake',
    portals: 'Imbuga',
    farmManagement: 'Ubuyobozi bw’Imirima',
    myFarms: 'Imirima Yanjye',
    bananaFarming: 'Ubuhinzi bw’Ibitoki',
    cropSeasons: 'Ibihe by’Ihinga',
    monitoring: 'Gukurikirana Imyaka',
    tasks: 'Ibikorwa n’Imirimo',
    agriculturalInputs: 'Inyongeramusaruro',
    applyForInputs: 'Saba Inyongeramusaruro',
    myApplications: 'Gusaba Kwanjye',
    paymentHistory: 'Amateka yo Kwishyura',
    harvestsSales: 'Sarura n’Igurisha',
    aiAssistant: 'Umujyanama wa AI',
    users: 'Ubuyobozi bw’Abakoresha',
    inputApplications: 'Gusaba Inyongeramusaruro',
    inputCatalogue: 'Iduka ry’Inyongeramusaruro',
    reports: 'Raporo n’Ibibyino',

    // Common UI
    notifications: 'Amatangazo',
    markAllRead: 'Soma byose',
    noNotifications: 'Nta matangazo arahari.',
    close: 'Funga',
    search: 'Shakisha...',
    save: 'Bika',
    cancel: 'Hagarika',
    submit: 'Ohereza',
    delete: 'Siba',
    edit: 'Hindura',
    back: 'Subira Inyuma',
    next: 'Ibikirikira',
    status: 'Imiterere',
    actions: 'Ibikorwa',
    rwandaAgriTrackOnline: 'AgriTrack Rwanda mu Ikoranabuhanga',
    riceFarming: 'Ubuhinzi bw’Umuceri',

    // Landing Page
    heroTitle: 'Hinga mu bwenge. Sarura neza.',
    heroSubtitle: 'Ikoranabuhanga rigezweho rifasha abahinzi bo mu Rwanda gukurikirana imyaka, gucunga imirima, kubona inyongeramusaruro no gusasaza umusaruro wabo.',
    startFarmingSmarter: 'Tangiye Ubuhinzi Bungezweho',
    exploreAgriTrack: 'Shakisha AgriTrack',
    features: 'Ibiyirimo',
    howItWorks: 'Uko Bikora',
    solutions: 'Ibibikemura',
    about: 'Ibyerekeye',
    getStarted: 'Tangira Ubu',
    openDashboard: 'Fungura Dashboard Yanjye',
    growSmarterHeadline: 'Hinga Kandi Worore Kijyambere na AgriTrack',
    heroDescriptionMain: 'Genzura ibihingwa, kurikirana amatungo, ibikorwa by’ubuhinzi, no kubona inama z’inzobere ahantu hamwe.',
    exploreFeatures: 'Reba Ibiranga',
    learnMore: 'Menya Byinshi',
  },
};

export type KnownTranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = window.localStorage.getItem('agritrack-language');
    return saved === 'rw' ? 'rw' : 'en';
  });

  const changeLanguage = (nextLanguage: Language) => {
    setLanguage(nextLanguage);
    window.localStorage.setItem('agritrack-language', nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage: changeLanguage,
    toggleLanguage: () => changeLanguage(language === 'en' ? 'rw' : 'en'),
    t: (key: string, fallback?: string) => {
      const translated = translations[language]?.[key];
      if (translated) return translated;
      if (fallback) return fallback;
      return translations.en[key] || key;
    },
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

