const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors()); // Позволява на фронтенда да прави заявки
app.use(express.json()); // Позволява на сървъра да чете JSON данни

// --- ИМИТАЦИЯ НА БАЗА ДАННИ ---
// В реалния проект тук ще ползвате SQLite или MySQL
let ticketDB = {
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

// --- API ENDPOINTS (Пътищата на сървъра) ---

// 1. Вземане на данните за билета
app.get('/api/ticket', (req, res) => {
    res.json(ticketDB);
});

// 2. Обновяване на поле (status, priority, assignee, title)
app.patch('/api/ticket', (req, res) => {
    const { field, value } = req.body;
    
    // Проста бекенд валидация
    if (ticketDB.hasOwnProperty(field)) {
        ticketDB[field] = value;
        res.json({ success: true, message: "Обновено успешно", data: ticketDB });
    } else {
        res.status(400).json({ success: false, message: "Невалидно поле" });
    }
});

// 3. Добавяне на нов коментар
app.post('/api/ticket/comments', (req, res) => {
    const { text, author } = req.body;
    
    if (!text) {
        return res.status(400).json({ success: false, message: "Празен коментар" });
    }

    const now = new Date();
    const dateStr = `${now.getDate()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} г., ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ч.`;

    const newComment = {
        id: Date.now(), // Генерираме уникално ID
        author: author || "Alice Johnson", // Хардкоднато за сега, реално се взима от сесията
        avatar: "A",
        color: "blue",
        date: dateStr,
        text: text
    };

    ticketDB.comments.push(newComment);
    res.json({ success: true, comment: newComment });
});

// Стартиране на сървъра
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Сървърът работи на http://localhost:${PORT}`);
});