// frontend/src/ticketApi.ts

// Вземане на билета
export const fetchTicketData = async (id: string) => {
  const token = localStorage.getItem('token');
  const response = await fetch(`/api/ticket?id=${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Грешка при извличане на билета');
  return response.json();
};

// Промяна на поле по задача (ОПРАВЕНО: Добавена защита с JWT Токен)
export const updateTicketField = async (id: string, field: string, value: string | number | boolean) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch('/api/ticket', {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Изпращаме токена към requireAuth
    },
    body: JSON.stringify({ id, field, value })
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Грешка при обновяване на полето');
  }
  return response.json();
};

// Добавяне на коментар (ОПРАВЕНО: Добавена защита с JWT Токен)
export const addTicketComment = async (issueId: string, text: string, author: string) => {
    const token = localStorage.getItem('token');
    
    const res = await fetch('/api/ticket/comments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Изпращаме токена
        },
        body: JSON.stringify({ issueId, text, author })
    });
    return res.json();
};

// Вземане на всички потребители
export const fetchAllUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Грешка при извличане на потребителите');
    return res.json();
};