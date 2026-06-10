import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Outlet } from 'react-router-dom';

import Navbar from './components/Layout/Navbar';
import OfflineIndicator from './components/OfflineIndicator';
import { startAutoSync, fullSync } from './services/syncManager';

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

function App() {
  useEffect(() => {
    startAutoSync();
    fullSync();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <OfflineIndicator />
      <Routes>
        {/* لوحة التحكم — الصفحة الرئيسية */}
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="dashboard" element={<AdminHome />} />
          <Route path="departments" element={<ManageDepartments />} />
          <Route path="activities" element={<ManageActivities />} />
        </Route>

        {/* الصفحات العامة — يمكن الوصول لها من شريط التنقل */}
        <Route element={<PublicLayout />}>
          <Route path="/site/about" element={<About />} />
          <Route path="/site/departments" element={<Departments />} />
          <Route path="/site/schedule" element={<Schedule />} />
          <Route path="/site/activities" element={<Activities />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
