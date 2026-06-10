import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { getDb } from '../db';
import { requireAuth } from '../middleware/auth';
import { JWT_SECRET, SALT_ROUNDS } from '../config';
import sanitizeHtml from 'sanitize-html';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Твърде много опити. Моля, опитайте отново след малко.' },
});

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_SYMBOL_RE = /[.,!?@#$%^&*()_\-+=\[\]{};:'"\\|<>/~`]/;

function validateEmail(email: string): string | null {
  if (!EMAIL_RE.test(email)) return 'Моля, въведете валиден имейл адрес!';
  return null;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Паролата трябва да бъде поне 8 символа дълга!';
  if (!/[A-Z]/.test(password)) return 'Паролата трябва да съдържа поне една главна буква!';
  if (!/[a-z]/.test(password)) return 'Паролата трябва да съдържа поне една малка буква!';
  if (!PASSWORD_SYMBOL_RE.test(password)) return 'Паролата трябва да съдържа поне един специален символ (напр. . , ! ? @)';
  return null;
}

router.post('/register', authLimiter, async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, error: 'Всички полета са задължителни!' });
  }

  const emailErr = validateEmail(email.trim());
  if (emailErr) {
    return res.status(400).json({ success: false, error: emailErr });
  }

  const passwordErr = validatePassword(password);
  if (passwordErr) {
    return res.status(400).json({ success: false, error: passwordErr });
  }

  const safeFirstName = sanitizeHtml(firstName.trim(), { allowedTags: [], allowedAttributes: {} });
  const safeLastName = sanitizeHtml(lastName.trim(), { allowedTags: [], allowedAttributes: {} });

  try {
    const db = getDb();
    const existingUser = await db.get('SELECT email FROM User WHERE email = ?', [email.toLowerCase().trim()]);

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Потребител с този имейл адрес вече съществува!' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const normalizedEmail = email.toLowerCase().trim();
    const result = await db.run(
      'INSERT INTO User (firstName, lastName, email, passwordHash) VALUES (?, ?, ?, ?)',
      [safeFirstName, safeLastName, normalizedEmail, passwordHash]
    );

    const userId = result.lastID;
    const token = jwt.sign({ id: userId, email: normalizedEmail }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Потребителят е регистриран успешно!',
      token,
      user: { id: userId, firstName: firstName.trim(), lastName: lastName.trim(), email: normalizedEmail }
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, error: 'Вътрешна сървърна грешка при регистрация!' });
  }
});

router.post('/login', authLimiter, async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ success: false, error: 'Моля, въведете имейл адрес и парола!' });
  }

  try {
    const db = getDb();
    const user = await db.get('SELECT * FROM User WHERE email = ?', [email.toLowerCase().trim()]);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Не съществува регистриран потребител с този имейл адрес!' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Въведената парола е невалидна! Моля, опитайте отново.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, error: 'Възникна вътрешна грешка в сървъра при вход!' });
  }
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<any> => {
  try {
    const db = getDb();
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

router.put('/me', requireAuth, async (req: Request, res: Response): Promise<any> => {
  const { firstName, lastName, currentPassword, newPassword } = req.body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({ error: 'Името и фамилията не могат да бъдат празни' });
  }

  const safeFirstName = sanitizeHtml(firstName.trim(), { allowedTags: [], allowedAttributes: {} });
  const safeLastName = sanitizeHtml(lastName.trim(), { allowedTags: [], allowedAttributes: {} });

  try {
    const db = getDb();
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
        [safeFirstName, safeLastName, newPasswordHash, req.userId]
      );
    } else {
      await db.run(
        'UPDATE User SET firstName = ?, lastName = ? WHERE id = ?',
        [safeFirstName, safeLastName, req.userId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Грешка при обновяване на профила' });
  }
});

export default router;