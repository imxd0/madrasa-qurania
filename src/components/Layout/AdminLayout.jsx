import { NavLink, Outlet } from 'react-router-dom';
import { BarChart3, FolderKanban, CalendarCheck, Globe, Info, Clock, Activity } from 'lucide-react';
import '../../styles/admin.css';

const AdminLayout = () => {
  const adminLinks = [
    { name: 'الإحصائيات العامة', path: '/', icon: <BarChart3 className="w-5 h-5" />, end: true },
    { name: 'إدارة الأقسام', path: '/departments', icon: <FolderKanban className="w-5 h-5" /> },
    { name: 'إدارة الأنشطة', path: '/activities', icon: <CalendarCheck className="w-5 h-5" /> },
  ];

  const siteLinks = [
    { name: 'صفحة الموقع', path: '/site/departments', icon: <Globe className="w-5 h-5" /> },
    { name: 'من نحن', path: '/site/about', icon: <Info className="w-5 h-5" /> },
    { name: 'الأقسام والحلقات', path: '/site/departments', icon: <FolderKanban className="w-5 h-5" /> },
    { name: 'أوقات الدراسة', path: '/site/schedule', icon: <Clock className="w-5 h-5" /> },
    { name: 'نشاطاتنا', path: '/site/activities', icon: <Activity className="w-5 h-5" /> },
  ];

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar" id="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">لوحة التحكم</span>
        </div>
        <nav className="sidebar-menu">
          <div className="sidebar-section-label">الإدارة</div>
          {adminLinks.map((link) => (
            <div key={link.path} className="sidebar-item">
              <NavLink
                to={link.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
                end={link.end}
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            </div>
          ))}
          <div className="sidebar-section-label" style={{ marginTop: '16px' }}>الموقع العام</div>
          {siteLinks.map((link, idx) => (
            <div key={`site-${idx}`} className="sidebar-item">
              <NavLink
                to={link.path}
                className={({ isActive }) => (isActive ? 'active' : '')}
              >
                {link.icon}
                <span>{link.name}</span>
              </NavLink>
            </div>
          ))}
        </nav>
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
