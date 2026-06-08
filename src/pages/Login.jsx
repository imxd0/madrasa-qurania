import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../styles/login.css';

const Login = () => {
  const [selectedRole, setSelectedRole] = useState(null); // null | 'parent' | 'admin'
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleParentLogin = async () => {
    setError('');
    try {
      await login('parent');
      navigate('/');
    } catch (err) {
      console.error('[Login] parent login failed:', err);
      setError(`تعذر الاتصال بالخادم: ${err?.message || err} (status=${err?.status || '?'})`);
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    if (password.trim() === '') {
      setError('الرجاء إدخال كلمة السر');
      return;
    }
    try {
      await login('admin', password);
      navigate('/dashboard');
    } catch (err) {
      console.error('[Login] admin login failed:', err);
      setError(`فشل الدخول: ${err?.message || err} (status=${err?.status || '?'})`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdminLogin();
  };

  return (
    <div className="login-page-full">
      {/* خلفية الزخرفة الإسلامية */}
      <div className="login-bg-pattern" />

      <div className="login-card">
        {/* رأس البطاقة */}
        <div className="login-card-header">
          <div className="login-logo-wrapper">
            <img
              src="/assets/images/logo.png"
              alt="شعار المدرسة القرآنية"
              className="login-logo-img"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="login-logo-fallback" style={{ display: 'none' }}>
              📖
            </div>
          </div>
          <h1 className="login-main-title">المدرسة القرآنية</h1>
          <p className="login-main-subtitle">لمسجد الإتحاد</p>
          <p className="login-welcome-text">
            مرحباً بكم — اختر نوع المستخدم للدخول إلى الموقع
          </p>
        </div>

        {/* رسالة الخطأ */}
        {error && (
          <div className="login-error-box" id="login-error-msg" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* اختيار الدور */}
        {!selectedRole && (
          <div className="login-role-grid">
            <button
              className="login-role-btn login-role-parent"
              onClick={handleParentLogin}
              id="role-parent-btn"
            >
              <span className="login-role-icon">👤</span>
              <span className="login-role-label">ولي أمر</span>
              <span className="login-role-desc">دخول مباشر للاطلاع على الموقع</span>
            </button>

            <button
              className="login-role-btn login-role-admin"
              onClick={() => { setSelectedRole('admin'); setError(''); }}
              id="role-admin-btn"
            >
              <span className="login-role-icon">🛡️</span>
              <span className="login-role-label">مشرف</span>
              <span className="login-role-desc">إدارة المحتوى والبيانات</span>
            </button>
          </div>
        )}

        {/* نموذج كلمة سر المشرف */}
        {selectedRole === 'admin' && (
          <div className="login-admin-form">
            <div className="login-admin-title">
              <Shield size={20} />
              <span>تسجيل دخول المشرف</span>
            </div>

            <div className="login-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="admin-password-input"
                className="login-password-input"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="أدخل كلمة المرور"
                autoFocus
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="إظهار/إخفاء كلمة السر"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="login-admin-actions">
              <button
                className="login-submit-btn"
                onClick={handleAdminLogin}
                id="admin-login-btn"
              >
                <Shield size={18} />
                دخول كمشرف
              </button>
              <button
                className="login-cancel-btn"
                onClick={() => { setSelectedRole(null); setPassword(''); setError(''); }}
                id="admin-cancel-btn"
              >
                رجوع
              </button>
            </div>
          </div>
        )}

        <div className="login-card-footer">
          <p>﷽ — حفظ الله الجميع بالقرآن الكريم</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
