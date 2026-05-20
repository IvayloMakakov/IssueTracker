// frontend/src/components/Sidebar.tsx
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <aside 
      className={`sidebar-container ${!isOpen ? 'is-closed' : ''}`}
      style={{ width: isOpen ? '16rem' : '4rem' }} // Динамично сменяме 256px с 64px
    >
      <div className="sidebar-header">
        <div className="sidebar-header-text">
          <div className="sidebar-header-title">Navigation</div>
          <div className="sidebar-header-subtitle">Quick access</div>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          type="button" 
          aria-label="Toggle Sidebar" 
          title="Toggle Sidebar" 
          className="sidebar-toggle-btn"
        >
          <svg className={`sidebar-chevron ${!isOpen ? 'rotated' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <div className="sidebar-menu-title">MAIN MENU</div>
        
        <a href="#" className="sidebar-link">
          <div className="sidebar-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="sidebar-svg-icon"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          </div>
          <div className="sidebar-link-text">
            Dashboard
          </div>
        </a>
        
        <a href="#" className="sidebar-link active">
          <div className="sidebar-icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="sidebar-svg-icon"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
          </div>
          <div className="sidebar-link-text">
            All Issues
          </div>
        </a>
      </nav>
    </aside>
  );
};