import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Shield, AlertCircle, Eye, EyeOff, BookOpen } from 'lucide-react';

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
      await login(password);
      navigate('/');
    } catch (err) {
      setError('كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f5132 0%, #1a7a5c 50%, #146b4a 100%)',
      padding: '20px',
    }}>
      <div style={{
        background: 'var(--bg-card, #fff)',
        borderRadius: '20px',
        padding: '40px 32px',
        maxWidth: '400px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center',
      }}>
        <div style={{ marginBottom: '24px' }}>
          <BookOpen size={48} color="#198754" />
        </div>
        <h1 style={{
          fontSize: '1.5rem',
          color: 'var(--color-green-dark, #0f5132)',
          marginBottom: '8px',
          fontFamily: 'var(--font-arabic)',
        }}>المدرسة القرآنية</h1>
        <p style={{
          color: 'var(--text-secondary, #666)',
          marginBottom: '30px',
          fontSize: '0.9rem',
        }}>أدخل كلمة المرور للدخول</p>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.9rem',
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            placeholder="كلمة المرور"
            autoFocus
            style={{
              width: '100%',
              padding: '14px 50px 14px 16px',
              fontSize: '1rem',
              border: '2px solid var(--border-color, #dee2e6)',
              borderRadius: '12px',
              background: 'var(--bg-secondary, #f8f9fa)',
              color: 'var(--text-primary, #333)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted, #999)',
              padding: '4px',
            }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '1rem',
            fontWeight: '700',
            background: loading ? '#94d3a2' : '#198754',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
        >
          <Shield size={18} />
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </div>
    </div>
  );
};

export default Login;
