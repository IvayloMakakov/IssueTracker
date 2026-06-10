export const fetchTicketData = async (id: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/ticket?id=${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Грешка при извличане на билета');
  return response.json();
};

export const updateTicketField = async (id: string, field: string, value: string | number | boolean) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/ticket', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify({ id, field, value })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Грешка при обновяване на полето');
  }
  return response.json();
};

export const addTicketComment = async (issueId: string, text: string, author: string) => {
    const token = localStorage.getItem('token');
    
    const res = await fetch('/api/ticket/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ issueId, text, author })
    });
    return res.json();
};

export const fetchAllUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Грешка при извличане на потребителите');
    return res.json();
};

export const deleteTicket = async (dbId: number) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/ticket?id=${dbId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Грешка при изтриване');
  }
  return response.json();
};