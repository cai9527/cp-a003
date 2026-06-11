import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import MainLayout from '@/components/Layout/MainLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import VehiclesPage from '@/pages/Vehicles';
import TasksPage from '@/pages/Tasks';
import DriversPage from '@/pages/Drivers';
import StatisticsPage from '@/pages/Statistics';
import SafetyPage from '@/pages/Safety';
import UsersPage from '@/pages/System/users';
import BackupPage from '@/pages/System/backup';
import { FEATURES_IN_DEVELOPMENT } from '@/constants/features';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PermissionGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hasPathPermission = useAuthStore((state) => state.hasPathPermission);

  if (!hasPathPermission(location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="vehicles" element={<PermissionGuard><VehiclesPage /></PermissionGuard>} />
          <Route path="tasks" element={<PermissionGuard><TasksPage /></PermissionGuard>} />
          <Route path="drivers" element={<PermissionGuard><DriversPage /></PermissionGuard>} />
          <Route path="statistics" element={<PermissionGuard><StatisticsPage /></PermissionGuard>} />
          <Route path="safety" element={<PermissionGuard><SafetyPage /></PermissionGuard>} />
          <Route path="system/users" element={<PermissionGuard><UsersPage /></PermissionGuard>} />
          <Route path="system/backup" element={<PermissionGuard><BackupPage /></PermissionGuard>} />
          {FEATURES_IN_DEVELOPMENT.map((feature) => (
            <Route
              key={feature.path}
              path={feature.path.replace('/', '')}
              element={
                <PermissionGuard>
                  <div className="card p-8 text-center">
                    <h2 className="text-xl font-semibold text-neutral-800 mb-2">{feature.name}</h2>
                    <p className="text-neutral-500">功能开发中...</p>
                  </div>
                </PermissionGuard>
              }
            />
          ))}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
