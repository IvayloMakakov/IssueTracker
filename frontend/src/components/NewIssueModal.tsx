// frontend/src/components/NewIssueModal.tsx
import React, { useState } from 'react';
import type { Issue } from '../types';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-all"></div>
      
      {/* Modal Box */}
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 transition-all scale-100 opacity-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Create New Issue</h2>
            <p className="text-xs text-gray-500 mt-0.5">Add a new issue to your project tracker</p>
          </div>
          <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-700 p-1.5 rounded-md">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-sm font-semibold text-gray-900">Title</label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter issue title" className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-slate-900" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as Issue['type'])} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                  <option value="Task">Task</option><option value="Bug">Bug</option><option value="Feature">Feature</option><option value="Improvement">Improvement</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">Priority</label>
                <select value={priority} onChange={(e) => setPriority(e.target.value as Issue['priority'])} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                  <option value="Urgent">Urgent</option><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as Issue['status'])} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                  <option value="To Do">To Do</option><option value="In Progress">In Progress</option><option value="In Review">In Review</option><option value="Done">Done</option><option value="Backlog">Backlog</option>
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-sm font-medium text-slate-700">Assignee</label>
                <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none">
                  <option value="unassigned">Unassigned</option><option value="Alice Johnson">Alice Johnson</option><option value="Bob Smith">Bob Smith</option><option value="Carol White">Carol White</option><option value="David Brown">David Brown</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <button onClick={onClose} type="button" className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-5 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 shadow-sm">Create Issue</button>
          </div>
        </form>
      </div>
    </div>
  );
};