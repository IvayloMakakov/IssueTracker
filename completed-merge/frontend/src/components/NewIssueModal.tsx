// frontend/src/components/NewIssueModal.tsx
import React, { useState } from 'react';
import type { Issue } from '../mainPageApi';

interface NewIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, type: Issue['type'], priority: Issue['priority'], status: Issue['status'], assigneeName: string) => void;
}

export const NewIssueModal: React.FC<NewIssueModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<Issue['type']>('Task');
  const [priority, setPriority] = useState<Issue['priority']>('Medium');
  const [status, setStatus] = useState<Issue['status']>('To Do');
  const [assignee, setAssignee] = useState('unassigned');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(title, type, priority, status, assignee);
    setTitle(''); setType('Task'); setPriority('Medium'); setStatus('To Do'); setAssignee('unassigned');
    onClose();
  };

  return (
    <div className="mp-modal-overlay">
      {/* Backdrop */}
      <div onClick={onClose} className="mp-modal-backdrop"></div>
      
      {/* Modal Box */}
      <div className="mp-modal-box">
        <div className="mp-modal-header">
          <div>
            <h2 className="mp-modal-title">Create New Issue</h2>
            <p className="mp-modal-subtitle">Add a new issue to your project tracker</p>
          </div>
          <button onClick={onClose} type="button" className="mp-modal-close-btn">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="mp-modal-form">
          <div className="mp-form-fields-wrapper">
            <div className="mp-form-group-full">
              <label className="mp-form-label mp-font-bold">Title</label>
              <input 
                type="text" 
                required 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter issue title" 
                className="mp-form-input" 
              />
            </div>

            <div className="mp-form-grid">
              <div className="mp-form-group">
                <label className="mp-form-label mp-text-slate-700">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as Issue['type'])} className="mp-form-select">
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Feature">Feature</option>
                  <option value="Improvement">Improvement</option>
                </select>
              </div>
              <div className="mp-form-group">
                <label className="mp-form-label mp-text-slate-700">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Issue['priority'])} className="mp-form-select">
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="mp-form-group">
                <label className="mp-form-label mp-text-slate-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Issue['status'])} className="mp-form-select">
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Done">Done</option>
                  <option value="Backlog">Backlog</option>
                </select>
              </div>
              <div className="mp-form-group">
                <label className="mp-form-label mp-text-slate-700">Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="mp-form-select">
                  <option value="unassigned">Unassigned</option>
                  <option value="Alice Johnson">Alice Johnson</option>
                  <option value="Bob Smith">Bob Smith</option>
                  <option value="Carol White">Carol White</option>
                  <option value="David Brown">David Brown</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mp-modal-actions">
            <button onClick={onClose} type="button" className="mp-btn-secondary">Cancel</button>
            <button type="submit" className="mp-btn-primary-submit">Create Issue</button>
          </div>
        </form>
      </div>
    </div>
  );
};