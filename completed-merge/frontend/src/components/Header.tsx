// frontend/src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Issue, Notification } from '../mainPageApi';

interface HeaderProps {
  currentUser: { firstName: string, lastName: string, email: string };
  issues: Issue[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onSelectIssue: (issueId: string | null) => void;
  onOpenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, issues, notifications, setNotifications, onSelectIssue, onOpenModal }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const filteredSearch = issues.filter(issue =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => n.unread).length;
  const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setIsProfileOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'assignment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
      case 'mention': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75m19.5 0v.36" /></svg>;
      default: return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
    }
  };

  return (
    <>
      <header className="mp-global-header">
        <div className="mp-header-logo-section" onClick={() => navigate('/')}>
          <div className="mp-logo-badge">IT</div>
          <span className="mp-logo-text">Issue Tracker</span>
        </div>
        
        {/* ТЪРСАЧКА */}
        <div ref={searchRef} className="mp-search-wrapper">
          <div className="mp-search-input-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="mp-search-icon"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input 
              type="text" 
              placeholder="Search issues by ID, title, or keywords..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(e.target.value.trim() !== ''); }}
              className="mp-search-input" 
              autoComplete="off"
            />
            {isSearchOpen && (
              <div className="mp-search-dropdown">
                <div className="mp-search-dropdown-header">{filteredSearch.length} results</div>
                <div className="mp-search-results-list">
                  {filteredSearch.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => navigate(`/ticket/${issue.id}`)}
                      className="mp-search-result-item"
                    >
                      <div className="mp-search-result-meta">
                        <span className="mp-search-result-id">{issue.id}</span>
                        <span className="mp-search-result-status">{issue.status.replace(' ', '-')}</span>
                      </div>
                      <div className="mp-search-result-title">{issue.title}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ACTIONS */}
        <div className="mp-header-actions">
          <button onClick={onOpenModal} className="mp-primary-btn">New Issue</button>
          
          {/* НОТИФИКАЦИИ */}
          <div ref={notifRef} className="mp-bell-wrapper">
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="mp-bell-trigger">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-bell-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
              {unreadCount > 0 && <span className="mp-bell-badge">{unreadCount > 5 ? '5+' : unreadCount}</span>}
            </button>

            {/* ВЪРНАТОТО МЕНЮ ЗА НОТИФИКАЦИИ */}
            {isNotifOpen && (
              <div id="notifications-dropdown" className="mp-notifications-dropdown">
                <div className="mp-notif-dropdown-header">
                  <h3 className="mp-notif-dropdown-title">Notifications</h3>
                  <button onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))} className="mp-mark-read-btn">Mark all as read</button>
                </div>
                <div className="mp-notifications-list">
                  {notifications.length === 0 ? (
                    <div className="mp-notif-empty-state">You're all caught up!</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => { navigate(`/ticket/${n.targetId}`); setIsNotifOpen(false); }} className="mp-notif-card">
                        <div className="mp-notif-icon-container">{getNotifIcon(n.type)}</div>
                        <div className="mp-notif-content">
                          <div className={`mp-notif-title ${n.unread ? 'mp-unread' : ''}`}>{n.title}</div>
                          <div className="mp-notif-desc">{n.desc}</div>
                          <div className="mp-notif-date">{n.date}</div>
                        </div>
                        {n.unread && <div className="mp-notif-unread-dot"></div>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ПРОФИЛ МЕНЮ */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="mp-user-avatar-btn mp-bg-blue">
              {initials}
            </button>
            {isProfileOpen && (
              <div className="mp-profile-dropdown">
                <div className="mp-profile-header">
                  <strong>{currentUser.firstName} {currentUser.lastName}</strong>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{currentUser.email}</div>
                </div>
                <button onClick={() => { setIsProfileOpen(false); setIsEditProfileModalOpen(true); }} className="mp-profile-item">Edit Profile</button>
                <button onClick={handleLogout} className="mp-profile-item mp-text-red">Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* МОДАЛ ЗА РЕДАКТИРАНЕ НА ПРОФИЛ */}
      {isEditProfileModalOpen && (
        <EditProfileModal 
          user={currentUser} 
          onClose={() => setIsEditProfileModalOpen(false)} 
        />
      )}
    </>
  );
};

// --- КОМПОНЕНТ ЗА РЕДАКЦИЯ НА ПРОФИЛА ---
const EditProfileModal = ({ user, onClose }: any) => {
  const [fName, setFName] = useState(user.firstName);
  const [lName, setLName] = useState(user.lastName);
  
  // Нови полета за паролите
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // ВАЛИДАЦИИ
    if (newPass || confirmPass) {
      if (!currentPass) {
        setErrorMsg('Моля, въведете текущата си парола!');
        return;
      }
      if (newPass !== confirmPass) {
        setErrorMsg('Новата парола и потвърждението не съвпадат!');
        return;
      }
      if (newPass.length < 8) {
        setErrorMsg('Новата парола трябва да е поне 8 символа!');
        return;
      }
    }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          firstName: fName, 
          lastName: lName, 
          currentPassword: currentPass, 
          newPassword: newPass 
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Грешка при запазване на профила.');
        return;
      }

      window.location.reload(); // Презарежда след успешен запис
    } catch (err) {
      setErrorMsg('Сървърна грешка. Моля опитайте по-късно.');
    }
  };

  return (
    <div className="mp-modal-overlay">
      <div onClick={onClose} className="mp-modal-backdrop"></div>
      <div className="mp-modal-box" style={{ maxWidth: '24rem', padding: '1.5rem', overflow: 'visible' }}>
        <h2 className="mp-modal-title" style={{ marginBottom: '1rem' }}>Edit Profile</h2>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}><label className="mp-form-label">First Name</label><input required value={fName} onChange={(e)=>setFName(e.target.value)} className="mp-form-input" /></div>
            <div style={{ flex: 1 }}><label className="mp-form-label">Last Name</label><input required value={lName} onChange={(e)=>setLName(e.target.value)} className="mp-form-input" /></div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '0.5rem 0' }}/>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>Change Password (leave blank to keep current)</p>

          <div><label className="mp-form-label">Current Password</label><input type="password" value={currentPass} onChange={(e)=>setCurrentPass(e.target.value)} className="mp-form-input" /></div>
          <div><label className="mp-form-label">New Password</label><input type="password" value={newPass} onChange={(e)=>setNewPass(e.target.value)} className="mp-form-input" /></div>
          <div><label className="mp-form-label">Confirm New Password</label><input type="password" value={confirmPass} onChange={(e)=>setConfirmPass(e.target.value)} className="mp-form-input" /></div>

          {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 500 }}>⚠️ {errorMsg}</div>}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={onClose} className="mp-btn-secondary">Cancel</button>
            <button type="submit" className="mp-btn-primary-submit" style={{ flex: 1 }}>Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}