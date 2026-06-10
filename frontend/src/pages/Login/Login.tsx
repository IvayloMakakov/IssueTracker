import './login.css';
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, fetchMe, type AuthResponse } from './loginApi';

type Mode = 'login' | 'register';

interface LoginProps {
  onLoginSuccess: () => void;
}

const SYMBOL_RE = /[.,!?@#$%^&*()_\-+=\[\]{};:'"\\|<>/~`]/;

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Паролата трябва да бъде поне 8 символа дълга!';
  if (!/[A-Z]/.test(password)) return 'Паролата трябва да съдържа поне една главна буква!';
  if (!/[a-z]/.test(password)) return 'Паролата трябва да съдържа поне една малка буква!';
  if (!SYMBOL_RE.test(password)) return 'Паролата трябва да съдържа поне един специален символ (напр. . , ! ? @)';
  return null;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setLoading(true);
      fetchMe(token).then((user) => {
        if (user) {
          onLoginSuccess();
          navigate('/');
        } else {
          localStorage.removeItem('token');
        }
        setLoading(false);
      });
    }
  }, [navigate, onLoginSuccess]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      const pwdErr = validatePassword(password);
      if (pwdErr) {
        setError(pwdErr);
        return;
      }

      setLoading(true);
      const { ok, data } = await register(firstName, lastName, email, password);
      setLoading(false);

      if (data?.success === false) {
        setError(data.error || 'Регистрацията беше неуспешна.');
        return;
      }

      if (!ok || !data) {
        setError('Нещо се обърка при връзката със сървъра.');
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        onLoginSuccess();
        navigate('/');
        return;
      }

      alert('Регистрацията е успешна! Моля, влезте в профила си.');
      setMode('login');
      setPassword('');

    } else {
      setLoading(true);
      const { ok, data } = await login(email, password);
      setLoading(false);

      if (data?.success === false) {
        setError(data.error || 'Невалиден имейл или парола');
        return;
      }

      if (!ok || !data) {
        setError('Нещо се обърка при връзката със сървъра.');
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
        onLoginSuccess();
        navigate('/');
      } else {
        setError('Възникна аномалия при автентикацията.');
      }
    }

    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
  }

  const switchMode = (target: Mode) => (e: MouseEvent) => {
    e.preventDefault();
    setMode(target);
    setError(null);
  };

  return (
    <div className="auth-screen-container">
      <div className="auth-card">
        <div className="auth-logo-badge">IT</div>
        <h1 className="auth-title">Welcome</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Влезте в своя профил' : 'Създайте нов акаунт в системата'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="auth-form-row">
              <label style={{ flex: 1 }}>
                Име
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                Фамилия
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>
            </div>
          )}
          
          <label>
            Имейл адрес
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          
          <label>
            Парола
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {mode === 'register' && (
              <span className="auth-hint">
                Минимум 8 символа, включващи главна буква, малка буква и специален знак (напр. . , ! ? @).
              </span>
            )}
          </label>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Изчакване...' : mode === 'login' ? 'Вход' : 'Регистрация'}
          </button>
        </form>

        {error && <p className="auth-message auth-error">{error}</p>}

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              Нямате акаунт?{' '}
              <a href="#" onClick={switchMode('register')}>Регистрирайте се сега!</a>
            </>
          ) : (
            <>
              Вече имате акаунт?{' '}
              <a href="#" onClick={switchMode('login')}>Влезте в профила</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}