import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

let db: Database<sqlite3.Database, sqlite3.Statement>;

export function getDb() {
  return db;
}

export async function initDatabase() {
  db = await open({
    filename: path.join(__dirname, 'data.db'),
    driver: sqlite3.Database
  });
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec(`
    CREATE TABLE IF NOT EXISTS "User" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "firstName" TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT NOT NULL,
      "avatarUrl" TEXT
    );
    CREATE TABLE IF NOT EXISTS "Issue" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "displayId" TEXT NOT NULL UNIQUE,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "priority" TEXT NOT NULL,
      "creatorId" INTEGER NOT NULL,
      "assigneeId" INTEGER,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
      FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "UserFavorite" (
      "userId" INTEGER NOT NULL,
      "issueId" INTEGER NOT NULL,
      PRIMARY KEY ("userId", "issueId"),
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE TABLE IF NOT EXISTS "Comment" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "content" TEXT NOT NULL,
      "authorId" INTEGER NOT NULL,
      "issueId" INTEGER NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "userId" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "desc" TEXT NOT NULL,
      "targetId" TEXT NOT NULL,
      "unread" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);
  console.log('Successfully connected to SQLite database (data.db)');
}
