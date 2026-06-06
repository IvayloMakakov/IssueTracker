import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDatabase } from './db';
import { PORT } from './config';
import authRoutes from './routes/auth';
import issueRoutes from './routes/issues';
import ticketRoutes from './routes/tickets';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

initDatabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database before starting server:', err);
});
