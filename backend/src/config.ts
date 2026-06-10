export const PORT = 3000;
export const SALT_ROUNDS = 10;

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is missing in environment variables.');
  process.exit(1); 
}

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
