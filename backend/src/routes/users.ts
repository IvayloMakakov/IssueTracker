import { Router, Request, Response } from 'express';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const db = getDb();
    const users = await db.all('SELECT id, firstName, lastName FROM User ORDER BY firstName ASC');
    res.json(users);
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({ error: 'Грешка на сървъра при извличане на потребители' });
  }
});

export default router;