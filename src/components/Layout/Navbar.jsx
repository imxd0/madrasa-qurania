import { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, LogOut } from 'lucide-react';
import DarkModeToggle from '../UI/DarkModeToggle';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = isAdmin
    ? [
        { name: 'الإحصائيات العامة', path: '/dashboard' },
        { name: 'إدارة الأقسام', path: '/dashboard/departments' },
        { name: 'إدارة الأنشطة', path: '/dashboard/activities' },
      ]
    : [
        { name: 'الرئيسية', path: '/' },
        { name: 'من نحن', path: '/about' },
        { name: 'الأقسام والحلقات', path: '/departments' },
        { name: 'أوقات الدراسة', path: '/schedule' },
        { name: 'نشاطاتنا', path: '/activities' },
      ];

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container navbar-container">
        <NavLink to={isAdmin ? '/dashboard' : '/'} className="logo" id="navbar-logo-link">
          <span className="logo-icon"><BookOpen className="w-8 h-8 text-amber-500" /></span>
          <span>المدرسة القرآنية</span>
        </NavLink>

        <nav>
          <ul className={`nav-menu ${isOpen ? 'open' : ''}`} id="navbar-links-menu">
            {navLinks.map((link) => (
              <li key={link.path}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  end={link.path === '/'}
                >
                  {link.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-actions">
          <DarkModeToggle />
          {isAdmin && (
            <span className="nav-admin-badge" title="أنت مسجل كمشرف">مشرف</span>
          )}
          <button
            onClick={handleLogout}
            className="btn-icon nav-logout-btn"
            aria-label="تسجيل الخروج"
            title="تسجيل الخروج"
            id="navbar-logout-btn"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="btn-icon nav-toggle-btn"
            aria-label="القائمة الجانبية للهاتف"
            id="navbar-mobile-toggle-btn"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
