// frontend/src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Issue, Notification } from '../mainPageApi';

interface HeaderProps {
  issues: Issue[];
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  onSelectIssue: (issueId: string | null) => void;
  onOpenModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ issues, notifications, setNotifications, onSelectIssue, onOpenModal }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Търсене в реално време
  const filteredSearch = issues.filter(issue =>
    issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
    };
    document.addEventListener('mousedown', clickOutside);
    return () => document.removeEventListener('mousedown', clickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch(type) {
      case 'assignment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
      case 'mention': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75m19.5 0v.36" /></svg>;
      case 'status': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
      case 'comment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
      default: return '';
    }
  };

  return (
    <header className="global-header">
      <div className="header-logo-section" onClick={() => onSelectIssue(null)}>
        <div className="logo-badge">IT</div>
        <span className="logo-text">Issue Tracker</span>
      </div>
      
      {/* GLOBAL SEARCH */}
      <div ref={searchRef} className="search-wrapper">
        <div className="search-input-container">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="search-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search issues by ID, title, or keywords..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(e.target.value.trim() !== '');
            }}
            className="search-input" 
            autoComplete="off"
          />
          
          {isSearchOpen && (
            <div className="search-dropdown">
              <div className="search-dropdown-header">
                {filteredSearch.length} results
              </div>
              <div className="search-results-list">
                {filteredSearch.length === 0 ? (
                  <div className="search-no-results">No matching issues found</div>
                ) : (
                  filteredSearch.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => { onSelectIssue(issue.id); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="search-result-item"
                    >
                      <div className="search-result-meta">
                        <span className="search-result-id">{issue.id}</span>
                        <span className="search-result-status">{issue.status.replace(' ', '-')}</span>
                      </div>
                      <div className="search-result-title">{issue.title}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="header-actions">
        <button onClick={onOpenModal} id="new-issue-btn" type="button" className="primary-btn">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="icon-small"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Issue
        </button>
        
        {/* BELL NOTIFICATIONS */}
        <div ref={notifRef} className="bell-wrapper">
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} id="bell-btn" type="button" className="bell-trigger">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="bell-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            {unreadCount > 0 && <span id="bell-badge" className="bell-badge">{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div id="notifications-dropdown" className="notifications-dropdown">
              <div className="notif-dropdown-header">
                <h3 className="notif-dropdown-title">Notifications</h3>
                <button onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))} id="mark-all-read-btn" type="button" className="mark-read-btn">Mark all as read</button>
              </div>
              <div id="notifications-list" className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="notif-empty-state">You're all caught up!</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => { onSelectIssue(n.targetId); setIsNotifOpen(false); }} className="notif-card">
                      <div className="notif-icon-container">{getNotifIcon(n.type)}</div>
                      <div className="notif-content">
                        <div className={`notif-title ${n.unread ? 'unread' : ''}`}>{n.title}</div>
                        <div className="notif-desc">{n.desc}</div>
                        <div className="notif-date">{n.date}</div>
                      </div>
                      {n.unread && <div className="notif-unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="user-avatar-btn">AJ</button>
      </div>
    </header>
  );
};