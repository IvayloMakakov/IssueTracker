import { useEffect, useState, type FormEvent, type MouseEvent } from 'react';
import { login, register, fetchMe, type AuthResponse, type AuthSuccess, type User } from './login';

type Mode = 'login' | 'register';

interface Session {
  user: User;
  token: string;
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
  return 'token' in data;
}

export default function Login() {
  const [mode, setMode] = useState<Mode>('login');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchMe(token).then((user) => {
      if (user) {
        setSession({ user, token });
      } else {
        localStorage.removeItem('token');
      }
    });
  }, []);

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
    const { ok, data } =
      mode === 'login'
        ? await login(email, password)
        : await register(firstName, lastName, email, password);
    setLoading(false);

    if (!ok || !isSuccess(data)) {
      setError(('error' in data && data.error) || 'Request failed');
      return;
    }

    localStorage.setItem('token', data.token);
    setSession({
      user: { firstName: data.firstName, lastName: data.lastName, email: data.email },
      token: data.token,
    });
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setSession(null);
  }

  function switchMode(next: Mode) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setMode(next);
      setError(null);
      setPassword('');
    };
  }

  if (session) {
    return (
      <main className="card">
        <h1>Issue Tracker</h1>
        <p>Welcome, <strong>{session.user.firstName} {session.user.lastName}</strong>!</p>
        <p className="token-label">Your token:</p>
        <code className="token">{session.token}</code>
        <button onClick={handleLogout}>Log out</button>
      </main>
    );
  }

  return (
    <main className="card">
      <h1>Issue Tracker</h1>
      <h2 className="subtitle">{mode === 'login' ? 'Log in' : 'Create an account'}</h2>

      <form className="form" onSubmit={handleSubmit}>
        {mode === 'register' && (
          <>
            <label>
              First name
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
            </label>
            <label>
              Last name
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
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
            <span className="hint">
              At least 8 characters, including an uppercase letter, a lowercase letter, and a symbol (e.g. . , !).
            </span>
          )}
        </label>
        <button type="submit" disabled={loading}>
          {loading ? '...' : mode === 'login' ? 'Log in' : 'Register'}
        </button>
      </form>

      {error && <p className="message error">{error}</p>}

      <p className="switch">
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
    </main>
  );
}
