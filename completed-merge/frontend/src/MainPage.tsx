import { useState, useEffect } from 'react';
import type { Issue, Notification } from './mainPageApi';
import { Sidebar } from './components/SideBar';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { IssueTable } from './components/IssueTable';
import { NewIssueModal } from './components/NewIssueModal';

export default function MainPage() {
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

  // Оправено съгласно сигнатурата на NewIssueModal: приема отделни аргументи
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

      // Оправено id да бъде string (заради първата грешка на скрийншота)
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        title: 'New Issue Created',
        desc: `Issue ${savedIssue.id || 'new'} was created by ${assigneeName}`, // Върнато към desc
        date: 'Just now',
        unread: true,
        type: 'assignment', // Променено на 'assignment' съгласно интерфейса ти
        targetId: savedIssue.id || ''
      };
      setNotifications(prev => [newNotif, ...prev]);

    } catch (error) {
      console.error("Грешка при създаване на задача:", error);
    }
  };

  const getFilteredIssues = () => {
    if (selectedIssueId) {
      return issues.filter(i => i.id === selectedIssueId);
    }

    let list = [...issues];

    if (activeTab === 'assigned') {
      list = list.filter(issue => issue.assignee?.name === CURRENT_USER);
    } else if (activeTab === 'starred') {
      list = list.filter(issue => issue.isFavorite);
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
    <div className="mp-app-container">
      <Header 
        issues={issues} 
        notifications={notifications} 
        setNotifications={setNotifications} // Върнат към чист State Setter (оправя грешка №4)
        onSelectIssue={(id) => setSelectedIssueId(id)}
        onOpenModal={() => setIsModalOpen(true)}
      />
      
      <div className="mp-main-layout">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="mp-content-area">
          <div className="mp-page-header">
            <div>
              <h1 className="mp-page-title">Issues List</h1>
              <p className="mp-page-subtitle">View and filter live issues connected to Node.js</p>
            </div>
            {selectedIssueId && (
              <button onClick={() => setSelectedIssueId(null)} className="mp-clear-search-btn">
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