import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import { MainLayout } from './components/layout/MainLayout';
import { AuthLayout } from './components/layout/AuthLayout';
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage').then((module) => ({ default: module.RegisterPage })));
const FarmerDashboard = lazy(() => import('./pages/farmer/DashboardPage').then((module) => ({ default: module.FarmerDashboard })));
const CropSeasonsPage = lazy(() => import('./pages/farmer/CropSeasonsPage').then((module) => ({ default: module.CropSeasonsPage })));
const MonitoringPage = lazy(() => import('./pages/farmer/MonitoringPage').then((module) => ({ default: module.MonitoringPage })));
const TasksPage = lazy(() => import('./pages/farmer/TasksPage').then((module) => ({ default: module.TasksPage })));
const InputRequestsPage = lazy(() => import('./pages/farmer/InputRequestsPage').then((module) => ({ default: module.InputRequestsPage })));
const OrdersPage = lazy(() => import('./pages/farmer/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const HarvestsPage = lazy(() => import('./pages/farmer/HarvestsPage').then((module) => ({ default: module.HarvestsPage })));
const BananaFarmingPage = lazy(() => import('./pages/farmer/BananaFarmingPage').then((module) => ({ default: module.BananaFarmingPage })));
const AIAssistantPage = lazy(() => import('./pages/farmer/AIAssistantPage').then((module) => ({ default: module.AIAssistantPage })));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage').then((module) => ({ default: module.AdminUsersPage })));
const AdminRequestsPage = lazy(() => import('./pages/admin/RequestsPage').then((module) => ({ default: module.AdminRequestsPage })));
const AdminProductsPage = lazy(() => import('./pages/admin/ProductsPage').then((module) => ({ default: module.AdminProductsPage })));
const AdminPaymentsPage = lazy(() => import('./pages/admin/PaymentsPage').then((module) => ({ default: module.AdminPaymentsPage })));
const AdminReportsPage = lazy(() => import('./pages/admin/ReportsPage').then((module) => ({ default: module.AdminReportsPage })));
const AttendanceReviewPage = lazy(() => import('./pages/admin/AttendanceReviewPage').then((module) => ({ default: module.AttendanceReviewPage })));
const OfficerDashboardPage = lazy(() => import('./pages/officer/OfficerDashboardPage').then((module) => ({ default: module.OfficerDashboardPage })));
const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })));

// Livestock Module Pages
const LivestockDashboardPage = lazy(() => import('./pages/livestock/LivestockDashboardPage').then((module) => ({ default: module.LivestockDashboardPage })));
const MyAnimalsPage = lazy(() => import('./pages/livestock/MyAnimalsPage').then((module) => ({ default: module.MyAnimalsPage })));
const RegisterAnimalPage = lazy(() => import('./pages/livestock/RegisterAnimalPage').then((module) => ({ default: module.RegisterAnimalPage })));
const ReportDiseasePage = lazy(() => import('./pages/livestock/ReportDiseasePage').then((module) => ({ default: module.ReportDiseasePage })));
const ReportFeedShortagePage = lazy(() => import('./pages/livestock/ReportFeedShortagePage').then((module) => ({ default: module.ReportFeedShortagePage })));
const AnimalHealthRecordsPage = lazy(() => import('./pages/livestock/AnimalHealthRecordsPage').then((module) => ({ default: module.AnimalHealthRecordsPage })));
const VaccinationsRemindersPage = lazy(() => import('./pages/livestock/VaccinationsRemindersPage').then((module) => ({ default: module.VaccinationsRemindersPage })));
const AssistanceRequestsPage = lazy(() => import('./pages/livestock/AssistanceRequestsPage').then((module) => ({ default: module.AssistanceRequestsPage })));

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: ('ADMIN' | 'FARMER' | 'OFFICER' | 'VETERINARY_OFFICER')[] }) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-green-700 rounded-lg flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function RoleDashboard() {
  const { user } = useAuth();

  if (user?.role === 'OFFICER') {
    return <Navigate to="/officer" replace />;
  }

  if (user?.role === 'ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return <FarmerDashboard />;
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();
  const dashboardPath = user?.role === 'OFFICER' ? '/officer' : user?.role === 'ADMIN' ? '/admin' : '/dashboard';

  return (
    <Routes>
      {/* Public marketing page: intentionally outside the authenticated application shell. */}
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />
        <Route path="/farms" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/banana-farming" element={<ProtectedRoute><BananaFarmingPage /></ProtectedRoute>} />
        <Route path="/banana-farming/:tab" element={<ProtectedRoute><BananaFarmingPage /></ProtectedRoute>} />
        <Route path="/crop-seasons" element={<ProtectedRoute><CropSeasonsPage /></ProtectedRoute>} />
        <Route path="/crop-seasons/new" element={<ProtectedRoute><CropSeasonsPage /></ProtectedRoute>} />
        <Route path="/crop-seasons/:id" element={<ProtectedRoute><CropSeasonsPage /></ProtectedRoute>} />
        <Route path="/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TasksPage /></ProtectedRoute>} />
        <Route path="/input-requests" element={<ProtectedRoute><InputRequestsPage /></ProtectedRoute>} />
        <Route path="/input-requests/new" element={<ProtectedRoute><InputRequestsPage /></ProtectedRoute>} />
        <Route path="/input-requests/:id" element={<ProtectedRoute><InputRequestsPage /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
        <Route path="/harvests" element={<ProtectedRoute><HarvestsPage /></ProtectedRoute>} />
        <Route path="/ai-assistant" element={<ProtectedRoute roles={['FARMER', 'OFFICER', 'ADMIN']}><AIAssistantPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><FarmerDashboard /></ProtectedRoute>} />

        {/* Livestock & Animal Management Module Routes */}
        <Route path="/livestock/dashboard" element={<ProtectedRoute><LivestockDashboardPage /></ProtectedRoute>} />
        <Route path="/livestock/animals" element={<ProtectedRoute><MyAnimalsPage /></ProtectedRoute>} />
        <Route path="/livestock/register" element={<ProtectedRoute><RegisterAnimalPage /></ProtectedRoute>} />
        <Route path="/livestock/disease-reports" element={<ProtectedRoute><AssistanceRequestsPage /></ProtectedRoute>} />
        <Route path="/livestock/disease-reports/new" element={<ProtectedRoute><ReportDiseasePage /></ProtectedRoute>} />
        <Route path="/livestock/feed-shortages" element={<ProtectedRoute><AssistanceRequestsPage /></ProtectedRoute>} />
        <Route path="/livestock/feed-shortages/new" element={<ProtectedRoute><ReportFeedShortagePage /></ProtectedRoute>} />
        <Route path="/livestock/records" element={<ProtectedRoute><AnimalHealthRecordsPage /></ProtectedRoute>} />
        <Route path="/livestock/vaccinations" element={<ProtectedRoute><VaccinationsRemindersPage /></ProtectedRoute>} />
        <Route path="/livestock/requests" element={<ProtectedRoute><AssistanceRequestsPage /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/users/:id" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/farms" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/crop-types" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute roles={['ADMIN']}><AdminProductsPage /></ProtectedRoute>} />
        <Route path="/admin/requests" element={<ProtectedRoute roles={['ADMIN']}><AdminRequestsPage /></ProtectedRoute>} />
        <Route path="/admin/payments" element={<ProtectedRoute roles={['ADMIN']}><AdminPaymentsPage /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute roles={['ADMIN']}><AdminReportsPage /></ProtectedRoute>} />
        <Route path="/admin/attendance-review" element={<ProtectedRoute roles={['ADMIN']}><AttendanceReviewPage /></ProtectedRoute>} />

        <Route path="/officer" element={<ProtectedRoute roles={['OFFICER']}><OfficerDashboardPage /></ProtectedRoute>} />
      </Route>

      {/* Never send signed-out users to an authenticated dashboard route. */}
      <Route path="*" element={<Navigate to={isAuthenticated ? dashboardPath : '/login'} replace />} />
    </Routes>
  );
}

class PageLoadBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() { return { failed: true }; }

  render() {
    if (this.state.failed) {
      return <div role="alert" className="p-8 text-center">
        <p>The page could not load. Check your connection and reload to try again.</p>
        <button type="button" className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-white" onClick={() => window.location.reload()}>Reload page</button>
      </div>;
    }
    return this.props.children;
  }
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <PageLoadBoundary><Suspense fallback={<p role="status" className="p-8 text-center">Loading page...</p>}><AppRoutes /></Suspense></PageLoadBoundary>
          </NotificationProvider>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
