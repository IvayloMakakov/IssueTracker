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
    <div className="filters-container">
      {/* Animated Tabs */}
      <div className="tabs-wrapper">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Filters Dropdowns Bar */}
      <div className="dropdowns-bar">
        <div className="dropdowns-group">
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
    <div className="dropdown-container" onBlur={() => setTimeout(() => setIsOpen(false), 200)}>
      <button onClick={() => setIsOpen(!isOpen)} className="filter-trigger">
        <span>{currentValue === 'All' ? `All ${label}es` : currentValue}</span>
        <svg className={`chevron-icon ${isOpen ? 'rotated' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)} className="dropdown-item">
              {opt === 'All' ? `All ${label}es` : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};