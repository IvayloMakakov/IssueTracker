// frontend/src/Login.tsx
import './login.css';
import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, fetchMe, type AuthResponse, type AuthSuccess } from './loginApi';

type Mode = 'login' | 'register';

interface LoginProps {
  onLoginSuccess: () => void;
}

const SYMBOL_RE = /[.,!?@#$%^&*()_\-+=\[\]{};:'"\\|<>/~`]/;

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
  if (!SYMBOL_RE.test(password)) return 'Password must contain at least one symbol (e.g. . , ! ? @ #)';
  return null;
}

function isSuccess(data: AuthResponse): data is AuthSuccess {
  return data !== null && 'token' in data;
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

  // Проверка за съществуващ токен при зареждане
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
            setLoading(false); // Спри зареждането
        });
    }
}, [navigate, onLoginSuccess]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === 'register') {
      const pwError = validatePassword(password);
      if (pwError) {
        setError(pwError);
        return;
      }
    }

    setLoading(true);

    if (mode === 'register') {
      // --- РЕЖИМ: РЕГИСТРАЦИЯ ---
      const { ok, data } = await register(firstName, lastName, email, password);
      setLoading(false);

      if (!ok || !data) {
        setError('Нещо се обърка при връзката със сървъра.');
        return;
      }

      if ('error' in data) {
        setError(data.error || 'Registration failed');
        return;
      }

      alert('Регистрацията е успешна! Моля, влезте в профила си.');
      setMode('login');
      setPassword('');
      
    } else {
      // --- РЕЖИМ: ВХОД (LOGIN) ---
      const { ok, data } = await login(email, password);
      setLoading(false);

      if (!ok || !data) {
        setError('Нещо се обърка при връзката със сървъра.');
        return;
      }

      if ('error' in data) {
        setError(data.error || 'Невалиден имейл или парола');
        return;
      }

      if (!isSuccess(data) || !data.token) {
        setError('Невалиден имейл или парола');
        return;
      }

      // 1. Запазваме токена в браузъра
      localStorage.setItem('token', data.token);
      
      // 2. Вдигаме стейта в App.tsx, за да се отключи маршрута "/"
      onLoginSuccess();

      // 3. Препращаме към началното табло
      navigate('/');
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
        <h1 className="auth-title">Welcome</h1>
        <p className="auth-subtitle">
          {mode === 'login' ? 'Log in to your account' : 'Create a new account'}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <>
              <label>
                First Name
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </label>
              <label>
                Last Name
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </label>
            </>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
            />
            {mode === 'register' && (
              <span className="auth-hint">
                At least 8 characters, including an uppercase letter, a lowercase letter, and a symbol (e.g. . , !).
              </span>
            )}
          </label>
          <button type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? 'Log in' : 'Register'}
          </button>
        </form>

        {error && <p className="auth-message auth-error">{error}</p>}

        <p className="auth-switch">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <a href="#" onClick={switchMode('register')}>Register now!</a>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <a href="#" onClick={switchMode('login')}>Log in</a>
            </>
          )}
        </p>
      </div>
    </div>
  );
}