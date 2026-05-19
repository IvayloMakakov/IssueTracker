// frontend/src/api.ts

const BASE_URL = 'http://localhost:3000/api';

// Вземане на билета
export const fetchTicketData = async () => {
    const res = await fetch(`${BASE_URL}/ticket`);
    return res.json();
};

// Обновяване на поле (статус, приоритет, заглавие и т.н.)
export const updateTicketField = async (field: string, value: string) => {
    const res = await fetch(`${BASE_URL}/ticket`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value })
    });
    return res.json();
};

// Добавяне на коментар
export const addTicketComment = async (text: string, author: string) => {
    const res = await fetch(`${BASE_URL}/ticket/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, author })
    });
    return res.json();
};