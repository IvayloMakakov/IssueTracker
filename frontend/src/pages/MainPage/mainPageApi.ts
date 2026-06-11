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
  creatorId: number; 
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

export const fetchUsers = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('/api/users', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!response.ok) throw new Error('Грешка при взимане на потребителите');
  return response.json(); 
};