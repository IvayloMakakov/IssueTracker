// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import type { Issue, Notification } from './types';
import { Sidebar } from './components/SideBar';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { IssueTable } from './components/IssueTable';
import { NewIssueModal } from './components/NewIssueModal';

function App() {
  // Инициализираме състоянията като празни масиви – данните ще дойдат от сървъра
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
    fetch('http://localhost:5000/api/issues')
      .then(res => res.json())
      .then(data => setIssues(data))
      .catch(err => console.error("Грешка при зареждане на задачите:", err));

    fetch('http://localhost:5000/api/notifications')
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
      await fetch(`http://localhost:5000/api/issues/${id}`, {
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
      const response = await fetch('http://localhost:5000/api/issues', {
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

  const handleNotificationsChange = (update: React.SetStateAction<Notification[]>) => {
    const nextNotifs = typeof update === 'function' ? update(notifications) : update;

    if (nextNotifs.length < notifications.length) {
      const deletedItem = notifications.find(n => !nextNotifs.some(next => next.id === n.id));
      if (deletedItem) {
        fetch(`http://localhost:5000/api/notifications/${deletedItem.id}`, { method: 'DELETE' })
          .catch(err => console.error("Грешка при триене на известие:", err));
      }
    } else if (nextNotifs.every(n => !n.unread) && notifications.some(n => n.unread)) {
      fetch('http://localhost:5000/api/notifications/read-all', { method: 'PATCH' })
        .catch(err => console.error("Грешка при маркиране на всички:", err));
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
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans antialiased overflow-hidden">
      <Header 
        issues={issues} 
        notifications={notifications} 
        setNotifications={handleNotificationsChange}
        onSelectIssue={(id) => setSelectedIssueId(id)}
        onOpenModal={() => setIsModalOpen(true)}
      />
      
      <div className="flex flex-1 overflow-hidden relative z-10">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        
        <main className="flex-1 flex flex-col min-w-0 bg-white p-8 overflow-y-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Issues List</h1>
            <p className="text-sm text-gray-500 mt-1">View and filter live issues connected to Node.js</p>
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