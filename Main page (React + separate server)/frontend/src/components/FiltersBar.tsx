// frontend/src/components/FiltersBar.tsx
import React, { useState } from 'react';

interface FiltersBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeStatus: string;
  setActiveStatus: (status: string) => void;
  activePriority: string;
  setActivePriority: (priority: string) => void;
  activeType: string;
  setActiveType: (type: string) => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  activeTab, setActiveTab, activeStatus, setActiveStatus, activePriority, setActivePriority, activeType, setActiveType
}) => {
  const tabs = [
    { id: 'all', name: 'All Issues' },
    { id: 'assigned', name: 'Assigned to Me' },
    { id: 'created', name: 'Created by Me' },
    { id: 'watched', name: 'Watched' },
    { id: 'recent', name: 'Recent' }
  ];

  return (
    <div className="relative z-20">
      {/* Animated Tabs */}
      <div className="relative bg-gray-100 p-1 rounded-lg inline-flex mb-6 w-full max-w-4xl flex-wrap isolate">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-sm font-medium py-1.5 px-4 rounded-md transition-colors duration-300 z-10 ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Filters Dropdowns Bar */}
      <div className="flex items-center mb-4 relative z-20">
        <div className="flex gap-3 text-sm">
          <DropdownFilter label="Status" currentValue={activeStatus} onChange={setActiveStatus} options={['All', 'To Do', 'In Progress', 'In Review', 'Done', 'Backlog']} />
          <DropdownFilter label="Priority" currentValue={activePriority} onChange={setActivePriority} options={['All', 'Urgent', 'High', 'Medium', 'Low']} />
          <DropdownFilter label="Type" currentValue={activeType} onChange={setActiveType} options={['All', 'Bug', 'Feature', 'Task', 'Improvement']} />
        </div>
      </div>
    </div>
  );
};

const DropdownFilter: React.FC<{ label: string, currentValue: string, onChange: (val: string) => void, options: string[] }> = ({ label, currentValue, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <button onClick={() => setIsOpen(!isOpen)} className="filter-trigger border border-gray-200 bg-white px-3 py-1.5 rounded-md text-gray-600 hover:bg-gray-50 flex items-center justify-between gap-2 min-w-35 transition-colors">
        <span>{currentValue === 'All' ? `All ${label}es` : currentValue}</span>
        <svg className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-100 shadow-lg rounded-lg overflow-hidden py-1 z-50">
          {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
              {opt === 'All' ? `All ${label}es` : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};