import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const db = getDb();
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

router.patch('/read-all', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const db = getDb();
    await db.run('UPDATE Notification SET unread = 0 WHERE userId = ?', [req.userId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при актуализиране' });
  }
});

router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const db = getDb();
    const result = await db.run('DELETE FROM Notification WHERE id = ? AND userId = ?', [req.params.id, req.userId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Известието не е намерено или нямате достъп до него' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Грешка при изтриване на известието' });
  }
});

router.patch('/:id/read', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  try {
    const db = getDb();
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

export default router;