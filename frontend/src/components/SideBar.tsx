// frontend/src/components/Sidebar.tsx
import React from 'react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <aside className={`border-r border-gray-200 flex flex-col bg-white shrink-0 transition-all duration-300 ease-in-out relative z-10 ${isOpen ? 'w-64' : 'w-16'}`}>
      
      <div className="p-4 border-b border-gray-100 flex items-center text-sm h-16 relative">
        <div className={`flex-1 overflow-hidden transition-all duration-300 whitespace-nowrap ${isOpen ? 'max-w-50 opacity-100' : 'max-w-0 opacity-0'}`}>
          <div className="font-semibold">Navigation</div>
          <div className="text-xs text-gray-500">Quick access</div>
        </div>
        
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          type="button" 
          aria-label="Toggle Sidebar" 
          title="Toggle Sidebar" 
          className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-400 transition-colors absolute z-10 bg-white ${isOpen ? 'right-3' : 'right-3.5'}`}
        >
          <svg className={`w-4 h-4 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-2 overflow-y-auto overflow-x-hidden text-sm">
        <div className={`text-xs font-semibold text-gray-400 mb-2 mt-2 px-2 overflow-hidden transition-all duration-300 whitespace-nowrap ${isOpen ? 'max-w-50 opacity-100' : 'max-w-0 opacity-0'}`}>MAIN MENU</div>
        
        <a href="#" className="flex items-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300">
          <div className="shrink-0 w-6 h-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>
          </div>
          <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isOpen ? 'max-w-50 ml-3 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>
            Dashboard
          </div>
        </a>
        
        <a href="#" className="flex items-center p-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-all duration-300 shadow-sm">
          <div className="shrink-0 w-6 h-6 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
          </div>
          <div className={`overflow-hidden transition-all duration-300 whitespace-nowrap ${isOpen ? 'max-w-50 ml-3 opacity-100' : 'max-w-0 ml-0 opacity-0'}`}>
            All Issues
          </div>
        </a>
      </nav>
    </aside>
  );
};