export interface Assignee {
  name: string;
  initial: string;
}

export interface Issue {
  id: string;
  title: string;
  type: 'Bug' | 'Feature' | 'Task' | 'Improvement';
  status: 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Backlog';
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  assignee: Assignee | null;
  updatedAt: string;
  isFavorite: boolean;
}

export interface Notification {
  id: string;
  type: 'assignment' | 'mention' | 'status' | 'comment';
  title: string;
  desc: string;
  date: string;
  targetId: string;
  unread: boolean;
}