// frontend/src/components/IssueTable.tsx
import React from 'react';
import type { Issue } from '../types';

interface IssueTableProps {
  issues: Issue[];
  onToggleFavorite: (id: string) => void;
}

export const IssueTable: React.FC<IssueTableProps> = ({ issues, onToggleFavorite }) => {
  
  const getTypeIcon = (type: Issue['type']) => {
    switch (type) {
      case 'Bug': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0 1 12 12.75Zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 0 1-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 0 0 2.248-2.354M12 12.75a2.25 2.25 0 0 1-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 0 0-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 0 1 .4-2.253M12 8.25a2.25 2.25 0 0 0-2.248 2.146M12 8.25a2.25 2.25 0 0 1 2.248 2.146M8.683 5a6.032 6.032 0 0 1-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0 1 15.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 0 0-.575-1.752M4.921 6a24.048 24.048 0 0 0-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 0 1-5.223 1.082" /></svg>;
      case 'Feature': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>;
      case 'Task': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-gray-400"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
      case 'Improvement': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>;
    }
  };

  const getPriorityIcon = (priority: Issue['priority']) => {
    switch (priority) {
      case 'Urgent': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-red-600"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 18.75 7.5-7.5 7.5 7.5" /><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 7.5-7.5 7.5 7.5" /></svg>;
      case 'High': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-orange-500"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg>;
      case 'Medium': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-yellow-500"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>;
      case 'Low': return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-blue-500"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
          <tr>
            <th className="px-4 py-3 w-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 mx-auto text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            </th>
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3 w-full">Title</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Priority</th>
            <th className="px-4 py-3">Assignee</th>
            <th className="px-4 py-3">Updated</th>
          </tr>
        </thead>
        <tbody id="issue-table-body" className="divide-y divide-gray-100">
          {issues.map(issue => (
            <tr key={issue.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-center">
                <button onClick={() => onToggleFavorite(issue.id)} type="button" className="favorite-btn p-1 z-10" aria-label="Favorite issue">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`w-5 h-5 transition-all duration-200 ${issue.isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 fill-transparent hover:text-gray-400'}`}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                </button>
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">{issue.id}</td>
              <td className="px-4 py-3 text-gray-900 font-medium">{issue.title}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-gray-600">
                  {issue.type && getTypeIcon(issue.type)}
                  {issue.type}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700">
                  {issue.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 text-gray-900 font-medium">
                  {issue.priority && getPriorityIcon(issue.priority)}
                  {issue.priority}
                </span>
              </td>
              <td className="px-4 py-3">
                {issue.assignee ? (
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{issue.assignee.initial}</span>
                    <span className="text-gray-700">{issue.assignee.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400 italic">Unassigned</span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-500">{issue.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};