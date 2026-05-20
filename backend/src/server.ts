// backend/server.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

// Инициализация на променлива за връзка с базата данни
let db: Database<sqlite3.Database, sqlite3.Statement>;

// Функция за свързване с SQLite файла data.db
async function initDatabase() {
  db = await open({
    filename: path.join(__dirname, 'data.db'), // Път до твоя data.db файл
    driver: sqlite3.Database
  });
  console.log('Successfully connected to SQLite database (data.db)');
}

// ==========================================
// --- ЧАСТ 1: АВТЕНТИКАЦИЯ (AUTH) ---
// ==========================================

app.post('/api/register', async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Всички полета са задължителни' });
  }

  try {
    // Проверка за съществуващ потребител
    const existingUser = await db.get('SELECT email FROM User WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Потребителят вече съществува' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    
    // Запис в SQLite таблицата User
    await db.run(
      'INSERT INTO User (firstName, lastName, email, passwordHash) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, passwordHash]
    );

    res.status(201).json({ success: true, message: 'Потребителят е регистриран успешно' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Вътрешна сървърна грешка' });
  }
});

app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    const user = await db.get('SELECT * FROM User WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ success: false, message: 'Невалиден имейл или парола' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Невалиден имейл или парола' });
    }

    const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { firstName: user.firstName, lastName: user.lastName, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Грешка при вход' });
  }
});

// ==========================================
// --- ЧАСТ 2: ЕНДПОИНТИ ЗА ЗАДАЧИТЕ (ISSUES) ---
// ==========================================

app.get('/api/issues', async (req: Request, res: Response) => {
  try {
    // Правим JOIN с User таблицата, за да извадим данните за изпълнителя (Assignee)
    const rows = await db.all(`
      SELECT i.*, u.firstName, u.lastName 
      FROM Issue i
      LEFT JOIN User u ON i.assigneeId = u.id
    `);

    // Форматираме обекта, за да пасне на очакванията на фронтенда (mainPageApi.ts)
    const formattedIssues = rows.map(row => ({
      id: row.displayId || `ISSUE-${row.id}`,
      title: row.title,
      type: row.type,
      status: row.status,
      priority: row.priority,
      updatedAt: row.updatedAt,
      isFavorite: !!row.isFavorite,
      assignee: row.assigneeId ? {
        name: `${row.firstName} ${row.lastName}`,
        initial: `${row.firstName[0]}${row.lastName[0]}`
      } : null
    }));

    res.json(formattedIssues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при извличане на задачите' });
  }
});

app.post('/api/issues', async (req: Request, res: Response): Promise<any> => {
  const { title, type, priority, status, assigneeName } = req.body;

  // Валидация за заглавие
  if (!title) {
    return res.status(400).json({ error: 'Заглавието е задължително поле!' });
  }

  try {
    // 1. Намираме ID-то на потребителя, ако е избран изпълнител (Assignee)
    let assigneeId: number | null = null;
    if (assigneeName && assigneeName !== 'unassigned') {
      const user = await db.get(
        "SELECT id FROM User WHERE (firstName || ' ' || lastName) = ?", 
        [assigneeName]
      );
      if (user) {
        assigneeId = user.id;
      }
    }

    // 2. Взимаме първия наличен потребител за създател (creatorId), за да не е празен
    const defaultCreator = await db.get('SELECT id FROM User LIMIT 1');
    const creatorId = defaultCreator ? defaultCreator.id : 1;

    // 3. Генерираме следващия displayId (напр. ISS-1, ISS-2...)
    const countResult = await db.get('SELECT COUNT(*) as count FROM Issue');
    const nextId = (countResult?.count || 0) + 1;
    const displayId = `ISS-${nextId}`;

    // Текущо време в ISO формат за създаване и обновяване
    const nowIso = new Date().toISOString();

    // 4. Записваме задачата в таблицата Issue
    await db.run(
      `INSERT INTO Issue (displayId, title, type, status, priority, creatorId, assigneeId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [displayId, title, type, status, priority, creatorId, assigneeId, nowIso, nowIso]
    );

    // 5. Връщаме обекта обратно към фронтенда, форматиран точно както го очаква State-а
    // ФИКСИРАНО: Добавен е изричен тип (n: string) в .map(), за да изчезне ts(7006) грешката
    const newIssue = {
      id: displayId,
      title,
      type,
      status,
      priority,
      assignee: assigneeName && assigneeName !== 'unassigned' ? {
        name: assigneeName,
        initial: assigneeName.split(' ').map((n: string) => n[0]).join('').toUpperCase()
      } : null,
      updatedAt: new Date().toLocaleDateString('bg-BG'),
      isFavorite: false
    };

    res.status(201).json(newIssue);
  } catch (error) {
    console.error('Грешка при създаване на задача:', error);
    res.status(500).json({ error: 'Неуспешно записване в базата данни' });
  }
});

// ==========================================
// --- ЧАСТ 3: ЕНДПОИНТИ ЗА TICKET ДЕТАЙЛИ ---
// ==========================================

app.get('/api/users', async (req: Request, res: Response): Promise<any> => {
  try {
    // Взимаме ID-то и имената на всички потребители за падащото меню
    const users = await db.all('SELECT id, firstName, lastName FROM User');
    res.json(users);
  } catch (error) {
    console.error('Грешка при извличане на потребителите:', error);
    res.status(500).json({ success: false, error: 'Грешка на сървъра' });
  }
});

app.get('/api/ticket', async (req: Request, res: Response): Promise<any> => {
  try {
    // Вземаме първия наличен билет от базата
    const ticket = await db.get('SELECT * FROM Issue LIMIT 1');
    if (!ticket) {
      return res.status(404).json({ error: 'Няма налични задачи' });
    }

    // Взимаме всички коментари за този конкретен билет.
    // Фронтендът сам намира името на потребителя по коментарния 'authorId'.
    const comments = await db.all('SELECT * FROM Comment WHERE issueId = ?', [ticket.id]);
    ticket.comments = comments;

    res.json(ticket);
  } catch (error) {
    console.error('Грешка при извличане на билета:', error);
    res.status(500).json({ error: 'Грешка при извличане на билета' });
  }
});

app.patch('/api/ticket', async (req: Request, res: Response): Promise<any> => {
  let { field, value } = req.body;

  // Позволяваме полетата за обновяване
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'assigneeId'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: 'Невалидно поле за обновяване' });
  }

  try {
    // Коригиране на полето от фронтенда към реалната SQL колона
    if (field === 'assignee') {
      field = 'assigneeId';
      if (value === "" || value === undefined) {
        value = null;
      } else {
        value = Number(value);
      }
    }

    const ticket = await db.get('SELECT id, status FROM Issue LIMIT 1');
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Задачата не е намерена' });
    }

    // SQL Тригер проверка за Done статус без изпълнител
    if (field === 'status' && value === 'Done') {
      const currentTicket = await db.get('SELECT assigneeId FROM Issue WHERE id = ?', [ticket.id]);
      if (!currentTicket || currentTicket.assigneeId === null) {
        return res.status(400).json({ 
          error: 'Error', 
          message: 'Не можете да завършите задача (Done) без назначен изпълнител!' 
        });
      }
    }

    await db.run(
      `UPDATE Issue SET ${field} = ? WHERE id = ?`,
      [value, ticket.id]
    );

    res.json({ success: true, message: `Полето ${field} беше обновено успешно.` });
  } catch (error) {
    console.error('Грешка при обновяване на полето в базата:', error);
    res.status(500).json({ success: false, message: 'Грешка на сървъра при обновяване' });
  }
});

// Добавяне на коментар в базата данни
app.post('/api/ticket/comments', async (req: Request, res: Response) => {
  const { text, authorId, issueId } = req.body;
  try {
    // Взимаме първото issue, ако фронтендът не е подал конкретно issueId
    let targetIssueId = issueId;
    if (!targetIssueId) {
      const currentTicket = await db.get('SELECT id FROM Issue LIMIT 1');
      targetIssueId = currentTicket ? currentTicket.id : 1;
    }

    // Записваме с правилното числово authorId и issueId
    const result = await db.run(
      'INSERT INTO Comment (content, authorId, issueId, createdAt) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [text, authorId || 1, targetIssueId]
    );
    
    res.json({ 
      success: true, 
      comment: { 
        id: result.lastID, 
        content: text, 
        authorId: authorId || 1, 
        issueId: targetIssueId,
        createdAt: new Date().toLocaleDateString('bg-BG') 
      } 
    });
  } catch (error) {
    console.error('Грешка при запис на коментар:', error);
    res.status(500).json({ error: 'Грешка при запис на коментара' });
  }
});

// ==========================================
// --- ЧАСТ 4: ЕНДПОИНТИ ЗА ИЗВЕСТИЯТА ---
// ==========================================

app.get('/api/notifications', async (req: Request, res: Response) => {
  // Неактивен за момента код
});

app.patch('/api/notifications/read-all', async (req: Request, res: Response) => {
  // Неактивен за момента код
});

// ==========================================
// --- СТАРТИРАНЕ НА СЪРВЪРА ---
// ==========================================

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database before starting server:', err);
});