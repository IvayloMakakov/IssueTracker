import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { createNotification, getInterestedParties } from '../services/notifications';
import sanitizeHtml from 'sanitize-html';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Липсва идентификатор (id) на задачата' });
  }

  try {
    const db = getDb();
    const ticket = await db.get('SELECT * FROM Issue WHERE displayId = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ error: 'Задачата не е намерена в базата данни' });
    }

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

    const comments = await db.all('SELECT * FROM Comment WHERE issueId = ? ORDER BY id ASC', [ticket.id]);
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

    res.status(200).json(ticket);
  } catch (error) {
    console.error('Get Ticket Error:', error);
    res.status(500).json({ error: 'Грешка при извличане на детайлите на билета' });
  }
});

router.patch('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  let { id, field, value } = req.body;
  if (field === 'assignee') field = 'assigneeId';

  const allowedFields = ['status', 'priority', 'assigneeId', 'title', 'description'];
  if (!allowedFields.includes(field)) {
    return res.status(400).json({ success: false, message: 'Опит за невалидна операция!' });
  }

  if (typeof value === 'string' && (field === 'title' || field === 'description')) {
    value = sanitizeHtml(value.trim(), { allowedTags: [], allowedAttributes: {} });
  }
  
  try {
    const db = getDb();
    const ticket = await db.get('SELECT * FROM Issue WHERE displayId = ?', [id]);
    if (!ticket) return res.status(404).json({ success: false, message: 'Задачата не е намерена' });

    const currentUserId = req.userId!;
    const oldAssigneeId = ticket.assigneeId;

    const actor = await db.get('SELECT firstName, lastName FROM User WHERE id = ?', [currentUserId]);
    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Някой';
    let systemCommentText = '';

    if (field === 'status') {
      if (ticket.status !== value) {
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
      const newAssigneeId = value === '' ? null : Number(value);
      if (oldAssigneeId !== newAssigneeId) {
        if (newAssigneeId) {
          const newAssignee = await db.get('SELECT firstName, lastName FROM User WHERE id = ?', [newAssigneeId]);
          const targetName = newAssignee ? `${newAssignee.firstName} ${newAssignee.lastName}` : 'Unknown';
          systemCommentText = `[SYSTEM] Потребител ${actorName} назначи задачата на "${targetName}".`;
        } else {
          systemCommentText = `[SYSTEM] Потребител ${actorName} премахна изпълнителя на задачата (Unassigned).`;
        }

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

    const nowIso = new Date().toISOString();
    await db.run(`UPDATE Issue SET ${field} = ?, updatedAt = ? WHERE id = ?`, [value === '' ? null : value, nowIso, ticket.id]);

    if (systemCommentText) {
      await db.run(
        'INSERT INTO Comment (content, authorId, issueId, createdAt) VALUES (?, ?, ?, ?)',
        [systemCommentText, currentUserId, ticket.id, nowIso]
      );
    }

    res.status(200).json({ success: true, message: `Полето ${field} беше обновено.` });
  } catch (error) {
    console.error('PATCH ticket error:', error);
    res.status(500).json({ success: false, message: 'Грешка на сървъра' });
  }
});

router.post('/comments', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { text, issueId } = req.body;

  if (!text?.trim() || !issueId) {
    return res.status(400).json({ error: 'Коментарът не може да бъде празен' });
  }

  const safeText = sanitizeHtml(text.trim(), { allowedTags: [], allowedAttributes: {} });

  try {
    const db = getDb();
    const ticket = await db.get('SELECT id, displayId, creatorId, assigneeId FROM Issue WHERE displayId = ?', [issueId]);
    if (!ticket) return res.status(404).json({ error: 'Задачата не съществува.' });

    const now = new Date();
    const nowIso = now.toISOString();

    const result = await db.run(
      'INSERT INTO Comment (content, authorId, issueId, createdAt) VALUES (?, ?, ?, ?)',
      [safeText, req.userId, ticket.id, nowIso]
    );

    const formattedDate = now.toLocaleString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' ч.';

    res.status(201).json({
      success: true,
      comment: {
        id: result.lastID,
        content: safeText,
        authorId: req.userId,
        issueId: ticket.id,
        createdAt: formattedDate
      }
    });

    const usersToNotify = await getInterestedParties(ticket.id, req.userId!);
    for (const uId of usersToNotify) {
      await createNotification(uId, 'comment', 'Нов коментар', `Беше добавен нов коментар към задача ${ticket.displayId}`, ticket.displayId);
    }
  } catch (error) {
    console.error('Create Comment Error:', error);
    res.status(500).json({ error: 'Вътрешна грешка' });
  }
});

router.delete('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.query; 

  if (!id) {
    return res.status(400).json({ error: 'Липсва идентификатор на задачата за изтриване' });
  }

  try {
    const db = getDb();
    
    let ticketId = Number(id);
    
    if (isNaN(ticketId)) {
      const issue = await db.get('SELECT id FROM Issue WHERE displayId = ?', [id]);
      if (!issue) {
        return res.status(404).json({ error: 'Задачата не е намерена в базата данни' });
      }
      ticketId = issue.id;
    }

    const issueData = await db.get('SELECT displayId FROM Issue WHERE id = ?', [ticketId]);
    if (issueData) {
        await db.run('DELETE FROM Notification WHERE targetId = ?', [issueData.displayId]);
    }

    await db.run('DELETE FROM Comment WHERE issueId = ?', [ticketId]);
    await db.run('DELETE FROM UserFavorite WHERE issueId = ?', [ticketId]);
    
    const result = await db.run('DELETE FROM Issue WHERE id = ?', [ticketId]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Задачата не е намерена или вече е изтрита' });
    }

    res.status(200).json({ success: true, message: 'Задачата е изтрита успешно' });
  } catch (error) {
    console.error('Delete Ticket Error:', error);
    res.status(500).json({ error: 'Сървърна грешка при изтриване на задачата' });
  }
});

export default router;