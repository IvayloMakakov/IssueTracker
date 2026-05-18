import { useState, useEffect } from 'react';
import { fetchTicketData, updateTicketField, addTicketComment } from './api';
import './index.css';

type Status = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

const workflow: Record<Status, Status[]> = {
    "Backlog": ["To Do"],
    "To Do": ["In Progress"],
    "In Progress": ["To Do", "In Review", "Done"],
    "In Review": ["In Progress", "Done"],
    "Done": ["In Progress"]
};

const currentUser = { name: "Alex Jones", avatar: "AJ", color: "black" };
const optionsStatus: Status[] = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
const optionsPriority: Priority[] = ["Low", "Medium", "High", "Urgent"];
const optionsAssignee = ["Unassigned", "Alice Johnson", "Bob Smith", "Carol White"];

function App() {
  const [ticket, setTicket] = useState<{title: string, status: Status, priority: Priority, assignee: string} | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);

  // Вземане на данните чрез api.ts
  useEffect(() => {
    fetchTicketData().then(data => {
        setTicket({
          title: data.title,
          status: data.status,
          priority: data.priority,
          assignee: data.assignee
        });
        setComments(data.comments);
    }).catch(err => console.error("Грешка:", err));
  }, []);

  const handleEditTitle = () => {
    if(!ticket) return;
    const newTitle = prompt("Ново заглавие:", ticket.title);
    if (newTitle && newTitle.trim().length >= 5) {
      setTicket({ ...ticket, title: newTitle.trim() });
      updateTicketField('title', newTitle.trim()); // Използваме api.ts
      addActivityLog(`промени заглавието на <strong>${newTitle.trim()}</strong>`);
    }
  };

  const handleStatusChange = (newStatus: Status) => {
    if(!ticket) return;
    if (workflow[ticket.status].includes(newStatus)) {
      setTicket({ ...ticket, status: newStatus });
      updateTicketField('status', newStatus); // Използваме api.ts
      addActivityLog(`промени статуса на <strong>${newStatus}</strong>`);
    } else {
      alert(`Невалиден преход! Не можеш да минеш от "${ticket.status}" директно в "${newStatus}".`);
    }
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if(!ticket) return;
    setTicket({ ...ticket, priority: newPriority });
    updateTicketField('priority', newPriority);
    addActivityLog(`смени приоритета на <strong>${newPriority}</strong>`);
  };

  const handleAssigneeChange = (newAssignee: string) => {
    if(!ticket) return;
    setTicket({ ...ticket, assignee: newAssignee });
    updateTicketField('assignee', newAssignee);
    addActivityLog(`назначи билета на <strong>${newAssignee}</strong>`);
  };

  const addActivityLog = (actionHtml: string) => {
    const now = new Date();
    const dateStr = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()} г., ${now.getHours()}:${now.getMinutes()} ч.`;
    const sysComment = {
        id: Date.now(),
        author: currentUser.name,
        avatar: currentUser.avatar,
        color: currentUser.color,
        date: dateStr,
        text: `СИСТЕМНО: ${actionHtml}`
    };
    setComments(prev => [...prev, sysComment]);
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    
    // Използваме api.ts за добавяне на коментар
    addTicketComment(newCommentText, currentUser.name).then(data => {
      if(data.success) {
        setComments([...comments, data.comment]);
        setNewCommentText("");
      }
    });
  };

  if (isDeleted) {
      return (
        <div style={{ padding: '40px', textAlign: 'center' }}>
            <h2>Билетът беше изтрит!</h2>
            <button onClick={() => setIsDeleted(false)} className="btn-primary mt-4">Върни го</button>
        </div>
      );
  }

  if (!ticket) {
      return <div style={{ padding: '40px', textAlign: 'center' }}><h2>Зареждане на билета от сървъра... ⏳</h2></div>;
  }

  return (
    <div>
      <header className="top-nav">
          <div className="logo"><strong>IT</strong> Issue Tracker</div>
          <div className="search-bar">🔍 Search issues...</div>
          <div className="nav-actions">
              <button className="btn-dark">+ New Issue</button>
              <div className="avatar">{currentUser.avatar}</div>
          </div>
      </header>

      <div className="app-container">
          <aside className="sidebar-nav">
              <div className="nav-group">
                  <h4>Navigation</h4>
              </div>
              <ul className="nav-links">
                  <li><span className="icon">🏠</span> Dashboard</li>
                  <li className="active"><span className="icon">👥</span> Teams</li>
              </ul>
          </aside>

          <main className="main-content">
              <button className="btn-back">← Back</button>

              <div className="layout-grid">
                  <div className="content-left">
                      <div className="title-row">
                          <div className="icon-alert">!</div>
                          <div>
                              <h1 onClick={handleEditTitle} className="editable" title="Кликни за редакция">{ticket.title}</h1>
                              <p className="ticket-id">ISS-1</p>
                          </div>
                      </div>

                      <p className="description-text">The login page is not displaying correctly on mobile devices. Need to add responsive styles.</p>
                      <hr className="divider" />

                      <div className="comments-section">
                          <h3>Comments</h3>
                          <div id="comments-list">
                              {comments.map(c => (
                                  <div key={c.id} className="comment-card">
                                      <div className="comment-header">
                                          <div className={`avatar-small ${c.color}`}>{c.avatar}</div>
                                          <div>
                                              <p className="author">{c.author}</p>
                                              <p className="date">{c.date}</p>
                                          </div>
                                      </div>
                                      <p className="comment-body" dangerouslySetInnerHTML={{__html: c.text}}></p>
                                  </div>
                              ))}
                          </div>

                          <div className="add-comment-box">
                              <textarea 
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Add a comment..." rows={3} 
                              />
                              <button onClick={handleAddComment} className="btn-primary mt-2">Add Comment</button>
                          </div>
                      </div>
                  </div>

                  <div className="content-right">
                      <div className="details-card">
                          
                          <div className="field">
                              <label>Status</label>
                              <select 
                                className="dropdown-trigger" 
                                value={ticket.status} 
                                onChange={(e) => handleStatusChange(e.target.value as Status)}
                              >
                                  {optionsStatus.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>

                          <div className="field">
                              <label>Priority</label>
                              <select 
                                className="dropdown-trigger" 
                                value={ticket.priority} 
                                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                              >
                                  {optionsPriority.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>

                          <div className="field">
                              <label>Assignee</label>
                              <select 
                                className="dropdown-trigger" 
                                value={ticket.assignee} 
                                onChange={(e) => handleAssigneeChange(e.target.value)}
                              >
                                  {optionsAssignee.map(a => <option key={a} value={a}>{a}</option>)}
                              </select>
                          </div>

                      </div>
                      
                      <button onClick={() => setIsDeleted(true)} className="btn-danger w-full mt-4">🗑 Delete Issue</button>
                  </div>
              </div>
          </main>
      </div>
    </div>
  );
}

export default App;