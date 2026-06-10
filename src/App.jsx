import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate, Outlet } from 'react-router-dom';

import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import OfflineIndicator from './components/OfflineIndicator';
import { startAutoSync, fullSync } from './services/syncManager';

import Home from './pages/Home';
import About from './pages/About';
import Departments from './pages/Departments';
import Schedule from './pages/Schedule';
import Login from './pages/Login';
import Activities from './pages/Activities';
import Contact from './pages/Contact';
import AdminLayout from './components/Layout/AdminLayout';
import AdminHome from './pages/Dashboard/AdminHome';
import ManageDepartments from './pages/Dashboard/ManageDepartments';
import ManageActivities from './pages/Dashboard/ManageActivities';

import { AuthProvider, useAuth } from './contexts/AuthContext';

import './styles/global.css';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const SiteLayout = () => {
  const { isLoading } = useAuth();

  if (isLoading) return null;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: 'calc(100vh - 64px)', paddingTop: 'var(--navbar-height)' }}>
        <main>
          <Outlet />
        </main>
      </div>
      <Footer />
    </>
  );
};

function AdminRoutes() {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--color-green-light, #c8e6c9)',
          borderTop: '4px solid var(--color-green-primary, #198754)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>جاري التحميل...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
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
        <Routes>
          {/* الصفحات العامة — متاحة للجميع */}
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/departments" element={<Departments />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/activities" element={<Activities />} />
          <Route path="/contact" element={<Contact />} />
          </Route>

          {/* صفحة الدخول — متاحة دائماً */}
          <Route path="/login" element={<Login />} />

          {/* لوحة التحكم — للمشرف فقط */}
          <Route element={<AdminRoutes />}>
            <Route path="/dashboard" element={<AdminLayout />}>
              <Route index element={<AdminHome />} />
              <Route path="departments" element={<ManageDepartments />} />
              <Route path="activities" element={<ManageActivities />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
