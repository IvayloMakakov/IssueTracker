// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import type { Issue, Notification } from './types';
import { Sidebar } from './components/SideBar';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { IssueTable } from './components/IssueTable';
import { NewIssueModal } from './components/NewIssueModal';

function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // UI Състояния
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Състояния на филтрите
  const [activeTab, setActiveTab] = useState('all'); 
  const [activeStatus, setActiveStatus] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [activeType, setActiveType] = useState('All');
  const CURRENT_USER = 'Alice Johnson';

  useEffect(() => {
    fetch('/api/issues')
      .then(res => res.json())
      .then(data => setIssues(data))
      .catch(err => console.error("Грешка при зареждане на задачите:", err));

    fetch('/api/notifications')
      .then(res => res.json())
      .then(data => setNotifications(data))
      .catch(err => console.error("Грешка при зареждане на известията:", err));
  }, []);

  const handleToggleFavorite = async (id: string) => {
    const targetIssue = issues.find(i => i.id === id);
    if (!targetIssue) return;

    const nextFavoriteState = !targetIssue.isFavorite;
    setIssues(prev => prev.map(i => i.id === id ? { ...i, isFavorite: nextFavoriteState } : i));

    try {
      await fetch(`/api/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: nextFavoriteState })
      });
    } catch (error) {
      console.error("Грешка при обновяване на звездата:", error);
      setIssues(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !nextFavoriteState } : i));
    }
  };

  const handleCreateIssue = async (
    title: string, 
    type: Issue['type'], 
    priority: Issue['priority'], 
    status: Issue['status'], 
    assigneeName: string
  ) => {
    const payload = { title, type, priority, status, assigneeName };

    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const savedIssue = await response.json();
      setIssues(prev => [savedIssue, ...prev]);
    } catch (error) {
      console.error("Грешка при създаване на задача:", error);
    }
  };

  const handleNotificationsChange = async (update: React.SetStateAction<Notification[]>) => {
    const nextNotifs = typeof update === 'function' ? update(notifications) : update;

    if (nextNotifs.every(n => !n.unread) && notifications.some(n => n.unread)) {
      try {
        const response = await fetch('/api/notifications/read-all', { method: 'PATCH' });
        const updatedNotifsFromServer = await response.json();
        setNotifications(updatedNotifsFromServer);
        return;
      } catch (err) {
        console.error("Грешка при маркиране на всички:", err);
      }
    }

    setNotifications(nextNotifs);
  };

  const getFilteredIssues = () => {
    if (selectedIssueId) {
      return issues.filter(i => i.id === selectedIssueId);
    }

    let list = [...issues];

    if (activeTab === 'assigned') {
      list = list.filter(issue => issue.assignee?.name === CURRENT_USER);
    } else if (activeTab === 'recent') {
      list = list.sort((a, b) => b.id.localeCompare(a.id));
    } else if (activeTab === 'created' || activeTab === 'watched') {
      list = [];
    }

    if (activeStatus !== 'All') list = list.filter(i => i.status === activeStatus);
    if (activePriority !== 'All') list = list.filter(i => i.priority === activePriority);
    if (activeType !== 'All') list = list.filter(i => i.type === activeType);

    return list;
  };

  return (
    <div className="app-container">
      <Header 
        issues={issues} 
        notifications={notifications} 
        setNotifications={handleNotificationsChange}
        onSelectIssue={(id) => setSelectedIssueId(id)}
        onOpenModal={() => setIsModalOpen(true)}
      />
      
      <div className="main-layout">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="content-area">
          <div className="page-header">
            <div>
              <h1 className="page-title">Issues List</h1>
              <p className="page-subtitle">View and filter live issues connected to Node.js</p>
            </div>
            {selectedIssueId && (
              <button onClick={() => setSelectedIssueId(null)} className="clear-search-btn">
                Clear Search Filter ✕
              </button>
            )}
          </div>

          <FiltersBar 
            activeTab={activeTab} setActiveTab={setActiveTab}
            activeStatus={activeStatus} setActiveStatus={setActiveStatus}
            activePriority={activePriority} setActivePriority={setActivePriority}
            activeType={activeType} setActiveType={setActiveType}
          />

          <IssueTable issues={getFilteredIssues()} onToggleFavorite={handleToggleFavorite} />
        </main>
      </div>

      <NewIssueModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateIssue} />
    </div>
  );
}

export default App;