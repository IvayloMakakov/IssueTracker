import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Issue, Notification } from './mainPageApi';
import { Sidebar } from './components/SideBar';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { IssueTable } from './components/IssueTable';
import { NewIssueModal } from './components/NewIssueModal';
import './mainPage.css';

export default function MainPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Данни за текущия потребител
  const [currentUser, setCurrentUser] = useState<{ id: number, firstName: string, lastName: string, email: string } | null>(null);

  // UI Състояния
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  // Състояния на филтрите
  const [activeTab, setActiveTab] = useState('all'); 
  const [activeStatus, setActiveStatus] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [activeType, setActiveType] = useState('All');

  useEffect(() => {
    // 1. ПРОВЕРКА ЗА ТОКЕН И ИЗВЛИЧАНЕ НА ПОТРЕБИТЕЛЯ (Това липсваше!)
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(user => setCurrentUser(user))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login');
      });

    // 2. Взимане на задачите със защита (Поправената част от миналия път)
    fetch('/api/issues')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setIssues(data);
        } else {
          console.error("Сървърът върна грешка вместо списък със задачи:", data);
          setIssues([]);
        }
      })
      .catch(err => {
        console.error("Грешка при зареждане на задачите:", err);
        setIssues([]);
      });

    // 3. Взимане на известията със защита
    // fetch('/api/notifications')
    //   .then(res => res.json())
    //   .then(data => {
    //     if (Array.isArray(data)) {
    //       setNotifications(data);
    //     } else {
    //       setNotifications([]);
    //     }
    //   })
    //   .catch(err => {
    //     console.error("Грешка при зареждане на известията:", err);
    //     setNotifications([]);
    //   });
  }, [navigate]);

  const handleToggleFavorite = async (id: string) => {
    const targetIssue = issues.find(i => i.id === id);
    if (!targetIssue) return;
    const nextFavoriteState = !targetIssue.isFavorite;
    setIssues(prev => prev.map(i => i.id === id ? { ...i, isFavorite: nextFavoriteState } : i));
    
    try {
      await fetch(`/api/ticket`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        // ДОБАВЕНО id: id ТУК
        body: JSON.stringify({ id: id, field: 'isFavorite', value: nextFavoriteState }) 
      });
    } catch (error) {
      setIssues(prev => prev.map(i => i.id === id ? { ...i, isFavorite: !nextFavoriteState } : i));
    }
  };

  const handleCreateIssue = (title: string, type: any, priority: any, status: any, assigneeName: string) => {
    // 1. Взимаме токена от браузъра
    const token = localStorage.getItem('token');

    fetch('/api/issues', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 2. Изпращаме го към бекенда!
      },
      body: JSON.stringify({ title, type, priority, status, assigneeName })
    })
    .then(res => res.json())
    .then(newIssue => {
      if (newIssue.error) {
        console.error(newIssue.error);
        return;
      }
      setIssues(prev => [newIssue, ...prev]);
    })
    .catch(err => console.error('Грешка при създаване на задача:', err));
  };

  const getFilteredIssues = () => {
    if (selectedIssueId) return issues.filter(i => i.id === selectedIssueId);

    let list = [...issues];
    const userFullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '';

    if (activeTab === 'assigned') {
      list = list.filter(issue => issue.assignee?.name === userFullName);
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

  if (!currentUser) return <div>Loading...</div>;

  return (
    <div className="mp-app-container">
      <Header 
        currentUser={currentUser}
        issues={issues} 
        notifications={notifications} 
        setNotifications={setNotifications} 
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