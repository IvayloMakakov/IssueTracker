import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Issue, Notification } from '../pages/MainPage/mainPageApi';

interface HeaderProps {
  currentUser: { firstName: string, lastName: string, email: string };
  issues: Issue[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onSelectIssue: (issueId: string | null) => void;
  onOpenModal: () => void;
  isSidebarOpen?: boolean;
  setIsSidebarOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentUser, issues, notifications, setNotifications, onSelectIssue, onOpenModal, isSidebarOpen, setIsSidebarOpen 
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

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

  const handleMarkAllAsRead = async () => {
    const token = localStorage.getItem('token');
    setNotifications(notifications.map(n => ({...n, unread: false})));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setIsNotifOpen(false);
    navigate(`/ticket/${notification.targetId}`);

    if (!notification.unread) return;

    setNotifications(prev =>
      prev.map(n => n.id === notification.id ? { ...n, unread: false } : n)
    );

    const token = localStorage.getItem('token');
    try {
      await fetch(`/api/notifications/${notification.id}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
      setNotifications(prev =>
        prev.map(n => n.id === notification.id ? { ...n, unread: true } : n)
      );
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation(); 
    const token = localStorage.getItem('token');
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    try {
      await fetch(`/api/notifications/${notifId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'assignment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
      case 'comment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3h9m-3 3h3l-3 3v-3h-9v-9h12v9z" /></svg>;
      case 'status': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
      default: return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    }
  };

  return (
    <>
      <header className="mp-global-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {setIsSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="mp-mobile-menu-toggle"
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'none', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem', color: '#0f172a' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}

          <div className="mp-header-logo-section" onClick={() => navigate('/')} style={{ width: 'auto' }}>
            <div className="mp-logo-badge">IT</div>
            <span className="mp-logo-text" style={{ display: isMobileSearchVisible ? 'none' : 'block' }}>Issue Tracker</span>
          </div>
        </div>
        
        <div 
          ref={searchRef} 
          className={`mp-search-wrapper ${isMobileSearchVisible ? 'mp-search-mobile-expanded' : ''}`}
          style={{ flex: 1, maxWidth: '42rem' }}
        >
          <div className="mp-search-input-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="mp-search-icon"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            <input 
              type="text" 
              placeholder="Search issues..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(e.target.value.trim() !== ''); }}
              className="mp-search-input" 
              autoComplete="off"
            />
            {isMobileSearchVisible && (
              <button 
                onClick={() => { setIsMobileSearchVisible(false); setSearchQuery(''); setIsSearchOpen(false); }}
                style={{ position: 'absolute', right: '10px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            )}
            {isSearchOpen && (
              <div className="mp-search-dropdown" style={{ width: '100%', position: 'absolute', top: '100%', zIndex: 100 }}>
                <div className="mp-search-dropdown-header">{filteredSearch.length} results</div>
                <div className="mp-search-results-list">
                  {filteredSearch.map(issue => (
                    <div key={issue.id} onClick={() => { navigate(`/ticket/${issue.id}`); setIsMobileSearchVisible(false); setIsSearchOpen(false); }} className="mp-search-result-item">
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

        <div className="mp-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            className="mp-mobile-search-trigger"
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: '#6b7280' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" style={{ width: '1.5rem', height: '1.5rem' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>

          <button onClick={onOpenModal} className="mp-primary-btn" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            <span className="mp-btn-text-desktop">New Issue</span>
            <span className="mp-btn-text-mobile" style={{ display: 'none' }}>+</span>
          </button>
          
          <div ref={notifRef} className="mp-bell-wrapper">
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="mp-bell-trigger">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-bell-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
              {unreadCount > 0 && (
                <span className="mp-bell-badge" style={{ backgroundColor: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', padding: unreadCount > 5 ? '2px 6px' : '2px 5px', borderRadius: unreadCount > 5 ? '10px' : '50%', position: 'absolute', top: '-4px', right: '-4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {unreadCount > 5 ? '5+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div id="notifications-dropdown" className="mp-notifications-dropdown" style={{ position: 'absolute', right: 0, top: '100%', width: '280px' }}>
                <div className="mp-notif-dropdown-header">
                  <h3 className="mp-notif-dropdown-title">Notifications</h3>
                  <button onClick={handleMarkAllAsRead} className="mp-mark-read-btn">Mark all as read</button>
                </div>
                <div className="mp-notifications-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div className="mp-notif-empty-state">You're all caught up!</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} onClick={() => handleNotificationClick(n)} className="mp-notif-card" style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: n.unread ? '#f8fafc' : '#ffffff' }}>
                        <div style={{ width: '8px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                          {n.unread && <div className="mp-notif-unread-dot" style={{ position: 'static', width: '8px', height: '8px', backgroundColor: '#3b82f6', borderRadius: '50%' }}></div>}
                        </div>
                        <div className="mp-notif-icon-container" style={{ flexShrink: 0 }}>{getNotifIcon(n.type)}</div>
                        <div className="mp-notif-content" style={{ paddingRight: '24px', flexGrow: 1 }}>
                          <div className={`mp-notif-title ${n.unread ? 'mp-unread' : ''}`} style={{ fontWeight: n.unread ? 600 : 400 }}>{n.title}</div>
                          <div className="mp-notif-desc" style={{ fontSize: '0.8rem', color: n.unread ? '#1e293b' : '#64748b' }}>{n.desc}</div>
                          <div className="mp-notif-date" style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '4px' }}>{n.date}</div>
                        </div>
                        <button onClick={(e) => handleDeleteNotification(e, n.id)} style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: '8px', background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.85rem', padding: '4px' }}>✕</button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div ref={profileRef} style={{ position: 'relative' }}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="mp-user-avatar-btn mp-bg-blue">
              {initials}
            </button>
            {isProfileOpen && (
              <div className="mp-profile-dropdown" style={{ position: 'absolute', right: 0, top: '100%' }}>
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

      {isEditProfileModalOpen && (
        <EditProfileModal user={currentUser} onClose={() => setIsEditProfileModalOpen(false)} />
      )}
    </>
  );
};

const EditProfileModal = ({ user, onClose }: any) => {
  const [fName, setFName] = useState(user.firstName);
  const [lName, setLName] = useState(user.lastName);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

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
        body: JSON.stringify({ firstName: fName, lastName: lName, currentPassword: currentPass, newPassword: newPass })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Грешка при запазване на профила.');
        return;
      }
      window.location.reload();
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
};