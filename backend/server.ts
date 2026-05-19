import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();

app.use(cors()); // Позволява на фронтенда да прави заявки
app.use(express.json()); // Позволява на сървъра да чете JSON данни

// --- TYPES / INTERFACES ---
interface Comment {
    id: number;
    author: string;
    avatar: string;
    color: string;
    date: string;
    text: string;
}

interface Ticket {
    id: string;
    title: string;
    status: string;
    priority: string;
    assignee: string;
    comments: Comment[];
    // Позволява ни да достъпваме полетата динамично чрез ticketDB[field]
    [key: string]: any; 
}

// --- ИМИТАЦИЯ НА БАЗА ДАННИ ---
let ticketDB: Ticket = {
    id: "ISS-1",
    title: "Fix login page responsiveness",
    status: "In Progress",
    priority: "High",
    assignee: "Alice Johnson",
    comments: [
        {
            id: 1,
            author: "Bob Smith",
            avatar: "B",
            color: "black",
            date: "28.03.2026 г., 02:00:00 ч.",
            text: "This is affecting user experience on mobile."
        }
    ]
};

// --- API ENDPOINTS ---

// 1. Вземане на данните за билета
app.get('/api/ticket', (req: Request, res: Response) => {
    res.json(ticketDB);
});

// 2. Обновяване на поле (status, priority, assignee, title)
app.patch('/api/ticket', (req: Request, res: Response) => {
    const { field, value } = req.body as { field: string; value: string };
    
    // Проста бекенд валидация
    if (Object.prototype.hasOwnProperty.call(ticketDB, field) && field !== 'comments' && field !== 'id') {
        ticketDB[field] = value;
        res.json({ success: true, message: "Обновено успешно", data: ticketDB });
    } else {
        res.status(400).json({ success: false, message: "Невалидно или незаменяемо поле" });
    }
});

// 3. Добавяне на нов коментар
app.post('/api/ticket/comments', (req: Request, res: Response) => {
    const { text, author } = req.body as { text: string; author?: string };
    
    if (!text) {
        return res.status(400).json({ success: false, message: "Празен коментар" });
    }

    const now = new Date();
    const dateStr = `${now.getDate()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} г., ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ч.`;

    const newComment: Comment = {
        id: Date.now(), // Unique ID
        author: author || "Alice Johnson", 
        avatar: (author ? author.charAt(0).toUpperCase() : "A"),
        color: "blue",
        date: dateStr,
        text: text
    };

    ticketDB.comments.push(newComment);
    res.json({ success: true, comment: newComment });
});

// Стартиране на сървъра
const PORT = 3000;

// Използваме '0.0.0.0', за да бъде достъпен от лаптопите на колегите ти в същата Wi-Fi мрежа
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Сървърът работи на порт ${PORT}`);
    console.log(`Достъпен локално на: http://localhost:${PORT}`);
});
