
import React from 'react';
import type { ReportSection } from '../types';

interface SidebarProps {
  sections: ReportSection[];
  activeSectionId: string;
  setActiveSectionId: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sections, activeSectionId, setActiveSectionId }) => {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="sticky top-24">
        <h2 className="text-lg font-semibold text-gray-200 mb-4 font-serif">Report Sections</h2>
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              className={`w-full text-left p-3 rounded-md text-sm whitespace-nowrap md:whitespace-normal transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 ${
                activeSectionId === section.id
                  ? 'bg-yellow-500/10 text-yellow-400 font-semibold border-l-4 border-yellow-400'
                  : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
              }`}
            >
              {section.title}
            </button>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
