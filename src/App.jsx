import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet, Navigate } from 'react-router-dom';

import Navbar from './components/Layout/Navbar';
import OfflineIndicator from './components/OfflineIndicator';
import { startAutoSync, fullSync } from './services/syncManager';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

import About from './pages/About';
import Departments from './pages/Departments';
import Schedule from './pages/Schedule';
import Activities from './pages/Activities';
import AdminLayout from './components/Layout/AdminLayout';
import AdminHome from './pages/Dashboard/AdminHome';
import ManageDepartments from './pages/Dashboard/ManageDepartments';
import ManageActivities from './pages/Dashboard/ManageActivities';

import './styles/global.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const PublicLayout = () => {
  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 64px)', paddingTop: 'var(--navbar-height)' }}>
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
};

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f5132 0%, #1a7a5c 50%, #146b4a 100%)',
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid #fff',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) return <Login />;

  return (
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<AdminHome />} />
        <Route path="dashboard" element={<AdminHome />} />
        <Route path="departments" element={<ManageDepartments />} />
        <Route path="activities" element={<ManageActivities />} />
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="/site/about" element={<About />} />
        <Route path="/site/departments" element={<Departments />} />
        <Route path="/site/schedule" element={<Schedule />} />
        <Route path="/site/activities" element={<Activities />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  useEffect(() => {
    startAutoSync();
    fullSync();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <OfflineIndicator />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
