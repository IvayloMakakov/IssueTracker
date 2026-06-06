import { getDb } from '../db';

export async function createNotification(userId: number, type: string, title: string, desc: string, targetId: string) {
  try {
    const db = getDb();
    await db.run(
      `INSERT INTO Notification (userId, type, title, desc, targetId, unread, createdAt)
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'))`,
      [userId, type, title, desc, targetId]
    );
  } catch (err) {
    console.error('Failed to insert notification into DB:', err);
  }
}

export async function getInterestedParties(issueId: number, currentUserId: number): Promise<number[]> {
  const db = getDb();
  const issue = await db.get('SELECT creatorId, assigneeId FROM Issue WHERE id = ?', [issueId]);
  const ids = new Set<number>();
  if (issue) {
    if (issue.creatorId && issue.creatorId !== currentUserId) ids.add(issue.creatorId);
    if (issue.assigneeId && issue.assigneeId !== currentUserId) ids.add(issue.assigneeId);
  }
  return Array.from(ids);
}
