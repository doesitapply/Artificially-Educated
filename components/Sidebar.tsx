
import React from 'react';
import type { ReportSection } from '../types';

interface SidebarProps {
  sections: ReportSection[];
  activeSectionId: string;
  setActiveSectionId: (id: string) => void;
}

const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const AnalysisIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
    </svg>
);

const DraftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ sections, activeSectionId, setActiveSectionId }) => {
  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="sticky top-24">
        
        {/* Action Button */}
        <button
          onClick={() => setActiveSectionId('evidence-input')}
          className={`w-full mb-6 flex items-center justify-center space-x-2 p-3 rounded-md text-sm font-bold transition-all duration-200 border border-yellow-500/50 ${
            activeSectionId === 'evidence-input'
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20'
          }`}
        >
          <PlusIcon className="w-4 h-4" />
          <span>Evidence Input</span>
        </button>

        <div className="mb-6 space-y-1">
             <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">War Room</h2>
             <button
              onClick={() => setActiveSectionId('pattern-analysis')}
              className={`w-full text-left p-3 rounded-md text-sm flex items-center space-x-3 transition-all duration-200 ${
                activeSectionId === 'pattern-analysis'
                  ? 'bg-indigo-900/50 text-indigo-300 border-l-4 border-indigo-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <AnalysisIcon className="w-4 h-4" />
              <span>Pattern Recognition</span>
            </button>
             <button
              onClick={() => setActiveSectionId('drafting-lab')}
              className={`w-full text-left p-3 rounded-md text-sm flex items-center space-x-3 transition-all duration-200 ${
                activeSectionId === 'drafting-lab'
                  ? 'bg-red-900/30 text-red-300 border-l-4 border-red-500'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <DraftIcon className="w-4 h-4" />
              <span>Legal Drafting Lab</span>
            </button>
        </div>

        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 px-3">Case Report</h2>
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
