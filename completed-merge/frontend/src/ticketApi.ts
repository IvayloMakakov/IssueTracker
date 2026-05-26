// frontend/src/api.ts

// Вземане на билета
export const fetchTicketData = async (id: string) => {
  const response = await fetch(`/api/ticket?id=${id}`);
  if (!response.ok) throw new Error('Грешка при извличане на билета');
  return response.json();
};

// Променяме функцията да приема id
export const updateTicketField = async (id: string, field: string, value: string | number | boolean) => {
  const response = await fetch('/api/ticket', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    // Изпращаме id-то към бекенда
    body: JSON.stringify({ id, field, value })
  });
  if (!response.ok) throw new Error('Грешка при обновяване на полето');
  return response.json();
};

// Добавяне на коментар - ОПРАВЕНО: Премахнат BASE_URL, използва се относителния път
export const addTicketComment = async (issueId: string, text: string, author: string) => {
    const res = await fetch('/api/ticket/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ВАЖНО: Изпращаме issueId към бекенда, за да знае за коя задача е коментарът
        body: JSON.stringify({ issueId, text, author })
    });
    return res.json();
};

// Вземане на всички потребители - ОПРАВЕНО: Премахнат BASE_URL
export const fetchAllUsers = async () => {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error('Грешка при извличане на потребителите');
    return res.json();
};

export const fetchTicketById = async (ticketId: string) => {
  // Подаваме id като query параметър към бекенда
  const response = await fetch(`/api/ticket?id=${ticketId}`);
  if (!response.ok) throw new Error('Грешка при зареждане на билета');
  return response.json();
};