const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let issuesDB = [
  { id: 'ISS-1', title: 'Fix login page responsiveness', type: 'Bug', status: 'In Progress', priority: 'High', assignee: { name: 'Alice Johnson', initial: 'A' }, updatedAt: '30/03/2026', isFavorite: true },
  { id: 'ISS-2', title: 'Implement dark mode', type: 'Feature', status: 'To Do', priority: 'Medium', assignee: { name: 'Carol White', initial: 'C' }, updatedAt: '26/03/2026', isFavorite: false },
  { id: 'ISS-3', title: 'Database migration for user preferences', type: 'Task', status: 'In Review', priority: 'High', assignee: { name: 'Bob Smith', initial: 'B' }, updatedAt: '30/03/2026', isFavorite: false },
  { id: 'ISS-4', title: 'Update API documentation', type: 'Task', status: 'Done', priority: 'Low', assignee: { name: 'David Brown', initial: 'D' }, updatedAt: '31/03/2026', isFavorite: false },
  { id: 'ISS-5', title: 'Improve search performance', type: 'Improvement', status: 'Backlog', priority: 'Medium', assignee: null, updatedAt: '22/03/2026', isFavorite: false },
  { id: 'ISS-6', title: 'Fix memory leak in dashboard', type: 'Bug', status: 'To Do', priority: 'Urgent', assignee: { name: 'Alice Johnson', initial: 'A' }, updatedAt: '29/03/2026', isFavorite: false },
  { id: 'ISS-7', title: 'Add export to CSV feature', type: 'Feature', status: 'Backlog', priority: 'Low', assignee: null, updatedAt: '24/03/2026', isFavorite: false },
  { id: 'ISS-8', title: 'Implement email notifications', type: 'Feature', status: 'In Progress', priority: 'Medium', assignee: { name: 'Bob Smith', initial: 'B' }, updatedAt: '30/03/2026', isFavorite: true }
];

let notificationsDB = [
  { id: 'n1', type: 'assignment', title: 'New assignment', desc: 'You were assigned to ISS-6', date: '01/04/2026', targetId: 'ISS-6', unread: true },
  { id: 'n2', type: 'mention', title: 'You were mentioned', desc: 'Bob Smith mentioned you in ISS-3', date: '31/03/2026', targetId: 'ISS-3', unread: true },
  { id: 'n3', type: 'status', title: 'Status updated', desc: 'ISS-1 moved to In Review', date: '31/03/2026', targetId: 'ISS-1', unread: true },
  { id: 'n4', type: 'comment', title: 'New comment', desc: 'Carol White commented on ISS-2', date: '30/03/2026', targetId: 'ISS-2', unread: true },
  { id: 'n5', type: 'assignment', title: 'New assignment', desc: 'You were assigned to ISS-8', date: '30/03/2026', targetId: 'ISS-8', unread: true }
];

app.get('/api/issues', (req, res) => {
  res.json(issuesDB);
});

app.post('/api/issues', (req, res) => {
  const { title, type, status, priority, assigneeName } = req.body;

  const newIssue = {
    id: `ISS-${issuesDB.length + 1}`,
    title,
    type,
    status,
    priority,
    assignee: assigneeName !== 'unassigned' 
      ? { name: assigneeName, initial: assigneeName.charAt(0).toUpperCase() } 
      : null,
    updatedAt: new Date().toLocaleDateString('bg-BG'),
    isFavorite: false
  };

  issuesDB.unshift(newIssue);
  res.status(201).json(newIssue);
});

app.patch('/api/issues/:id', (req, res) => {
  const { id } = req.params;
  const fieldsToUpdate = req.body;

  const issue = issuesDB.find(i => i.id === id);

  if (issue) {
    Object.keys(fieldsToUpdate).forEach(key => {
      if (issue.hasOwnProperty(key)) {
        issue[key] = fieldsToUpdate[key];
      }
    });
    issue.updatedAt = new Date().toLocaleDateString('bg-BG');
    res.json({ success: true, issue });
  } else {
    res.status(404).json({ success: false, message: "Задачата не е намерена" });
  }
});

app.get('/api/notifications', (req, res) => {
  res.json(notificationsDB);
});

app.patch('/api/notifications/read-all', (req, res) => {
  notificationsDB = notificationsDB.map(n => ({ ...n, unread: false }));
  res.json({ success: true, message: "Всички известия са маркирани като прочетени" });
});

app.delete('/api/notifications/:id', (req, res) => {
  const { id } = req.params;
  const initialLength = notificationsDB.length;
  
  notificationsDB = notificationsDB.filter(n => n.id !== id);

  if (notificationsDB.length < initialLength) {
    res.json({ success: true, message: "Известието е изтрито успешно" });
  } else {
    res.status(404).json({ success: false, message: "Известието не е намерено" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Mock сървърът стартира успешно!`);
  console.log(`📡 Очква заявки на: http://localhost:${PORT}`);
  console.log(`==================================================`);
});