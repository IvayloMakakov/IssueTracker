import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { JWT_SECRET } from '../config';
import { createNotification } from '../services/notifications';
import sanitizeHtml from 'sanitize-html';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch (e) {
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
      const dateObj = new Date(row.updatedAt);
      const formattedDate = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleString('bg-BG', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' ч.'
        : row.updatedAt;

      return {
        id: row.displayId || `ISSUE-${row.id}`,
        title: row.title,
        type: row.type,
        status: row.status,
        priority: row.priority,
        updatedAt: formattedDate,
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

router.post('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { title, description, type, priority, status, assigneeName } = req.body;

  if (!title?.trim()) {
    return res.status(400).json({ error: 'Заглавието е задължително поле!' });
  }

  const safeTitle = sanitizeHtml(title.trim(), { allowedTags: [], allowedAttributes: {} });
  const safeDescription = description ? sanitizeHtml(description.trim(), { allowedTags: [], allowedAttributes: {} }) : '';

  try {
    const db = getDb();
    let assigneeId: number | null = null;
    if (assigneeName && assigneeName !== 'unassigned') {
      const user = await db.get("SELECT id FROM User WHERE (firstName || ' ' || lastName) = ?", [assigneeName.trim()]);
      if (user) assigneeId = user.id;
    }

    const lastIssue = await db.get('SELECT displayId FROM Issue ORDER BY id DESC LIMIT 1');
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
      [displayId, safeTitle, safeDescription, type || 'Task', status || 'To Do', priority || 'Medium', req.userId, assigneeId, nowIso, nowIso]
    );

    await createNotification(
      req.userId!,
      'assignment',
      'Успешно създадена задача',
      `Вие успешно създадохте нова задача: ${displayId} - "${safeTitle}"`,
      displayId
    );

    if (assigneeId && assigneeId !== req.userId) {
      await createNotification(
        assigneeId,
        'assignment',
        'Назначена задача',
        `Бяхте назначен като изпълнител на задача ${displayId}`,
        displayId
      );
    }

    res.status(201).json({
      id: displayId,
      title: safeTitle,
      type,
      status,
      priority,
      creatorId: req.userId,
      assignee: assigneeName !== 'unassigned'
        ? { name: assigneeName, initial: assigneeName.split(' ').map((n: string) => n[0]).join('').toUpperCase() }
        : null,
      updatedAt: new Date().toLocaleDateString('bg-BG'),
      isFavorite: false
    });
  } catch (error) {
    console.error('Create Issue Error:', error);
    res.status(500).json({ error: 'Неуспешно записване в базата данни' });
  }
});

router.post('/favorite', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { issueDisplayId } = req.body;

  if (!issueDisplayId) {
    return res.status(400).json({ error: 'Липсва идентификатор на задачата' });
  }

  try {
    const db = getDb();
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

export default router;