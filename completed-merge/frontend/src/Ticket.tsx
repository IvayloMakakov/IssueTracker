import { useState, useEffect } from 'react';
import { fetchTicketData, updateTicketField, addTicketComment } from './ticketApi';

type Status = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

const workflow: Record<Status, Status[]> = {
    "Backlog": ["To Do"],
    "To Do": ["In Progress"],
    "In Progress": ["In Review", "Done"], 
    "In Review": ["Done"],               
    "Done": []                          
};

const currentUser = { name: "Alex Jones", avatar: "AJ", color: "tk-black" };
const optionsStatus: Status[] = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
const optionsPriority: Priority[] = ["Low", "Medium", "High", "Urgent"];
const optionsAssignee = ["Unassigned", "Alice Johnson", "Bob Smith", "Carol White"];

export default function Ticket() {
  const [ticket, setTicket] = useState<{title: string, status: Status, priority: Priority, assignee: string} | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);

  // Вземане на данните чрез api
  useEffect(() => {
    fetchTicketData()
      .then(data => {
        if (data && data.ticket) {
          setTicket(data.ticket);
          setComments(data.comments || []);
        } else if (data && data.title) {
          setTicket({
            title: data.title,
            status: data.status,
            priority: data.priority,
            assignee: data.assignee
          });
          setComments(data.comments || []);
        }
      })
      .catch(err => console.error("Грешка при зареждане на билета:", err));
  }, []);

  // Функция за генериране на системно съобщение, показващо извършителя
  const addActivityLog = (actionText: string) => {
    const now = new Date();
    const dateStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const systemComment = {
        id: `sys-${Date.now()}`,
        author: currentUser.name,   
        avatar: currentUser.avatar, 
        color: currentUser.color,   
        date: dateStr,
        text: actionText,
        isSystem: true             
    };
    setComments(prev => [...prev, systemComment]);
  };

  if (isDeleted) {
    return (
      <div className="tk-body-override">
        <div className="tk-main-content">
          <h2>Issue successfully deleted.</h2>
          <button className="tk-btn-primary tk-mt-3" onClick={() => window.location.reload()}>Undo / Reload</button>
        </div>
      </div>
    );
  }

  if (!ticket) return <div className="tk-main-content">Loading issue data... ⏳</div>;

  const handleStatusChange = (newStatus: Status) => {
    if (workflow[ticket.status].includes(newStatus)) {
        updateTicketField('status', newStatus).then(() => {
            addActivityLog(`промени статуса на "${newStatus}"`);
            setTicket({ ...ticket, status: newStatus });
        });
    } else {
        alert(`Невалиден статус преход! От ${ticket.status} не може да преминете към ${newStatus}.`);
    }
  };

  const handlePriorityChange = (newPriority: Priority) => {
    updateTicketField('priority', newPriority).then(() => {
        addActivityLog(`промени приоритета на "${newPriority}"`);
        setTicket({ ...ticket, priority: newPriority });
    });
  };

  const handleAssigneeChange = (newAssignee: string) => {
    updateTicketField('assignee', newAssignee).then(() => {
        addActivityLog(`пренасочи задачата към "${newAssignee}"`);
        setTicket({ ...ticket, assignee: newAssignee });
    });
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    addTicketComment(newCommentText, currentUser.name).then(newComment => {
        const commentToAdd = newComment.comment || newComment;
        setComments([...comments, commentToAdd]);
        setNewCommentText("");
    });
  };

  // Помощна функция за сигурно извличане на инициали (пробва c.avatar, иначе цепи името)
  const getAvatarInitials = (comment: any) => {
    if (comment.avatar) return comment.avatar;
    if (comment.author) {
      return comment.author
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
    }
    return 'U';
  };

  // Помощна функция за подсигуряване на tk- префикса пред цветовете
  const getAvatarColorClass = (comment: any) => {
    if (comment.isSystem) return 'tk-blue';
    const rawColor = comment.color || 'tk-blue';
    return rawColor.startsWith('tk-') ? rawColor : `tk-${rawColor}`;
  };

  return (
    <div className="tk-body-override">
      <nav className="tk-top-nav">
          <div className="tk-flex-align">
              <span className="tk-text-blue font-bold">🎯 BugTracker</span>
              <input type="text" className="tk-search-bar" placeholder="Search issues, pull requests..." />
          </div>
          <div className="tk-nav-actions">
              <button className="tk-btn-dark">Create issue</button>
              <div className="tk-avatar-small tk-black">{currentUser.avatar}</div>
          </div>
      </nav>

      <div className="tk-app-container-ticket">
          <aside className="tk-sidebar-nav">
              <h3>Navigation</h3>
              <ul>
                  <li className="tk-active">📋 Issues</li>
                  <li>📊 Dashboard</li>
                  <li>⚙️ Settings</li>
              </ul>
          </aside>

          <main className="tk-main-content">
              <button className="tk-btn-back">← Back to project</button>
              
              <div className="tk-title-row">
                  <div className="tk-icon-alert">!</div>
                  <div>
                      <h1>{ticket.title}</h1>
                      <div className="tk-ticket-id">ITS-104 • Created 3 days ago</div>
                  </div>
              </div>

              <div className="tk-badges">
                  <span className="tk-badge tk-flex-align">
                     Status: <strong className="tk-text-blue">{ticket.status}</strong>
                  </span>
                  <span className="tk-badge">Priority: <strong>{ticket.priority}</strong></span>
              </div>

              <div className="tk-layout-grid">
                  <div>
                      <h3>Description</h3>
                      <p className="tk-description-text tk-mt-2">
                          При опит за зареждане на голям масив от данни във фронтенда, таблицата забива и хвърля изключение в конзолата. Нужна е оптимизация на рендерирането или добавяне на пагинация от страна на сървъра.
                      </p>

                      <hr className="tk-divider" />

                      <div className="tk-comments-section">
                          <h3>Discussion ({comments.length})</h3>
                          
                          {comments.map(c => (
                              <div key={c.id} className={`tk-comment-card ${c.isSystem ? 'tk-system-log' : ''}`}>
                                  <div className="tk-comment-header">
                                      {/* Безопасно взимане на цвета и инициалите */}
                                      <div className={`tk-avatar-small ${getAvatarColorClass(c)}`}>
                                          {getAvatarInitials(c)}
                                      </div>
                                      <div>
                                          <span className={`tk-author ${c.isSystem ? 'tk-text-orange' : ''}`}>
                                              {c.author} {c.isSystem && <span style={{ fontWeight: 'normal', fontSize: '12px', color: '#64748b' }}>(System Activity)</span>}
                                          </span>
                                          <div className="tk-date">{c.date || 'Just now'}</div>
                                      </div>
                                  </div>
                                  <p style={{ fontStyle: c.isSystem ? 'italic' : 'normal', fontWeight: c.isSystem ? '500' : 'normal' }}>
                                      {c.text}
                                  </p>
                              </div>
                          ))}

                          <div className="tk-add-comment-box tk-mt-4">
                              <textarea 
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Add a comment or feedback..."
                              />
                              <button onClick={handleAddComment} className="tk-btn-primary tk-mt-2">Comment</button>
                          </div>
                      </div>
                  </div>

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

                          <div className="tk-field">
                              <label>Assignee</label>
                              <select 
                                className="tk-dropdown-trigger" 
                                value={ticket.assignee} 
                                onChange={(e) => handleAssigneeChange(e.target.value)}
                              >
                                  {optionsAssignee.map(a => <option key={a} value={a}>{a}</option>)}
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