import React from 'react';
import type { Issue } from '../mainPageApi';
import { useNavigate } from 'react-router-dom';

interface IssueTableProps {
  issues: Issue[];
  onToggleFavorite: (id: string) => void;
}

export const IssueTable: React.FC<IssueTableProps> = ({ issues, onToggleFavorite }) => {
  const navigate = useNavigate();

  const getTypeIcon = (type: Issue['type']) => {
    switch (type) {
      case 'Bug': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-type mp-bug"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0 1 12 12.75Zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 0 1-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 0 0 2.248-2.354M12 12.75a2.25 2.25 0 0 1-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 0 0-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 0 1 .4-2.253M12 8.25a2.25 2.25 0 0 0-2.248 2.146M12 8.25a2.25 2.25 0 0 1 2.248 2.146M8.683 5a6.032 6.032 0 0 1-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0 1 15.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 0 0-.575-1.752M4.921 6a24.048 24.048 0 0 0-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 0 1-5.223 1.082" /></svg>;
      case 'Feature': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-type mp-feature"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>;
      case 'Task': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-type mp-task"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
      case 'Improvement': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-type mp-improvement"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>;
      default: return null;
    }
  };

  const getPriorityIcon = (priority: Issue['priority']) => {
    switch (priority) {
      case 'Urgent': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mp-icon-priority mp-urgent"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" /></svg>;
      case 'High': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="mp-icon-priority mp-high"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>;
      case 'Medium': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="mp-icon-priority mp-medium"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
      case 'Low': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="mp-icon-priority mp-low"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;
      default: return null;
    }
  };

  return (
    <div className="mp-table-border-wrapper">
      <table className="mp-issues-table">
        <thead className="mp-table-head">
          <tr>
            <th className="mp-th-bookmark">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="mp-icon-bookmark-header">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </th>
            <th className="mp-th-id">ID</th>
            <th className="mp-th-title">Title</th>
            <th className="mp-th-type">Type</th>
            <th className="mp-th-status">Status</th>
            <th className="mp-th-priority">Priority</th>
            <th className="mp-th-assignee">Assignee</th>
            <th className="mp-th-updated">Updated</th>
          </tr>
        </thead>
        <tbody className="mp-table-body">
          {issues.map(issue => (
            <tr 
              key={issue.id} 
              className="mp-table-row" 
              onClick={() => navigate(`/ticket/${issue.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <td className="mp-td-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(issue.id); }}
                  className="mp-favorite-btn"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`mp-star-icon ${issue.isFavorite ? 'mp-favorited' : ''}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </button>
              </td>
              <td className="mp-td-id">{issue.id}</td>
              <td className="mp-td-title">{issue.title}</td>
              <td>
                <span className="mp-inline-flex-center mp-gap-1-5 mp-text-dark-gray">
                  {issue.type && getTypeIcon(issue.type)}
                  {issue.type}
                </span>
              </td>
              <td><span className="mp-status-badge">{issue.status}</span></td>
              <td>
                <span className="mp-inline-flex-center mp-gap-1-5 mp-font-medium mp-text-slate">
                  {issue.priority && getPriorityIcon(issue.priority)}
                  {issue.priority}
                </span>
              </td>
              <td>
                {issue.assignee ? (
                  <div className="mp-flex-center mp-gap-2">
                    <span className="mp-avatar-circle" style={{ background: '#e2e8f0' }}>{issue.assignee.initial}</span>
                    <span className="mp-text-assignee-name">{issue.assignee.name}</span>
                  </div>
                ) : <span className="mp-unassigned-text">Unassigned</span>}
              </td>
              <td className="mp-text-muted">{issue.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};