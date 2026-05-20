// frontend/src/Ticket.tsx
import { useState, useEffect } from 'react';
import { fetchTicketData, updateTicketField, addTicketComment, fetchAllUsers } from './ticketApi';
import './ticket.css'; // Импортиране на CSS стиловете

type Status = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

interface DbUser {
  id: number;
  firstName: string;
  lastName: string;
}

const currentUser = { name: "Alex Jones", avatar: "AJ", color: "tk-black" };
const optionsStatus: Status[] = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
const optionsPriority: Priority[] = ["Low", "Medium", "High", "Urgent"];

// Помощна функция за генериране на инициали от името на автора
const getInitials = (authorName: string) => {
  if (!authorName) return "U";
  return authorName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2); // Взимаме максимум 2 букви (напр. "Ivan Ivanov" -> "II")
};

export default function Ticket() {
  // Вече управляваме assigneeId ЕДИНСТВЕНО като число (защото винаги има избран потребител)
  const [ticket, setTicket] = useState<{
    title: string;
    description: string;
    status: Status;
    priority: Priority;
    assigneeId: number;
  } | null>(null);

  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<DbUser[]>([]);

  // Първоначално зареждане на данните
  useEffect(() => {
    // 1. Взимаме динамичния списък с всички потребители от базата данни
    fetchAllUsers()
      .then(users => {
        setUsersList(users);
      })
      .catch(err => console.error("Грешка при зареждане на потребителите:", err));

    // 2. Взимаме данните за текущото issue и неговите коментари
    fetchTicketData()
      .then(data => {
        if (data) {
          setTicket({
            title: data.title,
            description: data.description || "Няма предоставено описание за тази задача.",
            status: data.status || "To Do",
            priority: data.priority || "Medium",
            // Директно взимаме числовото ID (ако липсва, подсигуряваме първия потребител от списъка или 1)
            assigneeId: Number(data.assigneeId || 1)
          });
          setComments(data.comments || []);
        }
      })
      .catch(err => console.error("Грешка при зареждане на задачата:", err));
  }, []);

  const handleStatusChange = (newStatus: Status) => {
    if (!ticket) return;
    setErrorMessage(null);

    updateTicketField('status', newStatus)
      .then((res) => {
        if (res && (res.error || res.success === false)) {
          setErrorMessage(res.message);
        } else {
          setTicket(prev => prev ? { ...prev, status: newStatus } : null);
        }
      })
      .catch(err => console.error(err));
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if (!ticket) return;
    updateTicketField('priority', newPriority)
      .then(() => {
        setTicket(prev => prev ? { ...prev, priority: newPriority } : null);
      })
      .catch(err => console.error(err));
  };

  // Извиква се при промяна на потребителя от падащото меню
  const handleAssigneeChange = (selectedId: string) => {
    if (!ticket) return;
    
    // Тъй като махнахме "Unassigned", тук винаги идва валидно стрингово ID на потребител, превръщаме го в число
    const dbValue = Number(selectedId);

    updateTicketField('assignee', dbValue)
      .then((res) => {
        if (res && (res.error || res.success === false)) {
          setErrorMessage(res.message);
        } else {
          setTicket(prev => prev ? { ...prev, assigneeId: dbValue } : null);
        }
      })
      .catch(err => console.error("Грешка при запис на потребител:", err));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    addTicketComment(newCommentText, currentUser.name)
      .then(res => {
        const savedComment = res.comment || res;
        setComments(prev => [...prev, savedComment]);
        setNewCommentText("");
      })
      .catch(err => console.error("Грешка при добавяне на коментар:", err));
  };

  if (isDeleted) {
    return (
      <div className="tk-body-override">
        <div className="tk-flex-align tk-justify-center" style={{ height: '100vh' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--tk-danger)' }}>Issue was successfully deleted.</h1>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="tk-body-override">
        <div style={{ padding: '24px', fontFamily: 'sans-serif' }}>Зареждане на задачата...</div>
      </div>
    );
  }

  return (
    <div className="tk-body-override">
      {/* ГОРНА НАВИГАЦИОННА ЛЕНТА */}
      <nav className="tk-top-nav">
          <div className="tk-flex-align">
              <span className="tk-text-blue font-bold">🎯 BugTracker</span>
              <input type="text" className="tk-search-bar" placeholder="Search issues..." />
          </div>
          <div className="tk-nav-actions">
              <button className="tk-btn-dark">Create issue</button>
              <div className="tk-avatar-small tk-black">{currentUser.avatar}</div>
          </div>
      </nav>

      <div className="tk-app-container-ticket">
          {/* СТРАНИЧНО МЕНЮ */}
          <aside className="tk-sidebar-nav">
              <h3>Navigation</h3>
              <ul>
                  <li className="tk-active">📋 Issues</li>
                  <li>📊 Dashboard</li>
                  <li>⚙️ Settings</li>
              </ul>
          </aside>

          {/* ОСНОВНО СЪДЪРЖАНИЕ */}
          <main className="tk-main-content">
              <button className="tk-btn-back">← Back to project</button>
              
              {errorMessage && (
                <div style={{ color: 'white', background: 'var(--tk-danger)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontWeight: 'bold' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="tk-title-row">
                  <div className="tk-icon-alert">!</div>
                  <div>
                      <h1>{ticket.title}</h1>
                      <div className="tk-ticket-id">ITS-104 • Syncing with data.db</div>
                  </div>
              </div>

              <div className="tk-badges">
                  <span className="tk-badge tk-flex-align">
                     Status: <strong className="tk-text-blue">{ticket.status}</strong>
                  </span>
                  <span className="tk-badge">Priority: <strong>{ticket.priority}</strong></span>
              </div>

              <div className="tk-layout-grid">
                  {/* ЛЯВА СЕКЦИЯ: ОПИСАНИЕ И КОМЕНТАРИ */}
                  <div>
                      <h3>Description</h3>
                      <p className="tk-description-text tk-mt-2">
                          {ticket.description}
                      </p>

                      <hr className="tk-divider" />

                      <div className="tk-comments-section">
                          <h3>Discussion ({comments.length})</h3>
                          
                          <div className="tk-comments-list">
                              {comments.map((comment) => {
                                  // ТЪРСЕНЕ НА ПОТРЕБИТЕЛЯ ПО ID ВЪВ ФРОНТЕНДА:
                                  const matchingUser = usersList.find(u => u.id === comment.authorId);
                                  
                                  // Сглобяваме името на авторадинамично
                                  const authorName = matchingUser 
                                    ? `${matchingUser.firstName} ${matchingUser.lastName}` 
                                    : "Unknown User";
                                    
                                  const initials = getInitials(authorName);

                                  return (
                                      <div key={comment.id} className="tk-comment-card">
                                          <div className="tk-comment-header">
                                              {/* Кръгла иконка с динамични инициали */}
                                              <div className={`tk-avatar-small ${comment.color || 'tk-blue'}`}>
                                                  {initials}
                                              </div>
                                              <div>
                                                  <span className="tk-author">{authorName}</span>
                                                  <div className="tk-date">
                                                      {comment.createdAt || comment.date || 'Just now'}
                                                  </div>
                                              </div>
                                          </div>
                                          <p>{comment.content || comment.text}</p>
                                      </div>
                                  );
                              })}
                          </div>

                          <div className="tk-add-comment-box tk-mt-4">
                              <form onSubmit={handleAddComment}>
                                  <textarea 
                                    placeholder="Add a comment or feedback..."
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                  />
                                  <button type="submit" className="tk-btn-primary tk-mt-2">Comment</button>
                              </form>
                          </div>
                      </div>
                  </div>

                  {/* ДЯСНА СЕКЦИЯ: ПАДАЩИ МЕНЮТА ЗА ДЕТАЙЛИ */}
                  <div>
                      <div className="tk-details-card">
                          
                          <div className="tk-field">
                              <label>Status Lifecycle</label>
                              <select 
                                className="tk-dropdown-trigger" 
                                value={ticket.status} 
                                onChange={(e) => handleStatusChange(e.target.value as Status)}
                              >
                                  {optionsStatus.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>

                          <div className="tk-field">
                              <label>Priority</label>
                              <select 
                                className="tk-dropdown-trigger" 
                                value={ticket.priority} 
                                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                              >
                                  {optionsPriority.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>

                          {/* ЧИСТ АСАЙНИ СЕЛЕКТОР БЕЗ "UNASSIGNED" */}
                          <div className="tk-field">
                              <label>Assignee</label>
                              <select 
                                className="tk-dropdown-trigger" 
                                value={ticket.assigneeId} 
                                onChange={(e) => handleAssigneeChange(e.target.value)}
                              >
                                  {usersList.map(u => (
                                      <option key={u.id} value={u.id}>
                                          {u.firstName} {u.lastName}
                                      </option>
                                  ))}
                              </select>
                          </div>

                      </div>
                      
                      <button onClick={() => setIsDeleted(true)} className="tk-btn-danger tk-w-full tk-mt-4">🗑 Delete Issue</button>
                  </div>
              </div>
          </main>
      </div>
    </div>
  );
}