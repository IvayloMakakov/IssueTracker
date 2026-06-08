import React, { useState, useRef, useEffect } from 'react';

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
    <div className="mp-filters-container">
      <div className="mp-tabs-wrapper">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`mp-tab-btn ${activeTab === tab.id ? 'mp-active' : ''}`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      <div className="mp-dropdowns-bar">
        <div className="mp-dropdowns-group">
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="mp-dropdown-container">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)} 
        className="mp-filter-trigger"
      >
        <span>{currentValue === 'All' ? `All ${label}es` : currentValue}</span>
        <svg className={`mp-chevron-icon ${isOpen ? 'mp-rotated' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="mp-dropdown-menu">
          {options.map(opt => (
            <button 
              key={opt} 
              type="button"
              onClick={() => {
                onChange(opt);
                setIsOpen(false);
              }} 
              className="mp-dropdown-item"
            >
              {opt === 'All' ? `All ${label}es` : opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};