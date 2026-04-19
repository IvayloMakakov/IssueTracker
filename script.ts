// --- 1. ТИПОВЕ ---
export {};
type Status = "To Do" | "In Progress" | "Done";
type Priority = "Low" | "Medium" | "High";

interface Ticket {
    id: string;
    title: string;
    status: Status;
    assignee: string;
    priority: Priority;
}

// --- 2. БАЗА ДАННИ (MOCK) ---
let currentTicket: Ticket = {
    id: "WEB-12",
    title: "Оправяне на логин формата",
    status: "In Progress",
    assignee: "Simo",
    priority: "Medium"
};

const users = ["Simo", "Ivan", "Maria", "Unassigned"];
const workflowRules: Record<Status, Status[]> = {
    "To Do": ["In Progress"],
    "In Progress": ["To Do", "Done"],
    "Done": ["In Progress"]
};

// --- 3. ИНИЦИАЛИЗАЦИЯ ---
window.onload = () => {
    // Редакция на заглавие
    document.getElementById('ticket-title')?.addEventListener('click', editTitle);
    
    // Настройка на Click-to-edit за падащите менюта
    setupDropdownEdit('status-badge', 'status-select', ["To Do", "In Progress", "Done"], currentTicket.status, handleStatusChange);
    setupDropdownEdit('assignee-display', 'assignee-select', users, currentTicket.assignee, (newVal) => {
        currentTicket.assignee = newVal;
        updateDisplay('assignee-display', newVal);
    });
    setupDropdownEdit('priority-display', 'priority-select', ["Low", "Medium", "High"], currentTicket.priority, (newVal) => {
        currentTicket.priority = newVal as Priority;
        updateDisplay('priority-display', newVal);
    });
};

// --- 4. ЛОГИКА ЗА РЕДАКЦИЯ И ВАЛИДАЦИЯ ---

// Промяна на заглавие с валидация
function editTitle() {
    const newTitle = prompt("Въведи ново заглавие:", currentTicket.title);
    if (newTitle !== null) {
        if (newTitle.trim().length < 5) {
            alert("ГРЕШКА: Заглавието трябва да е поне 5 символа!");
        } else {
            currentTicket.title = newTitle;
            const titleEl = document.getElementById('ticket-title');
            if (titleEl) titleEl.innerText = newTitle;
        }
    }
}

// Проверка на Workflow правилата (Изискване за Домашното)
function handleStatusChange(newStatus: string) {
    const typedNewStatus = newStatus as Status;
    const allowed = workflowRules[currentTicket.status];

    if (allowed.includes(typedNewStatus)) {
        currentTicket.status = typedNewStatus;
        updateDisplay('status-badge', typedNewStatus);
    } else {
        alert(`НЕВАЛИДЕН ПРЕХОД! Не можеш да минеш от "${currentTicket.status}" директно в "${typedNewStatus}".`);
        updateDisplay('status-badge', currentTicket.status); // Връщаме стария текст
    }
}

// --- 5. ПОМОЩНИ ФУНКЦИИ (UI Магията) ---

// Функция, която превръща текст в падащо меню при клик
function setupDropdownEdit(displayId: string, selectId: string, options: string[], currentValue: string, onChangeCallback: (val: string) => void) {
    const displayEl = document.getElementById(displayId);
    const selectEl = document.getElementById(selectId) as HTMLSelectElement;

    if (!displayEl || !selectEl) return;

    // Пълним менюто с опции
    selectEl.innerHTML = options.map(opt => `<option value="${opt}" ${opt === currentValue ? 'selected' : ''}>${opt}</option>`).join('');

    // При клик върху текста: скрий текста, покажи менюто
    displayEl.addEventListener('click', () => {
        displayEl.style.display = 'none';
        selectEl.style.display = 'inline-block';
        selectEl.focus();
    });

    // При избор на нова стойност или клик извън менюто (blur)
    const finishEdit = () => {
        selectEl.style.display = 'none';
        displayEl.style.display = 'inline-block';
        if (selectEl.value !== currentValue) {
            onChangeCallback(selectEl.value);
            currentValue = selectEl.value; // Обновяваме локалната стойност
        }
    };

    selectEl.addEventListener('change', finishEdit);
    selectEl.addEventListener('blur', finishEdit);
}

// Обновява текста на екрана
function updateDisplay(elementId: string, newValue: string) {
    const el = document.getElementById(elementId);
    if (el) el.innerText = newValue;
}