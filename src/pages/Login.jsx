import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import '../styles/login.css';

const Login = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (password.trim() === '') {
      setError('الرجاء إدخال كلمة المرور');
      return;
    }
    setLoading(true);
    try {
      await login('admin', password);
      navigate('/dashboard');
    } catch (err) {
      console.error('[Login] admin login failed:', err);
      setError(`فشل الدخول: ${err?.message || 'تحقق من كلمة المرور'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="login-page-full">
      <div className="login-bg-pattern" />

      <div className="login-card">
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
            تسجيل دخول المشرف — أدخل كلمة المرور للدخول إلى لوحة التحكم
          </p>
        </div>

        {error && (
          <div className="login-error-box" id="login-error-msg" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="login-admin-form" style={{ display: 'block' }}>
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
              aria-label="إظهار/إخفاء كلمة المرور"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="login-admin-actions">
            <button
              className="login-submit-btn"
              onClick={handleLogin}
              id="admin-login-btn"
              disabled={loading}
            >
              <Shield size={18} />
              {loading ? 'جاري الدخول...' : 'دخول'}
            </button>
          </div>
        </div>

        <div className="login-card-footer">
          <p>﷽ — حفظ الله الجميع بالقرآن الكريم</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
