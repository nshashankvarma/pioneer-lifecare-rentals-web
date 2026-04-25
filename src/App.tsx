import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AppLoadingScreen from './components/AppLoadingScreen';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewRentalPage from './pages/NewRentalPage';
import RentalDetailPage from './pages/RentalDetailPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/admin/AdminPage';
import ManageItemsPage from './pages/admin/ManageItemsPage';
import ManageHospitalsPage from './pages/admin/ManageHospitalsPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth();
  if (loading) return <AppLoadingScreen />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <AppLoadingScreen />;
  if (!user) return <LoginPage />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="new-rental" element={<NewRentalPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="rental/:id" element={<RentalDetailPage />} />
        <Route
          path="admin"
          element={
            <AdminGuard>
              <AdminPage />
            </AdminGuard>
          }
        />
        <Route
          path="admin/users"
          element={
            <AdminGuard>
              <ManageUsersPage />
            </AdminGuard>
          }
        />
        <Route
          path="admin/equipment"
          element={
            <AdminGuard>
              <ManageItemsPage />
            </AdminGuard>
          }
        />
        <Route
          path="admin/hospitals"
          element={
            <AdminGuard>
              <ManageHospitalsPage />
            </AdminGuard>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
