// --- 1. ТИПОВЕ И БИЗНЕС ЛОГИКА ---
type Status = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

const workflow: Record<Status, Status[]> = {
    "Backlog": ["To Do"],
    "To Do": ["In Progress"],
    "In Progress": ["To Do", "In Review", "Done"],
    "In Review": ["In Progress", "Done"],
    "Done": ["In Progress"]
};

// СИМУЛАЦИЯ НА ЛОГНАТ ПОТРЕБИТЕЛ (Този, който цъка по екрана)
const currentUser = {
    name: "Alex Jones", 
    avatar: "AJ",
    color: "black"
};

// Текущо състояние на билета
let ticket = {
    title: "Fix login page responsiveness",
    status: "In Progress" as Status,
    priority: "High" as Priority,
    assignee: "Alice Johnson"
};

const optionsStatus: Status[] = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
const optionsPriority: Priority[] = ["Low", "Medium", "High", "Urgent"];
const optionsAssignee = ["Unassigned", "Alice Johnson", "Bob Smith", "Carol White", "David Brown", "Sarah Miller"];

// --- 2. ИНИЦИАЛИЗАЦИЯ ---
window.onload = () => {
    document.getElementById('ticket-title')?.addEventListener('click', editTitle);

    // Падащи менюта (вече записват в историята!)
    setupDropdown('status', optionsStatus, ticket.status, (val: string) => {
        const success = handleStatusChange(val);
        if (success) {
            const valueSpan = document.getElementById('value-status');
            if (valueSpan) valueSpan.innerText = val;
            addActivityLog(`промени статуса на <strong>${val}</strong>`); // Записваме в коментарите
        }
        return success;
    });
    
    setupDropdown('priority', optionsPriority, ticket.priority, (val: string) => { 
        ticket.priority = val as Priority; 
        addActivityLog(`смени приоритета на <strong>${val}</strong>`); // Записваме в коментарите
        return true; 
    }, renderPriorityOption);
    
    setupDropdown('assignee', optionsAssignee, ticket.assignee, (val: string) => { 
        ticket.assignee = val; 
        const valueSpan = document.getElementById('value-assignee');
        if (valueSpan) valueSpan.innerText = val;
        addActivityLog(`назначи билета на <strong>${val}</strong>`); // Записваме в коментарите
        return true; 
    });

    // Бутони
    document.getElementById('add-comment-btn')?.addEventListener('click', addComment);
    document.getElementById('delete-btn')?.addEventListener('click', deleteIssue);

    document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (!target.closest('.custom-dropdown')) closeAllDropdowns();
    });
};

// --- 3. ФУНКЦИИ ЗА КОМЕНТАРИ И ИСТОРИЯ (НОВО) ---

// Помощна функция за точно време
function getCurrentDateTime() {
    const now = new Date();
    return `${now.getDate()}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} г., ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} ч.`;
}

// Добавяне на истински коментар от потребителя
function addComment() {
    const textArea = document.getElementById('new-comment-text') as HTMLTextAreaElement;
    const text = textArea.value.trim();

    if (!text) {
        alert("Въведете текст за коментара!");
        return;
    }

    const list = document.getElementById('comments-list');
    if (list) {
        // Вече ползваме данните на currentUser (Alex Jones)
        const html = `
            <div class="comment-card">
                <div class="comment-header">
                    <div class="avatar-small ${currentUser.color}">${currentUser.avatar}</div>
                    <div>
                        <p class="author">${currentUser.name}</p>
                        <p class="date">${getCurrentDateTime()}</p>
                    </div>
                </div>
                <p class="comment-body">${text}</p>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
        textArea.value = ""; 
    }
}

// Добавяне на системен лог при промяна на статус/човек
function addActivityLog(actionHtml: string) {
    const list = document.getElementById('comments-list');
    if (list) {
        const html = `
            <div style="padding: 8px 16px; margin-bottom: 16px; background: #f8fafc; border-left: 3px solid #cbd5e1; font-size: 13px; color: #64748b; display: flex; justify-content: space-between;">
                <span><strong>${currentUser.name}</strong> ${actionHtml}</span>
                <span>${getCurrentDateTime()}</span>
            </div>
        `;
        list.insertAdjacentHTML('beforeend', html);
    }
}

// --- 4. ОСТАНАЛИ ФУНКЦИИ (БЕЗ ПРОМЯНА) ---

function deleteIssue() {
    const confirmed = confirm("Сигурни ли сте, че искате да изтриете този билет?");
    if (confirmed) {
        document.getElementById('ticket-view')!.style.display = 'none';
        document.getElementById('deleted-message')!.classList.remove('hidden');
    }
}

function editTitle() {
    const newTitle = prompt("Ново заглавие:", ticket.title);
    if (newTitle && newTitle.trim().length >= 5) {
        ticket.title = newTitle.trim();
        document.getElementById('ticket-title')!.innerText = ticket.title;
        addActivityLog(`промени заглавието на <strong>${ticket.title}</strong>`);
    } else if (newTitle) {
        alert("Заглавието трябва да е поне 5 символа.");
    }
}

function handleStatusChange(newStatus: string): boolean {
    const typedStatus = newStatus as Status;
    if (workflow[ticket.status].includes(typedStatus)) {
        ticket.status = typedStatus;
        return true; 
    } else {
        alert(`Невалиден преход! Не можеш да минеш от "${ticket.status}" директно в "${newStatus}".`);
        return false; 
    }
}

function setupDropdown(id: string, options: string[], currentValue: string, onSelect: (val: string) => boolean, renderFn?: (val: string) => string) {
    const trigger = document.getElementById(`trigger-${id}`);
    const menu = document.getElementById(`menu-${id}`);
    const valueSpan = document.getElementById(`value-${id}`);

    if (!trigger || !menu || !valueSpan) return;

    const renderText = renderFn ? renderFn : (val: string) => val;

    const renderMenu = () => {
        menu.innerHTML = options.map(opt => `
            <div class="dropdown-item ${opt === currentValue ? 'selected' : ''}" data-value="${opt}">
                <span>${renderText(opt)}</span>
                ${opt === currentValue ? '<span class="check-icon">✓</span>' : ''}
            </div>
        `).join('');

        menu.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement;
                const newVal = target.getAttribute('data-value')!;
                
                if (newVal !== currentValue) {
                    const success = onSelect(newVal);
                    if (success) {
                        currentValue = newVal;
                        renderMenu(); 
                    }
                }
                closeAllDropdowns();
            });
        });
    };

    renderMenu();

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = menu.classList.contains('hidden');
        closeAllDropdowns();
        if (isHidden) menu.classList.remove('hidden');
    });
}

function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.add('hidden'));
}

function renderPriorityOption(val: string): string {
    if (val === "High") return '<span class="flex-align"><span class="text-orange">↑</span> High</span>';
    if (val === "Low") return '<span class="flex-align"><span class="text-blue">↓</span> Low</span>';
    if (val === "Medium") return '<span class="flex-align"><span style="color: #eab308; font-weight:bold;">—</span> Medium</span>';
    if (val === "Urgent") return '<span class="flex-align"><span class="text-danger">⚡</span> Urgent</span>';
    return val;
}