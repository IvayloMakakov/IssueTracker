// frontend/src/Ticket.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTicketData, updateTicketField, addTicketComment, fetchAllUsers } from './ticketApi';
import './ticket.css';

type Status = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

// 1. Дефинираме интерфейса, за да не гърми TypeScript
interface DbUser {
  id: number;
  firstName: string;
  lastName: string;
}

const optionsStatus: Status[] = ["Backlog", "To Do", "In Progress", "In Review", "Done"];
const optionsPriority: Priority[] = ["Low", "Medium", "High", "Urgent"];

const getInitials = (authorName: string) => {
  if (!authorName) return "U";
  return authorName.split(' ').map(w => w.charAt(0)).join('').toUpperCase().substring(0, 2);
};

export default function Ticket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // 2. Дефинираме стейтовете вътре в компонента
  const [currentUser, setCurrentUser] = useState<{ name: string, avatar: string } | null>(null);
  const [ticket, setTicket] = useState<{title: string, description: string, status: Status, priority: Priority, assigneeId: number} | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const token = localStorage.getItem('token');
    if (token) {
        fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(user => setCurrentUser({ name: `${user.firstName} ${user.lastName}`, avatar: `${user.firstName[0]}${user.lastName[0]}` }))
            .catch(() => {});
    }

    Promise.all([fetchTicketData(id), fetchAllUsers()])
      .then(([data, users]) => {
        setUsersList(users);
        setTicket({
          title: data.title,
          description: data.description || "Няма описание.",
          status: data.status || "To Do",
          priority: data.priority || "Medium",
          assigneeId: Number(data.assigneeId || 1)
        });
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(err => {
        setErrorMessage(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleStatusChange = (newStatus: Status) => {
    if (!ticket || !id) return;
    setErrorMessage(null);

    updateTicketField(id, 'status', newStatus)
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
    if (!ticket || !id) return;
    
    // ВЕЧЕ ПОДАВАМЕ 'id'
    updateTicketField(id, 'priority', newPriority)
      .then(() => {
        setTicket(prev => prev ? { ...prev, priority: newPriority } : null);
      })
      .catch(err => console.error(err));
  };

  const handleAssigneeChange = (selectedId: string) => {
    if (!ticket || !id) return;
    const dbValue = Number(selectedId);

    // ВЕЧЕ ПОДАВАМЕ 'id'
    updateTicketField(id, 'assignee', dbValue)
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
    // Добавяме проверка за currentUser
    if (!newCommentText.trim() || !id || !currentUser) return; 

    addTicketComment(id, newCommentText, currentUser.name)
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

  if (loading || !ticket) {
    return (
      <div className="tk-body-override">
        <div style={{ padding: '24px', fontFamily: 'sans-serif', color: 'white' }}>Зареждане на задачата...</div>
      </div>
    );
  }

  return (
    <div className="tk-body-override">
      <nav className="tk-top-nav">
          <div className="tk-flex-align">
              <span className="tk-text-blue font-bold" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>🎯 BugTracker</span>
              <input type="text" className="tk-search-bar" placeholder="Search issues..." />
          </div>
          <div className="tk-nav-actions">
              <button className="tk-btn-dark" onClick={() => navigate('/')}>Dashboard</button>
              <div className="tk-avatar-small tk-black">{currentUser?.avatar || 'U'}</div>
          </div>
      </nav>

      <div className="tk-app-container-ticket">
          <aside className="tk-sidebar-nav">
              <h3>Navigation</h3>
              <ul>
                  <li className="tk-active" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>📋 Issues</li>
                  <li onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>📊 Dashboard</li>
              </ul>
          </aside>

          <main className="tk-main-content">
              <button className="tk-btn-back" onClick={() => navigate('/')}>← Back to project</button>
              
              {errorMessage && (
                <div style={{ color: 'white', background: 'var(--tk-danger)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontWeight: 'bold' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="tk-title-row">
                  <div className="tk-icon-alert">!</div>
                  <div>
                      <h1>{ticket.title}</h1>
                      <div className="tk-ticket-id">{id} • Syncing with data.db</div>
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
                          {ticket.description}
                      </p>

                      <hr className="tk-divider" />

                      <div className="tk-comments-section">
                          <h3>Discussion ({comments.length})</h3>
                          
                          <div className="tk-comments-list">
                              {comments.map((comment) => {
                                  const matchingUser = usersList.find(u => u.id === comment.authorId);
                                  const authorName = matchingUser ? `${matchingUser.firstName} ${matchingUser.lastName}` : "Unknown User";
                                  const initials = getInitials(authorName);

                                  return (
                                      <div key={comment.id} className="tk-comment-card">
                                          <div className="tk-comment-header">
                                              <div className={`tk-avatar-small ${comment.color || 'tk-blue'}`}>{initials}</div>
                                              <div>
                                                  <span className="tk-author">{authorName}</span>
                                                  <div className="tk-date">{comment.createdAt || comment.date || 'Just now'}</div>
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

                  <div>
                      <div className="tk-details-card">
                          <div className="tk-field">
                              <label>Status Lifecycle</label>
                              <select className="tk-dropdown-trigger" value={ticket.status} onChange={(e) => handleStatusChange(e.target.value as Status)}>
                                  {optionsStatus.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                          </div>

                          <div className="tk-field">
                              <label>Priority</label>
                              <select className="tk-dropdown-trigger" value={ticket.priority} onChange={(e) => handlePriorityChange(e.target.value as Priority)}>
                                  {optionsPriority.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>

                          <div className="tk-field">
                              <label>Assignee</label>
                              <select className="tk-dropdown-trigger" value={ticket.assigneeId} onChange={(e) => handleAssigneeChange(e.target.value)}>
                                  {usersList.map(u => (
                                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
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