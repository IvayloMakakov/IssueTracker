// frontend/src/components/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Issue, Notification } from '../types';

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

  // Търсене в реално време (Секция 6)
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
      case 'assignment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>;
      case 'mention': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.909A2.25 2.25 0 0 1 2.25 6.993V6.75m19.5 0v.36" /></svg>;
      case 'status': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
      case 'comment': return <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>;
      default: return '';
    }
  };

  return (
    <header className="h-16 border-b border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-20 bg-white">
      <div className="flex items-center gap-3 w-64 cursor-pointer" onClick={() => onSelectIssue(null)}>
        <div className="bg-slate-900 text-white font-bold text-xs p-1.5 rounded">IT</div>
        <span className="font-semibold text-lg">Issue Tracker</span>
      </div>
      
      {/* GLOBAL SEARCH */}
      <div ref={searchRef} className="flex-1 max-w-2xl px-4 relative">
        <div className="relative flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 absolute left-3 text-gray-400">
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
            className="w-full bg-gray-50 border border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-0 rounded-md py-1.5 pl-9 pr-4 text-sm transition-colors outline-none" 
            autoComplete="off"
          />
          
          {isSearchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md flex flex-col max-h-100 overflow-hidden z-50">
              <div className="px-4 py-2 border-b border-gray-100 text-xs text-gray-500 font-medium">
                {filteredSearch.length} results
              </div>
              <div className="overflow-y-auto p-2">
                {filteredSearch.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No matching issues found</div>
                ) : (
                  filteredSearch.map(issue => (
                    <div 
                      key={issue.id} 
                      onClick={() => { onSelectIssue(issue.id); setIsSearchOpen(false); setSearchQuery(''); }}
                      className="block p-3 hover:bg-gray-50 rounded-md transition-colors border-b border-gray-50 last:border-0 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-400">{issue.id}</span>
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-medium lowercase">{issue.status.replace(' ', '-')}</span>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{issue.title}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ACTIONS */}
      <div className="flex items-center gap-4">
        <button onClick={onOpenModal} id="new-issue-btn" type="button" className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-1.5 px-4 rounded-md flex items-center gap-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Issue
        </button>
        
        {/* BELL NOTIFICATIONS */}
        <div ref={notifRef} className="relative">
          <button onClick={() => setIsNotifOpen(!isNotifOpen)} id="bell-btn" type="button" className="relative text-gray-500 hover:text-gray-700 p-1">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" /></svg>
            {unreadCount > 0 && <span id="bell-badge" className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full border-2 border-white">{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div id="notifications-dropdown" className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-200 shadow-xl rounded-lg flex flex-col z-50 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="font-semibold text-gray-900 text-base">Notifications</h3>
                <button onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))} id="mark-all-read-btn" type="button" className="text-xs text-gray-600 hover:text-gray-900 font-medium">Mark all as read</button>
              </div>
              <div id="notifications-list" className="max-h-100 overflow-y-auto p-2 space-y-1 bg-white">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">You're all caught up!</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} onClick={() => { onSelectIssue(n.targetId); setIsNotifOpen(false); }} className="flex gap-3 p-3 bg-slate-50 hover:bg-gray-100 rounded-md cursor-pointer transition-colors relative group border border-gray-100 pr-10">
                      <div className="mt-0.5 text-gray-600">{getNotifIcon(n.type)}</div>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${n.unread ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{n.desc}</div>
                        <div className="text-[10px] text-gray-400 mt-1">{n.date}</div>
                      </div>
                      {n.unread && <div className="w-1.5 h-1.5 bg-slate-900 rounded-full absolute right-4 top-4 group-hover:hidden"></div>}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setNotifications(notifications.filter(notif => notif.id !== n.id)); }} 
                        type="button" 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <button className="bg-slate-900 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center">AJ</button>
      </div>
    </header>
  );
};