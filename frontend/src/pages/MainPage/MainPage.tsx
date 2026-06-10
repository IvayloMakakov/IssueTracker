import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Issue, Notification } from './mainPageApi';
import { Header } from '../../components/Header';
import { FiltersBar } from './components/FiltersBar';
import { IssueTable } from './components/IssueTable';
import { NewIssueModal } from './components/NewIssueModal';
import './mainPage.css';

export default function MainPage() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [currentUser, setCurrentUser] = useState<{ id: number, firstName: string, lastName: string, email: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('all');
  const [activeStatus, setActiveStatus] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [activeType, setActiveType] = useState('All');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('/api/me', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401 || res.status === 404) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Invalid session');
        }
        if (!res.ok) throw new Error('Server Error');
        return res.json();
      })
      .then(user => setCurrentUser(user))
      .catch((err) => {
        console.error("Проблем при проверка на сесията:", err);
      });

    fetch('/api/issues', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
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

    const fetchNotifications = () => {
      fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setNotifications(data);
          } else {
            setNotifications([]);
          }
        })
        .catch(err => {
          console.error("Грешка при зареждане на известията:", err);
          setNotifications([]);
        });
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleToggleFavorite = async (id: string) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/issues/favorite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ issueDisplayId: id })
      });

      if (!response.ok) throw new Error('Сървърна грешка при обновяване на любими');
      const data = await response.json();

      if (data.success) {
        setIssues(prevIssues =>
          prevIssues.map(issue =>
            issue.id === id ? { ...issue, isFavorite: data.isFavorite } : issue
          )
        );
      }
    } catch (error) {
      console.error("Грешка при синхронизация на любима задача:", error);
    }
  };

  const handleCreateIssue = (
    title: string,
    description: string,
    type: any,
    priority: any,
    status: any,
    assigneeName: string
  ) => {
    const token = localStorage.getItem('token');

    fetch('/api/issues', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, type, priority, status, assigneeName })
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
    } else if (activeTab === 'starred' || activeTab === 'watched') {
      list = list.filter(issue => issue.isFavorite);
    } else if (activeTab === 'created') {
      list = list.filter(issue => Number(issue.creatorId) === Number(currentUser?.id));
    } else if (activeTab === 'recent') {
      list = list.sort((a, b) => {
        const numA = parseInt(a.id.replace('ISS-', ''), 10);
        const numB = parseInt(b.id.replace('ISS-', ''), 10);
        return numB - numA;
      });
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
        <main className="mp-content-area">
          <div className="mp-page-header">
            <div>
              <h1 className="mp-page-title">Issues List</h1>
              <p className="mp-page-subtitle">View and filter currently live issues </p>
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