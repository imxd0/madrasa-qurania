import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, FolderKanban, CalendarCheck, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/admin.css';

const AdminLayout = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminLinks = [
    { name: 'الإحصائيات العامة', path: '/dashboard', icon: <BarChart3 className="w-5 h-5" />, end: true },
    { name: 'إدارة الأقسام', path: '/dashboard/departments', icon: <FolderKanban className="w-5 h-5" /> },
    { name: 'إدارة الأنشطة', path: '/dashboard/activities', icon: <CalendarCheck className="w-5 h-5" /> }
  ];

  return (
    <div className="dashboard-wrapper">
      <aside className="sidebar" id="admin-sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">لوحة التحكم الإدارية</span>
        </div>
        <nav className="sidebar-menu">
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
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="btn btn-secondary sidebar-logout-btn" id="admin-logout-btn">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
