import 'dotenv/config';
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

if (process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is leaked on github but it is only for demonstrating purposes for the project.');
}

app.use(cors());
app.use(express.json());

interface User {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
}

interface RegisterRequestBody {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface TokenPayload {
  email: string;
}

const users = new Map<string, User>();

function signToken(user: User): string {
  const payload: TokenPayload = { email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null && typeof decoded.email === 'string') {
      return { email: decoded.email };
    }
    return null;
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SYMBOL_RE = /[.,!?@#$%^&*()_\-+=\[\]{};:'"\\|<>/~`]/;

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!SYMBOL_RE.test(password)) {
    return 'Password must contain at least one symbol (e.g. . , ! ? @ #)';
  }
  return null;
}

app.post('/api/register', async (req: Request<{}, {}, RegisterRequestBody>, res: Response) => {
  const { firstName, lastName, email, password } = req.body || {};

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'First name, last name, email, and password are required' });
  }
  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }
  if (users.has(email)) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user: User = { firstName, lastName, email, passwordHash };
  users.set(email, user);

  const token = signToken(user);

  res.status(201).json({ message: 'Registered successfully', token, firstName, lastName, email });
});

app.post('/api/login', async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = signToken(user);

  res.json({
    message: 'Logged in successfully',
    token,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
});

app.get('/api/me', (req: Request, res: Response) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  const user = payload ? users.get(payload.email) : null;

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ firstName: user.firstName, lastName: user.lastName, email: user.email });
});

app.listen(PORT, () => {
  console.log(`Issue tracker backend running on http://localhost:${PORT}`);
});
