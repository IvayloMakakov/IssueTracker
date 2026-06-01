// backend/server.ts
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

// Разширяваме Express интерфейса, за да можем безопасно да пренасяме userId през middleware-а
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

app.use(cors());
app.use(express.json());

let db: Database<sqlite3.Database, sqlite3.Statement>;

// Инициализация на връзката с SQLite базата данни
async function initDatabase() {
  db = await open({
    filename: path.join(__dirname, 'data.db'),
    driver: sqlite3.Database
  });
  console.log('Successfully connected to SQLite database (data.db)');
}

// ==========================================
// --- МИДЪЛУЕР ЗА СИГУРНОСТ (MIDDLEWARE) ---
// ==========================================

const requireAuth = (req: Request, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Невалиден или липсващ токен. Моля, влезте в профила си.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; email: string };
    req.userId = decoded.id; // Закачаме ID-то към заявката за следващите ендпоинти
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({ error: 'Сесията е изтекла или е невалидна. Влезте отново.' });
  }
};

// ==========================================
// --- ЧАСТ 1: АВТЕНТИКАЦИЯ (AUTH) ---
// ==========================================
// ОПРАВЕНО: Грешките вече се връщат в ключ "error" за пълна консистентност с фронтенда
// backend/server.ts
app.post('/api/register', async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, email, password } = req.body;

  // Случай при празни полета
  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
    return res.json({ success: false, error: 'Всички полета са задължителни!' });
  }

  try {
    const existingUser = await db.get('SELECT email FROM User WHERE email = ?', [email.toLowerCase().trim()]);
    
    // СЛУЧАЙ: Потребител с този имейл вече съществува
    if (existingUser) {
      return res.json({ success: false, error: 'Потребител с този имейл адрес вече съществува!' });
    }

    // Хеширане на паролата и запис
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    await db.run(
      'INSERT INTO User (firstName, lastName, email, passwordHash) VALUES (?, ?, ?, ?)',
      [firstName.trim(), lastName.trim(), email.toLowerCase().trim(), passwordHash]
    );

    // Успешна регистрация
    res.status(201).json({ success: true, message: 'Потребителят е регистриран успешно!' });
  } catch (error) {
    console.error('Register Error:', error);
    res.json({ success: false, error: 'Вътрешна сървърна грешка при регистрация!' });
  }
});

// backend/server.ts
app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  // Случай при празни полета
  if (!email?.trim() || !password?.trim()) {
    return res.json({ success: false, error: 'Моля, въведете имейл адрес и парола!' });
  }

  try {
    const user = await db.get('SELECT * FROM User WHERE email = ?', [email.toLowerCase().trim()]);
    
    // СЛУЧАЙ 2: Такъв имейл не съществува в системата
    if (!user) {
      return res.json({ success: false, error: 'Не съществува регистриран потребител с този имейл адрес!' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    
    // СЛУЧАЙ 3: Паролата е грешна, но имейлът съществува
    if (!isMatch) {
      return res.json({ success: false, error: 'Въведената парола е невалидна! Моля, опитайте отново.' });
    }
    
    // СЛУЧАЙ 1: Всичко съответства и той се логва успешно
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      success: true,
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.json({ success: false, error: 'Възникна вътрешна грешка в сървъра при вход!' });
  }
});

app.get('/api/me', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await db.get('SELECT id, firstName, lastName, email FROM User WHERE id = ?', [req.userId]);    
    if (!user) {
      return res.status(404).json({ error: 'Потребителят не е намерен' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Грешка при извличане на профила' });
  }
});

app.put('/api/me', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, currentPassword, newPassword } = req.body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({ error: 'Името и фамилията не могат да бъдат празни' });
  }

  try {
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Въведете текущата си парола, за да я промените' });
      }

      const user = await db.get('SELECT passwordHash FROM User WHERE id = ?', [req.userId]);
      if (!user) return res.status(404).json({ error: 'Потребителят не е намерен' });

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ error: 'Въведената текуща парола е грешна!' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await db.run(
        'UPDATE User SET firstName = ?, lastName = ?, passwordHash = ? WHERE id = ?',
        [firstName.trim(), lastName.trim(), newPasswordHash, req.userId]
      );
    } else {
      await db.run(
        'UPDATE User SET firstName = ?, lastName = ? WHERE id = ?',
        [firstName.trim(), lastName.trim(), req.userId]
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Грешка при обновяване на профила' });
  }
});

// ==========================================
// --- ЧАСТ 2: ЕНДПОИНТИ ЗА ЗАДАЧИТЕ (ISSUES) ---
// ==========================================

app.get('/api/issues', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch (e) {
        // Остава null при невалиден токен (публичен достъп)
      }
    }

    const rows = await db.all(`
      SELECT i.*, u.firstName, u.lastName,
             CASE WHEN uf.userId IS NOT NULL THEN 1 ELSE 0 END as isFav
      FROM Issue i
      LEFT JOIN User u ON i.assigneeId = u.id
      LEFT JOIN UserFavorite uf ON i.id = uf.issueId AND uf.userId = ?
      ORDER BY i.id DESC
    `, [userId]);

    
    const formattedIssues = rows.map(row => {
  // Подсигуряваме правилно конвертиране, независимо дали датата е ISO низ или SQLite timestamp
  const dateObj = new Date(row.updatedAt);
  
  // Проверяваме дали датата е валидна, преди да я форматираме
  const formattedDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' ч.'
    : row.updatedAt; // Връщаме оригиналния запис като резервен вариант при аномалия

  return {
    id: row.displayId || `ISSUE-${row.id}`,
    title: row.title,
    type: row.type,
    status: row.status,
    priority: row.priority,
    updatedAt: formattedDate, // ТУК подаваме вече красиво форматирания низ с час и минути
    isFavorite: row.isFav === 1,
    creatorId: row.creatorId,
    assignee: row.assigneeId ? {
      name: `${row.firstName} ${row.lastName}`,
      initial: `${row.firstName[0]}${row.lastName[0]}`.toUpperCase()
    } : null
  };
});

    res.json(formattedIssues);
  } catch (error) {
    console.error('Get Issues Error:', error);
    res.status(500).json({ error: 'Грешка при извличане на задачите' });
  }
});

app.post('/api/issues', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { title, description, type, priority, status, assigneeName } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: 'Заглавието е задължително поле!' });
  }

  try {
    let assigneeId: number | null = null;
    if (assigneeName && assigneeName !== 'unassigned') {
      const user = await db.get("SELECT id FROM User WHERE (firstName || ' ' || lastName) = ?", [assigneeName.trim()]);
      if (user) assigneeId = user.id;
    }

    const lastIssue = await db.get("SELECT displayId FROM Issue ORDER BY id DESC LIMIT 1");
    let nextId = 1;
    if (lastIssue && lastIssue.displayId) {
      const lastNumber = parseInt(lastIssue.displayId.replace('ISS-', ''), 10);
      if (!isNaN(lastNumber)) nextId = lastNumber + 1;
    }

    const displayId = `ISS-${nextId}`;
    const nowIso = new Date().toISOString();

    await db.run(
      `INSERT INTO Issue (displayId, title, description, type, status, priority, creatorId, assigneeId, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [displayId, title.trim(), description || "", type || "Task", status || "To Do", priority || "Medium", req.userId, assigneeId, nowIso, nowIso]
    );

    // ТЕСТОВА ФУНКЦИЯ: Праща известие на СЕГАШНИЯ потребител при създаване на ново issue
    await createNotification(
      req.userId!,
      'assignment',
      'Успешно създадена задача',
      `Вие успешно създадохте нова задача: ${displayId} - "${title.trim()}"`,
      displayId
    );

    // Ако задачата е разпределена веднага на друг колега, пращаме известие и на него (Изискване 4)
    if (assigneeId && assigneeId !== req.userId) {
      await createNotification(
        assigneeId,
        'assignment',
        'Назначена задача',
        `Бяхте назначен като изпълнител на задача ${displayId}`,
        displayId
      );
    }

    res.status(201).json({ id: displayId, title, type, status, priority, creatorId: req.userId, assignee: assigneeName !== 'unassigned' ? { name: assigneeName, initial: assigneeName.split(' ').map((n: string) => n[0]).join('').toUpperCase() } : null, updatedAt: new Date().toLocaleDateString('bg-BG'), isFavorite: false });
  } catch (error) {
    console.error('Create Issue Error:', error);
    res.status(500).json({ error: 'Неуспешно записване в базата данни' });
  }
});

app.post('/api/issues/favorite', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { issueDisplayId } = req.body;

  if (!issueDisplayId) {
    return res.status(400).json({ error: 'Липсва идентификатор на задачата' });
  }

  try {
    const issue = await db.get('SELECT id FROM Issue WHERE displayId = ?', [issueDisplayId]);
    if (!issue) {
      return res.status(404).json({ error: 'Задачата не е намерена' });
    }

    const existingFav = await db.get(
      'SELECT * FROM UserFavorite WHERE userId = ? AND issueId = ?',
      [req.userId, issue.id]
    );

    if (existingFav) {
      await db.run('DELETE FROM UserFavorite WHERE userId = ? AND issueId = ?', [req.userId, issue.id]);
      return res.json({ success: true, isFavorite: false });
    } else {
      await db.run('INSERT INTO UserFavorite (userId, issueId) VALUES (?, ?)', [req.userId, issue.id]);
      return res.json({ success: true, isFavorite: true });
    }
  } catch (error) {
    console.error('Favorite Toggle Error:', error);
    return res.status(500).json({ error: 'Грешка при обработка на операцията' });
  }
});

// ==========================================
// --- ЧАСТ 3: ЕНДПОИНТИ ЗА TICKET ДЕТАЙЛИ ---
// ==========================================

app.get('/api/users', async (req: Request, res: Response): Promise<any> => {
  try {
    const users = await db.all('SELECT id, firstName, lastName FROM User ORDER BY firstName ASC');
    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ error: 'Грешка на сървъра при извличане на потребители' });
  }
});

app.get('/api/ticket', async (req: Request, res: Response): Promise<any> => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Липсва идентификатор (id) на задачата' });
  }

  try {
    const ticket = await db.get('SELECT * FROM Issue WHERE displayId = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Задачата не е намерена в базата данни' });
    }

    // --- НОВО: Красиво форматиране на датата на последна промяна ---
    const dateObj = new Date(ticket.updatedAt);
    if (!isNaN(dateObj.getTime())) {
      ticket.updatedAt = dateObj.toLocaleString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' ч.';
    }
    // -------------------------------------------------------------

    const comments = await db.all('SELECT * FROM Comment WHERE issueId = ? ORDER BY id ASC', [ticket.id]);
    
    // Форматираме датите на коментарите консистентно
    ticket.comments = comments.map(c => {
      const cDate = new Date(c.createdAt);
      return {
        ...c,
        createdAt: !isNaN(cDate.getTime()) 
          ? cDate.toLocaleString('bg-BG', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) + ' ч.'
          : c.createdAt
      };
    });

    res.json(ticket);
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res.status(500).json({ error: 'Грешка при извличане на детайлите на билета' });
  }
});

app.patch('/api/ticket', requireAuth, async (req: Request, res: Response): Promise<any> => {
  let { id, field, value } = req.body; 
  if (field === 'assignee') field = 'assigneeId';

  try {
    const ticket = await db.get('SELECT * FROM Issue WHERE displayId = ?', [id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Задачата не е намерена' });

    const currentUserId = req.userId!;
    const oldAssigneeId = ticket.assigneeId;

    // Взимаме имената на потребителя, който прави промяната в момента (Изискване 2)
    const actor = await db.get('SELECT firstName, lastName FROM User WHERE id = ?', [currentUserId]);
    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : "Някой";
    let systemCommentText = "";

    if (field === 'status') {
      if (ticket.status !== value) {
        // БЕЗ ЕМОДЖИТА: Използваме ясен структуриран текст с префикс
        systemCommentText = `[SYSTEM] Потребител ${actorName} промени статуса на "${value}".`;
        const usersToNotify = await getInterestedParties(ticket.id, currentUserId);
        for (const uId of usersToNotify) {
          await createNotification(uId, 'status', 'Промяна на статус', `Статусът на задача ${id} беше променен на "${value}"`, id);
        }
      }
    } else if (field === 'priority') {
      if (ticket.priority !== value) {
        systemCommentText = `[SYSTEM] Потребител ${actorName} промени приоритета на "${value}".`;
        const usersToNotify = await getInterestedParties(ticket.id, currentUserId);
        for (const uId of usersToNotify) {
          await createNotification(uId, 'status', 'Промяна на приоритет', `Приоритетът на задача ${id} беше променен на "${value}"`, id);
        }
      }
    } else if (field === 'assigneeId') {
      const newAssigneeId = value === "" ? null : Number(value);
      if (oldAssigneeId !== newAssigneeId) {
        if (newAssigneeId) {
          const newAssignee = await db.get('SELECT firstName, lastName FROM User WHERE id = ?', [newAssigneeId]);
          const targetName = newAssignee ? `${newAssignee.firstName} ${newAssignee.lastName}` : "Unknown";
          systemCommentText = `[SYSTEM] Потребител ${actorName} назначи задачата на "${targetName}".`;
        } else {
          systemCommentText = `[SYSTEM] Потребител ${actorName} премахна изпълнителя на задачата (Unassigned).`;
        }

        // Известия
        if (oldAssigneeId && oldAssigneeId !== currentUserId) {
          await createNotification(oldAssigneeId, 'assignment', 'Премахнат изпълнител', `Вече не сте изпълнител на задача ${id}`, id);
        }
        if (newAssigneeId && newAssigneeId !== currentUserId) {
          await createNotification(newAssigneeId, 'assignment', 'Назначена задача', `Бяхте назначен като изпълнител на задача ${id}`, id);
        }
        if (ticket.creatorId && ticket.creatorId !== currentUserId && ticket.creatorId !== newAssigneeId) {
          await createNotification(ticket.creatorId, 'assignment', 'Нов изпълнител', `Задача ${id} има нов назначен изпълнител.`, id);
        }
      }
    }

    // Изпълнение на реалния запис на промяната по тикета
    const nowIso = new Date().toISOString();
    await db.run(`UPDATE Issue SET ${field} = ?, updatedAt = ? WHERE id = ?`, [value === "" ? null : value, nowIso, ticket.id]);

    // Записваме системния коментар с authorId = 0 (Системен лог)
    if (systemCommentText) {
      await db.run(
        'INSERT INTO Comment (content, authorId, issueId, createdAt) VALUES (?, 0, ?, ?)',
        [systemCommentText, ticket.id, nowIso]
      );
    }

    res.json({ success: true, message: `Полето ${field} беше обновено.` });
  } catch (error) {
    console.error('PATCH ticket error:', error);
    res.status(500).json({ success: false, message: 'Грешка на сървъра' });
  }
});

app.post('/api/ticket/comments', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { text, issueId } = req.body;

  if (!text?.trim() || !issueId) {
    return res.status(400).json({ error: 'Коментарът не може да бъде празен' });
  }

  try {
    const ticket = await db.get('SELECT id, displayId, creatorId, assigneeId FROM Issue WHERE displayId = ?', [issueId]);
    if (!ticket) return res.status(404).json({ error: 'Задачата не съществува.' });

    const now = new Date();
    const nowIso = now.toISOString();

    const result = await db.run(
      'INSERT INTO Comment (content, authorId, issueId, createdAt) VALUES (?, ?, ?, ?)',
      [text.trim(), req.userId, ticket.id, nowIso]
    );

    // Красив формат за UI веднага без рефреш (Изискване 1)
    const formattedDate = now.toLocaleString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' ч.';
    
    res.json({ 
      success: true, 
      comment: { 
        id: result.lastID, 
        content: text.trim(), 
        authorId: req.userId, 
        issueId: ticket.id,
        createdAt: formattedDate // Връщаме форматираната дата с час веднага
      } 
    });

    // Известяване на свързаните лица (съществуващата ти логика)
    const usersToNotify = await getInterestedParties(ticket.id, req.userId!);
    for (const uId of usersToNotify) {
      await createNotification(uId, 'comment', 'Нов коментар', `Беше добавен нов коментар към задача ${ticket.displayId}`, ticket.displayId);
    }
  } catch (error) {
    console.error('Create Comment Error:', error);
    res.status(500).json({ error: 'Вътрешна грешка' });
  }
});


// ================================================
// --- ПОМОЩНА ФУНКЦИЯ ЗА СЪЗДАВАНЕ НА ИЗВЕСТИЯ ---
// ================================================

async function createNotification(userId: number, type: string, title: string, desc: string, targetId: string) {
  try {
    await db.run(
      `INSERT INTO Notification (userId, type, title, desc, targetId, unread, createdAt) 
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
      [userId, type, title, desc, targetId]
    );
  } catch (err) {
    console.error('Failed to insert notification into DB:', err);
  }
}

// Помощна функция за намиране на всички заинтересовани лица по задача
async function getInterestedParties(issueId: number, currentUserId: number): Promise<number[]> {
  const issue = await db.get('SELECT creatorId, assigneeId FROM Issue WHERE id = ?', [issueId]);
  const ids = new Set<number>();
  if (issue) {
    if (issue.creatorId && issue.creatorId !== currentUserId) ids.add(issue.creatorId);
    if (issue.assigneeId && issue.assigneeId !== currentUserId) ids.add(issue.assigneeId);
  }
  return Array.from(ids);
}

// ==========================================
// --- ЧАСТ 4: ЕНДПОИНТИ ЗА ИЗВЕСТИЯТА ---
// ==========================================

app.get('/api/notifications', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const rows = await db.all('SELECT * FROM Notification WHERE userId = ? ORDER BY id DESC LIMIT 50', [req.userId]);
    const formatted = rows.map(r => ({
      id: String(r.id),
      type: r.type,
      title: r.title,
      desc: r.desc,
      date: new Date(r.createdAt).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(r.createdAt).toLocaleDateString('bg-BG'),
      targetId: r.targetId,
      unread: r.unread === 1
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Грешка при зареждане на известията' });
  }
});

app.patch('/api/notifications/read-all', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    await db.run('UPDATE Notification SET unread = 0 WHERE userId = ?', [req.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при актуализиране' });
  }
});

// НОВ ЕНДПОИНТ: Изтриване на конкретна нотификация по ID (Изискване 3)
app.delete('/api/notifications/:id', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await db.run('DELETE FROM Notification WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Известието не е намерено или нямате достъп до него' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при изтриване на известието' });
  }
});

// НОВ ЕНДПОИНТ: Маркиране на ЕДИНИЧНО известие като прочетено по неговото ID
app.patch('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    // Подсигуряваме се, че потребителят променя само собственото си известие
    const result = await db.run(
      'UPDATE Notification SET unread = 0 WHERE id = ? AND userId = ?',
      [id, req.userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Известието не е намерено или нямате достъп' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Single Notification Read Error:', error);
    res.status(500).json({ error: 'Грешка при обновяване на известието' });
  }
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