import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTicketData, updateTicketField, addTicketComment, fetchAllUsers, deleteTicket } from './ticketApi';
import { Header } from '../../components/Header';
import type { Issue, Notification } from '../MainPage/mainPageApi';
import './ticket.css';
import '../MainPage/mainPage.css';

type Status = "Backlog" | "To Do" | "In Progress" | "In Review" | "Done";
type Priority = "Low" | "Medium" | "High" | "Urgent";

interface DbUser {
  id: number;
  firstName: string;
  lastName: string;
}

const optionsPriority: Priority[] = ["Low", "Medium", "High", "Urgent"];
const allowedNextStatus: Record<Status, Status[]> = {
  "Backlog": ["Backlog", "To Do"],
  "To Do": ["To Do", "In Progress"],
  "In Progress": ["In Progress", "In Review"],
  "In Review": ["In Review", "Done"],
  "Done": ["Done"]
};

const getInitials = (authorName: string) => {
  if (!authorName) return "U";
  return authorName.split(' ').map(w => w.charAt(0)).join('').toUpperCase().substring(0, 2);
};

export default function Ticket() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [headerUser, setHeaderUser] = useState<{ id: number; firstName: string; lastName: string; email: string } | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [ticket, setTicket] = useState<{dbId: number, title: string, description: string, status: Status, priority: Priority, assigneeId: number, updatedAt: string} | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usersList, setUsersList] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [editDescValue, setEditDescValue] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const reloadTicketData = () => {
    if (!id) return;
    fetchTicketData(id)
      .then(data => {
        setTicket(prev => prev ? {
          ...prev,
          dbId: data.id,
          status: data.status || "To Do",
          priority: data.priority || "Medium",
          assigneeId: Number(data.assigneeId || 1),
          updatedAt: data.updatedAt || ""
        } : null);
        setComments(data.comments || []);
      })
      .catch(err => console.error(err));
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(user => setHeaderUser(user))
        .catch(() => {});

    fetch('/api/issues', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setAllIssues(data); })
        .catch(() => {});

    fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (Array.isArray(data)) setNotifications(data); })
        .catch(() => {});

    Promise.all([fetchTicketData(id), fetchAllUsers()])
      .then(([data, users]) => {
        setUsersList(users);
        setTicket({
          dbId: data.id,
          title: data.title,
          description: data.description || "Няма описание.",
          status: data.status || "To Do",
          priority: data.priority || "Medium",
          assigneeId: Number(data.assigneeId || 1),
          updatedAt: data.updatedAt || ""
        });
        setEditTitleValue(data.title);
        setEditDescValue(data.description || "Няма описание.");
        setComments(data.comments || []);
        setLoading(false);
      })
      .catch(err => {
        setErrorMessage(err.message);
        setLoading(false);
      });
  }, [id, navigate]);

  const handleSaveTitle = () => {
    if (!id || !ticket || !editTitleValue.trim()) {
      setIsEditingTitle(false);
      return;
    }
    if (editTitleValue === ticket.title) {
      setIsEditingTitle(false);
      return;
    }

    updateTicketField(id, 'title', editTitleValue.trim())
      .then(() => {
        setTicket(prev => prev ? { ...prev, title: editTitleValue.trim() } : null);
        setIsEditingTitle(false);
        reloadTicketData();
      })
      .catch(err => {
        setErrorMessage(err.message || "Грешка при обновяване.");
        setIsEditingTitle(false);
      });
  };

  const handleSaveDescription = () => {
    if (!id || !ticket) {
      setIsEditingDesc(false);
      return;
    }
    if (editDescValue === ticket.description) {
      setIsEditingDesc(false);
      return;
    }

    updateTicketField(id, 'description', editDescValue.trim())
      .then(() => {
        setTicket(prev => prev ? { ...prev, description: editDescValue.trim() } : null);
        setIsEditingDesc(false);
        reloadTicketData();
      })
      .catch(err => {
        setErrorMessage(err.message || "Грешка при обновяване.");
        setIsEditingDesc(false);
      });
  };

  const handleStatusChange = (newStatus: Status) => {
    if (!ticket || !id) return;
    setErrorMessage(null);

    updateTicketField(id, 'status', newStatus)
      .then((res) => {
        if (res && res.success === false) {
          setErrorMessage(res.message);
        } else {
          reloadTicketData();
        }
      })
      .catch(err => {
        setErrorMessage(err.message || "Неуспешна промяна.");
      });
  };

  const handlePriorityChange = (newPriority: Priority) => {
    if (!ticket || !id) return;
    updateTicketField(id, 'priority', newPriority)
      .then(() => reloadTicketData())
      .catch(err => console.error(err));
  };

  const handleAssigneeChange = (selectedId: string) => {
    if (!ticket || !id) return;
    const dbValue = Number(selectedId);

    updateTicketField(id, 'assignee', dbValue)
      .then((res) => {
        if (res && (res.error || res.success === false)) {
          setErrorMessage(res.message);
        } else {
          reloadTicketData();
        }
      })
      .catch(err => console.error(err));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !id || !headerUser) return;

    const authorFullName = `${headerUser.firstName} ${headerUser.lastName}`;

    addTicketComment(id, newCommentText, authorFullName)
      .then(res => {
        const savedComment = res.comment || res;
        setComments(prev => [...prev, savedComment]);
        setNewCommentText("");
      })
      .catch(err => console.error(err));
  };

  const handleConfirmDelete = () => {
    if (!ticket || !ticket.dbId) return;
    setErrorMessage(null);
    setShowDeleteConfirm(false);

    deleteTicket(ticket.dbId)
      .then(() => {
        navigate('/');
      })
      .catch(err => {
        setErrorMessage(err.message || "Грешка при изтриване.");
      });
  };

  if (loading) {
    return <div className="mp-app-container"><div>Loading ticket details...</div></div>;
  }

  return (
    <div className="mp-app-container" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {headerUser && (
        <Header
          currentUser={headerUser}
          issues={allIssues}
          notifications={notifications}
          setNotifications={setNotifications}
          onSelectIssue={() => {}}
          onOpenModal={() => navigate('/')}
        />
      )}

      {showDeleteConfirm && (
        <div className="tk-confirm-overlay">
          <div className="tk-confirm-modal">
            <h3>Изтриване на задача</h3>
            <p>Сигурни ли сте, че искате да изтриете задача "{ticket?.title}"? Това действие е необратимо.</p>
            <div className="tk-confirm-actions">
              <button onClick={() => setShowDeleteConfirm(false)} className="mp-btn-secondary">Отказ</button>
              <button onClick={handleConfirmDelete} className="tk-btn-danger">Да, изтрий</button>
            </div>
          </div>
        </div>
      )}

      <div className="tk-app-container-ticket">
          <main className="tk-main-content">
              <button className="tk-btn-back" onClick={() => navigate('/')}>← Back to project</button>

              {errorMessage && (
                <div style={{ color: 'white', background: 'var(--tk-danger)', padding: '12px', borderRadius: '6px', marginBottom: '16px', fontWeight: 'bold' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              <div className="tk-title-row">
                  <div style={{ flex: 1 }}>
                      {isEditingTitle ? (
                        <input
                          type="text"
                          className="mp-form-input"
                          style={{ fontSize: '1.75rem', fontWeight: 700, padding: '4px 8px' }}
                          value={editTitleValue}
                          onChange={(e) => setEditTitleValue(e.target.value)}
                          onBlur={handleSaveTitle}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleSaveTitle(); }}
                          autoFocus
                        />
                      ) : (
                        <h1
                          className="mp-page-title tk-editable"
                          style={{ fontSize: '1.75rem', cursor: 'pointer' }}
                          onClick={() => setIsEditingTitle(true)}
                        >
                          {ticket?.title}
                        </h1>
                      )}
                      <div className="tk-ticket-id" style={{ marginTop: '4px' }}>{id}</div>
                  </div>
              </div>

              <div className="tk-badges">
                  <span className="tk-badge tk-flex-align">
                     Status: <strong className="tk-text-blue" style={{ marginLeft: '4px' }}>{ticket?.status}</strong>
                  </span>
                  <span className="tk-badge">Priority: <strong style={{ marginLeft: '4px' }}>{ticket?.priority}</strong></span>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '1rem', height: '1rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Последна промяна: <strong>{ticket?.updatedAt}</strong></span>
              </div>

              <div className="tk-layout-grid">
                  <div>
                      <h3 style={{ fontWeight: 600, color: '#111827' }}>Description</h3>

                      {isEditingDesc ? (
                        <textarea
                          className="mp-form-input tk-mt-2"
                          style={{ minHeight: '120px', resize: 'none', padding: '8px', lineHeight: '1.6', fontFamily: 'inherit' }}
                          value={editDescValue}
                          onChange={(e) => setEditDescValue(e.target.value)}
                          onBlur={handleSaveDescription}
                          autoFocus
                        />
                      ) : (
                        <p
                          className="tk-description-text tk-mt-2 tk-editable"
                          style={{ cursor: 'pointer', padding: '8px', borderRadius: '4px' }}
                          onClick={() => setIsEditingDesc(true)}
                        >
                          {ticket?.description}
                        </p>
                      )}

                      <hr className="tk-divider" />

                      <div className="tk-comments-section">
                          <h3 style={{ fontWeight: 600, color: '#111827' }}>Discussion ({comments.length})</h3>

                          <div className="tk-comments-list">
                              {comments.map((comment) => {
                                  const isSystem = comment.authorId === 0 || comment.content?.startsWith('[SYSTEM]');
                                  const cleanContent = isSystem
                                    ? comment.content.replace('[SYSTEM]', '').trim()
                                    : comment.content || comment.text;

                                  const matchingUser = usersList.find(u => u.id === comment.authorId);
                                  const authorName = matchingUser ? `${matchingUser.firstName} ${matchingUser.lastName}` : "Unknown User";
                                  const initials = getInitials(authorName);

                                  if (isSystem) {
                                    return (
                                      <div key={comment.id} className="tk-system-log-card">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                          <span>System Log</span>
                                          <span>{cleanContent}</span>
                                        </div>
                                        <div>{comment.createdAt || 'Just now'}</div>
                                      </div>
                                    );
                                  }

                                  return (
                                      <div key={comment.id} className="tk-comment-card" style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                                          <div className="tk-comment-header">
                                              <div className="mp-avatar-circle" style={{ background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: '0.8rem', width: '2rem', height: '2rem' }}>
                                                {initials}
                                              </div>
                                              <div>
                                                  <span className="tk-author" style={{ color: '#111827' }}>{authorName}</span>
                                                  <div className="tk-date">{comment.createdAt || 'Just now'}</div>
                                              </div>
                                          </div>
                                          <p style={{ color: '#374151', marginTop: '8px', fontSize: '0.925rem' }}>{cleanContent}</p>
                                      </div>
                                  );
                              })}
                          </div>

                          <div className="tk-add-comment-box tk-mt-4" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                              <form onSubmit={handleAddComment}>
                                  <textarea
                                    className="mp-form-input"
                                    style={{ minHeight: '100px', backgroundColor: '#ffffff', border: '1px solid #d1d5db', resize: 'none' }}
                                    placeholder="Add a comment or feedback..."
                                    value={newCommentText}
                                    onChange={(e) => setNewCommentText(e.target.value)}
                                  />
                                  <button type="submit" className="mp-btn-primary-submit tk-mt-2">Comment</button>
                              </form>
                          </div>
                      </div>
                  </div>

                  <div>
                      <div className="tk-details-card" style={{ backgroundColor: '#f9fafb', borderColor: '#e5e7eb' }}>
                          <div className="tk-field">
                              <label className="mp-form-label mp-font-bold">Status Lifecycle</label>
                              <select
                                className="mp-form-select"
                                value={ticket?.status}
                                onChange={(e) => handleStatusChange(e.target.value as Status)}
                              >
                                  {ticket && allowedNextStatus[ticket.status].map(s => (
                                      <option key={s} value={s}>{s}</option>
                                  ))}
                              </select>
                          </div>

                          <div className="tk-field">
                              <label className="mp-form-label mp-font-bold">Priority</label>
                              <select className="mp-form-select" value={ticket?.priority} onChange={(e) => handlePriorityChange(e.target.value as Priority)}>
                                  {optionsPriority.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                          </div>

                          <div className="tk-field">
                              <label className="mp-form-label mp-font-bold">Assignee</label>
                              <select className="mp-form-select" value={ticket?.assigneeId} onChange={(e) => handleAssigneeChange(e.target.value)}>
                                  {usersList.map(u => (
                                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                  ))}
                              </select>
                          </div>
                      </div>

                      <button onClick={() => setShowDeleteConfirm(true)} className="tk-btn-danger tk-w-full tk-mt-4" style={{ borderRadius: '0.5rem', padding: '0.625rem' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{width: '1.1rem', height: '1.1rem'}}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Delete Issue
                      </button>
                  </div>
              </div>
          </main>
      </div>
    </div>
  );
}