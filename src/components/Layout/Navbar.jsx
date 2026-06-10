import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen } from 'lucide-react';
import DarkModeToggle from '../UI/DarkModeToggle';
import '../../styles/navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'لوحة التحكم', path: '/' },
    { name: 'من نحن', path: '/site/about' },
    { name: 'الأقسام والحلقات', path: '/site/departments' },
    { name: 'أوقات الدراسة', path: '/site/schedule' },
    { name: 'نشاطاتنا', path: '/site/activities' },
  ];

  return (
    <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
      <div className="container navbar-container">
        <NavLink to="/" className="logo" id="navbar-logo-link">
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
