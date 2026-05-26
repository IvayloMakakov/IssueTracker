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
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
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

// Ендпоинт за проверка на текущия потребител чрез JWT токен
app.get('/api/me', async (req: Request, res: Response): Promise<any> => {
  try {
    // 1. Взимаме токена от Authorization хедъра (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Невалиден или липсващ токен' });
    }

    const token = authHeader.split(' ')[1];

    // 2. Верифицираме токена с нашия таен ключ
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };

    // 3. Търсим потребителя в базата данни по ID
    const user = await db.get('SELECT firstName, lastName, email FROM User WHERE id = ?', [decoded.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Потребителят не е намерен' });
    }

    // 4. Връщаме данните на потребителя
    res.json(user);

  } catch (error) {
    console.error('Грешка при верификация на токен:', error);
    res.status(401).json({ error: 'Сесията е изтекла или е невалидна' });
  }
});

app.put('/api/me', async (req: Request, res: Response): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Няма токен' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };

    const { firstName, lastName, currentPassword, newPassword } = req.body;
    
    if (newPassword) {
      // 1. Вземаме текущия хеш от базата данни
      const user = await db.get('SELECT passwordHash FROM User WHERE id = ?', [decoded.id]);
      if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

      // 2. Проверяваме дали въведената текуща парола е вярна
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Въведената текуща парола е грешна!' });
      }

      // 3. Хешираме и записваме новата
      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.run(
        'UPDATE User SET firstName = ?, lastName = ?, passwordHash = ? WHERE id = ?',
        [firstName, lastName, newPasswordHash, decoded.id]
      );
    } else {
      // Само смяна на имената, ако не е въведена нова парола
      await db.run(
        'UPDATE User SET firstName = ?, lastName = ? WHERE id = ?',
        [firstName, lastName, decoded.id]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Грешка при запис в базата данни' });
  }
});

// ==========================================
// --- ЧАСТ 2: ЕНДПОИНТИ ЗА ЗАДАЧИТЕ (ISSUES) ---
// ==========================================

app.get('/api/issues', async (req: Request, res: Response) => {
  try {
    const rows = await db.all(`
      SELECT i.*, u.firstName, u.lastName 
      FROM Issue i
      LEFT JOIN User u ON i.assigneeId = u.id
    `);

    const formattedIssues = rows.map(row => {
      return {
        id: row.displayId || `ISSUE-${row.id}`,
        title: row.title,
        type: row.type,
        status: row.status,
        priority: row.priority,
        updatedAt: row.updatedAt,
        isFavorite: !!row.isFavorite,
        // Създаваме assignee обекта САМО ако имаме валиден потребител
        assignee: (row.assigneeId) ? {
          name: `${row.firstName} ${row.lastName}`,
          initial: `${row.firstName[0]}${row.lastName[0]}`.toUpperCase()
        } : null
      };
    });

    res.json(formattedIssues);
  } catch (error) {
    console.error('Грешка в /api/issues:', error);
    res.status(500).json({ error: 'Грешка при извличане на задачите' });
  }
});

app.post('/api/issues', async (req: Request, res: Response): Promise<any> => {
  // 1. ИЗВЛИЧАМЕ И ВАЛИДИРАМЕ ТОКЕНА
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Няма токен' });

  let creatorId: number;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    creatorId = decoded.id; // 2. ТОВА Е РЕАЛНОТО ID НА ТЕКУЩИЯ ПОТРЕБИТЕЛ!
  } catch (error) {
    return res.status(401).json({ error: 'Невалиден или изтекъл токен' });
  }

  const { title, type, priority, status, assigneeName } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Заглавието е задължително поле!' });
  }

  try {
    // 3. Намираме ID-то на потребителя, ако е избран изпълнител (Assignee)
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

    // 4. Генерираме следващия displayId (напр. ISS-1, ISS-2...)
    const countResult = await db.get('SELECT COUNT(*) as count FROM Issue');
    const nextId = (countResult?.count || 0) + 1;
    const displayId = `ISS-${nextId}`;

    const nowIso = new Date().toISOString();

    // 5. Записваме задачата с истинския creatorId
    await db.run(
      `INSERT INTO Issue (displayId, title, type, status, priority, creatorId, assigneeId, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [displayId, title, type, status, priority, creatorId, assigneeId, nowIso, nowIso]
    );

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

// backend/server.ts
app.get('/api/ticket', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.query; // Взимаме id-то от URL-а (Query параметр)

  if (!id) {
    return res.status(400).json({ error: 'Липсва идентификатор (id) на задачата' });
  }

  try {
    // Вземаме конкретния билет по неговия displayId (напр. ISS-1)
    const ticket = await db.get('SELECT * FROM Issue WHERE displayId = ?', [id]);
    
    if (!ticket) {
      return res.status(404).json({ error: 'Задачата не е намерена в базата данни' });
    }

    // Взимаме коментарите, които принадлежат на това конкретно issueId
    const comments = await db.all('SELECT * FROM Comment WHERE issueId = ?', [ticket.id]);
    ticket.comments = comments;

    res.json(ticket);
  } catch (error) {
    console.error('Грешка при извличане на билета:', error);
    res.status(500).json({ error: 'Грешка при извличане на билета' });
  }
});

app.patch('/api/ticket', async (req: Request, res: Response): Promise<any> => {
  // 1. ВЕЧЕ ОЧАКВАМЕ 'id' В ЗАЯВКАТА
  let { id, field, value } = req.body; 

  // 2. ДОБАВЯМЕ 'isFavorite' В ПОЗВОЛЕНИТЕ ПОЛЕТА
  const allowedFields = ['title', 'description', 'status', 'priority', 'assignee', 'assigneeId', 'isFavorite'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: 'Невалидно поле за обновяване' });
  }

  try {
    if (field === 'assignee') {
      field = 'assigneeId';
      value = (value === "" || value === undefined) ? null : Number(value);
    }

    // 3. ТЪРСИМ ЗАДАЧАТА ПО displayId (напр. ISS-1), А НЕ С LIMIT 1
    const ticket = await db.get('SELECT id, status FROM Issue WHERE displayId = ?', [id]);
    
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Задачата не е намерена' });
    }

    if (field === 'status' && value === 'Done') {
      const currentTicket = await db.get('SELECT assigneeId FROM Issue WHERE id = ?', [ticket.id]);
      if (!currentTicket || currentTicket.assigneeId === null) {
        return res.status(400).json({ error: 'Error', message: 'Не можете да завършите задача без изпълнител!' });
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