export interface User {
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthSuccess extends User {
  message: string;
  token: string;
}

export interface AuthError {
  error: string;
}

export type AuthResponse = AuthSuccess | AuthError;

async function postJSON<T>(url: string, body: unknown): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, data };
}

export function login(email: string, password: string) {
  return postJSON<AuthResponse>('/api/login', { email, password });
}

export function register(firstName: string, lastName: string, email: string, password: string) {
  return postJSON<AuthResponse>('/api/register', { firstName, lastName, email, password });
}

export async function fetchMe(token: string): Promise<User | null> {
  const res = await fetch('/api/me', {
    headers: { Authorization: 'Bearer ' + token },
  });
  if (!res.ok) return null;
  return (await res.json()) as User;
}
