import 'dotenv/config';
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3000; // Може да го смените на 5000 по споразумение, ако фронтенд проксито ви го изисква
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = '7d';

if (process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET is leaked on github but it is only for demonstrating purposes for the project.');
}

app.use(cors());
app.use(express.json());

// ==========================================
// --- ИНТЕРФЕЙСИ (TYPES & INTERFACES) ---
// ==========================================

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

interface Comment {
  id: number;
  author: string;
  avatar: string;
  color: string;
  date: string;
  text: string;
}

interface Assignee {
  name: string;
  initial: string;
}

interface Issue {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assignee: Assignee | null;
  updatedAt: string;
  isFavorite: boolean;
  comments?: Comment[]; // Разширяваме го, за да поддържа коментарите от частта за детайли
}

interface Notification {
  id: string;
  type: string;
  title: string;
  desc: string;
  date: string;
  targetId: string;
  unread: boolean;
}

// ==========================================
// --- ИМИТАЦИЯ НА БАЗИ ДАННИ (IN-MEMORY DB) ---
// ==========================================

const users = new Map<string, User>();

let notificationsDB: Notification[] = [
  { id: 'n1', type: 'assignment', title: 'New assignment', desc: 'You were assigned to ISS-6', date: '01/04/2026', targetId: 'ISS-6', unread: true },
  { id: 'n2', type: 'mention', title: 'You were mentioned', desc: 'Bob Smith mentioned you in ISS-3', date: '31/03/2026', targetId: 'ISS-3', unread: true },
  { id: 'n3', type: 'status', title: 'Status updated', desc: 'ISS-1 moved to In Review', date: '31/03/2026', targetId: 'ISS-1', unread: true },
  { id: 'n4', type: 'comment', title: 'New comment', desc: 'Carol White commented on ISS-2', date: '30/03/2026', targetId: 'ISS-2', unread: true },
  { id: 'n5', type: 'assignment', title: 'New assignment', desc: 'You were assigned to ISS-8', date: '30/03/2026', targetId: 'ISS-8', unread: true }
];

let issuesDB: Issue[] = [
  { 
    id: 'ISS-1', 
    title: 'Fix login page responsiveness', 
    type: 'Bug', 
    status: 'In Progress', 
    priority: 'High', 
    assignee: { name: 'Alice Johnson', initial: 'A' }, 
    updatedAt: '30/03/2026', 
    isFavorite: true,
    // Сливаме коментарите на колегите директно в първия ти билет за консистентност!
    comments: [
      {
        id: 1,
        author: "Bob Smith",
        avatar: "B",
        color: "black",
        date: "28.03.2026 г., 02:00:00 ч.",
        text: "This is affecting user experience on mobile."
      }
    ]
  },
  { id: 'ISS-2', title: 'Implement dark mode', type: 'Feature', status: 'To Do', priority: 'Medium', assignee: { name: 'Carol White', initial: 'C' }, updatedAt: '26/03/2026', isFavorite: false, comments: [] },
  { id: 'ISS-3', title: 'Database migration for user preferences', type: 'Task', status: 'In Review', priority: 'High', assignee: { name: 'Bob Smith', initial: 'B' }, updatedAt: '30/03/2026', isFavorite: false, comments: [] },
  { id: 'ISS-4', title: 'Update API documentation', type: 'Task', status: 'Done', priority: 'Low', assignee: { name: 'David Brown', initial: 'D' }, updatedAt: '31/03/2026', isFavorite: false, comments: [] },
  { id: 'ISS-5', title: 'Improve search performance', type: 'Improvement', status: 'Backlog', priority: 'Medium', assignee: null, updatedAt: '22/03/2026', isFavorite: false, comments: [] },
  { id: 'ISS-6', title: 'Fix memory leak in dashboard', type: 'Bug', status: 'To Do', priority: 'Urgent', assignee: { name: 'Alice Johnson', initial: 'A' }, updatedAt: '29/03/2026', isFavorite: false, comments: [] },
  { id: 'ISS-7', title: 'Add export to CSV feature', type: 'Feature', status: 'Backlog', priority: 'Low', assignee: null, updatedAt: '24/03/2026', isFavorite: false, comments: [] },
  { id: 'ISS-8', title: 'Implement email notifications', type: 'Feature', status: 'In Progress', priority: 'Medium', assignee: { name: 'Bob Smith', initial: 'B' }, updatedAt: '30/03/2026', isFavorite: true, comments: [] }
];

// --- ПОМОЩНИ ФУНКЦИИ ЗА АВТЕНТИКАЦИЯ ---
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

// ==========================================
// --- ЧАСТ 1: ЕНДПОЙНТИ ЗА ПОТРЕБИТЕЛИ ---
// ==========================================

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

// ==========================================
// --- ЧАСТ 2: ЕНДПОЙНТИ ЗА ТВОЯТА ТАБЛИЦА (ISSUES) ---
// ==========================================

app.get('/api/issues', (req: Request, res: Response) => {
  res.json(issuesDB);
});

app.post('/api/issues', (req: Request, res: Response) => {
  const { title, type, status, priority, assigneeName } = req.body;

  const newIssue: Issue = {
    id: `ISS-${issuesDB.length + 1}`,
    title,
    type,
    status,
    priority,
    assignee: assigneeName !== 'unassigned' && assigneeName
      ? { name: assigneeName, initial: assigneeName.charAt(0).toUpperCase() }
      : null,
    updatedAt: new Date().toLocaleDateString('bg-BG'),
    isFavorite: false,
    comments: []
  };

  issuesDB.unshift(newIssue);
  res.status(201).json(newIssue);
});

app.patch('/api/issues/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const fieldsToUpdate = req.body;

  const issue = issuesDB.find(i => i.id === id);

  if (issue) {
    Object.keys(fieldsToUpdate).forEach(key => {
      if (key in issue) {
        (issue as any)[key] = fieldsToUpdate[key];
      }
    });
    issue.updatedAt = new Date().toLocaleDateString('bg-BG');
    res.json({ success: true, issue });
  } else {
    res.status(404).json({ success: false, message: "Задачата не е намерена" });
  }
});

// ==========================================
// --- ЧАСТ 3: ЕНДПОЙНТИ ЗА ДЕТАЙЛЕН ПРЕГЛЕД (TICKET ДЕТАЙЛИ И КОМЕНТАРИ) ---
// ==========================================

// Вземане на конкретния билет ISS-1 с неговите коментари за страницата на колегата ти
app.get('/api/ticket', (req: Request, res: Response) => {
  const mainTicket = issuesDB.find(i => i.id === 'ISS-1');
  if (mainTicket) {
    res.json({
      id: mainTicket.id,
      title: mainTicket.title,
      status: mainTicket.status,
      priority: mainTicket.priority,
      assignee: mainTicket.assignee ? mainTicket.assignee.name : "Unassigned",
      comments: mainTicket.comments || []
    });
  } else {
    res.status(404).json({ success: false, message: "Основният билет не е намерен" });
  }
});

// Обновяване на поле през детайлния преглед
app.patch('/api/ticket', (req: Request, res: Response) => {
  const { field, value } = req.body as { field: string; value: string };
  const mainTicket = issuesDB.find(i => i.id === 'ISS-1');

  if (!mainTicket) {
    return res.status(404).json({ success: false, message: "Билетът не е намерен" });
  }

  if (field === 'title' || field === 'status' || field === 'priority') {
    (mainTicket as any)[field] = value;
    mainTicket.updatedAt = new Date().toLocaleDateString('bg-BG');
    return res.json({ success: true, message: "Обновено успешно", data: mainTicket });
  } else if (field === 'assignee') {
    mainTicket.assignee = value !== 'Unassigned' ? { name: value, initial: value.charAt(0).toUpperCase() } : null;
    mainTicket.updatedAt = new Date().toLocaleDateString('bg-BG');
    return res.json({ success: true, message: "Обновено успешно", data: mainTicket });
  }
  
  res.status(400).json({ success: false, message: "Невалидно или незаменяемо поле" });
});

// Добавяне на коментар през детайлния преглед
app.post('/api/ticket/comments', (req: Request, res: Response) => {
  const { text, author } = req.body as { text: string; author?: string };
  const mainTicket = issuesDB.find(i => i.id === 'ISS-1');

  if (!mainTicket) {
    return res.status(404).json({ success: false, message: "Билетът не е намерен" });
  }
  if (!text) {
    return res.status(400).json({ success: false, message: "Празен коментар" });
  }

  const now = new Date();
  const dateStr = `${now.getDate()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} г., ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ч.`;

  const newComment: Comment = {
    id: Date.now(),
    author: author || "Alice Johnson", 
    avatar: (author ? author.charAt(0).toUpperCase() : "A"),
    color: "blue",
    date: dateStr,
    text: text
  };

  if (!mainTicket.comments) mainTicket.comments = [];
  mainTicket.comments.push(newComment);
  mainTicket.updatedAt = new Date().toLocaleDateString('bg-BG');

  res.json({ success: true, comment: newComment });
});

// ==========================================
// --- ЧАСТ 4: ЕНДПОЙНТИ ЗА ИЗВЕСТИЯТА ---
// ==========================================

app.get('/api/notifications', (req: Request, res: Response) => {
  res.json(notificationsDB);
});

app.patch('/api/notifications/read-all', (req: Request, res: Response) => {
  notificationsDB = notificationsDB.map(n => ({ ...n, unread: false }));
  res.json({ success: true, message: "Всички известия са маркирани като прочетени" });
});

app.delete('/api/notifications/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLength = notificationsDB.length;
  
  notificationsDB = notificationsDB.filter(n => n.id !== id);

  if (notificationsDB.length < initialLength) {
    res.json({ success: true, message: "Известието е изтрито успешно" });
  } else {
    res.status(404).json({ success: false, message: "Известието не е намерено" });
  }
});

// ==========================================
// --- СТАРТИРАНЕ НА СЪРВЪРА ---
// ==========================================
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 ОБЕДИНЕН ТS Сървърът стартира успешно!`);
  console.log(`📡 Очаква заявки на: http://localhost:${PORT}`);
  console.log(`==================================================`);
});