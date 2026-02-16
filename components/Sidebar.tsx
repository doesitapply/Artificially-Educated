import React from 'react';
import type { ReportSection, CaseMetadata } from '../types';

interface SidebarProps {
  sections: ReportSection[];
  activeSectionId: string;
  setActiveSectionId: (id: string) => void;
  cases: CaseMetadata[];
  activeCaseId: string;
  onSwitchCase: (caseId: string) => void;
  onCreateCase: () => void;
}

// Icons (Simplified for HUD look)
const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const TimelineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const EvidenceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>;
const AnalysisIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>;
const DraftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;

const Sidebar: React.FC<SidebarProps> = ({ 
  sections, 
  activeSectionId, 
  setActiveSectionId, 
  cases, 
  activeCaseId, 
  onSwitchCase,
  onCreateCase 
}) => {
  return (
    <aside className="w-full md:w-64 flex-shrink-0 z-10 h-[calc(100vh-80px)] flex flex-col justify-between">
      <div className="space-y-6 pt-4">
        
        {/* Case Workspace Selector */}
        <div className="p-1 bg-slate-900/80 border border-slate-700 rounded-sm">
            <h3 className="text-[9px] text-cyan-600 font-bold uppercase tracking-widest mb-1 px-2 pt-1 font-hud">Operational Theater</h3>
            <select 
                value={activeCaseId}
                onChange={(e) => {
                    if (e.target.value === 'NEW') {
                        onCreateCase();
                    } else {
                        onSwitchCase(e.target.value);
                    }
                }}
                className="w-full bg-black text-gray-300 text-xs font-mono border border-slate-800 rounded-sm p-2 focus:ring-1 focus:ring-cyan-500 outline-none"
            >
                {cases.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="NEW">:: NEW CASE ::</option>
            </select>
        </div>

        {/* Primary Navigation */}
        <div className="space-y-1">
             <button 
                onClick={() => setActiveSectionId('dashboard')}
                className={`w-full text-left p-3 text-xs font-mono tracking-wider flex items-center space-x-3 transition-all duration-200 border-l-2 ${activeSectionId === 'dashboard' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500' : 'text-gray-500 border-transparent hover:text-white'}`}
             >
                <DashboardIcon className="w-4 h-4" /> <span>MISSION CONTROL</span>
             </button>

             <button 
                onClick={() => setActiveSectionId('timeline')}
                className={`w-full text-left p-3 text-xs font-mono tracking-wider flex items-center space-x-3 transition-all duration-200 border-l-2 ${activeSectionId === 'timeline' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500' : 'text-gray-500 border-transparent hover:text-white'}`}
             >
                <TimelineIcon className="w-4 h-4" /> <span>TIMELINE</span>
             </button>

             <button 
                onClick={() => setActiveSectionId('evidence')}
                className={`w-full text-left p-3 text-xs font-mono tracking-wider flex items-center space-x-3 transition-all duration-200 border-l-2 ${activeSectionId === 'evidence' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500' : 'text-gray-500 border-transparent hover:text-white'}`}
             >
                <EvidenceIcon className="w-4 h-4" /> <span>EVIDENCE VAULT</span>
             </button>

             <button 
                onClick={() => setActiveSectionId('analysis')}
                className={`w-full text-left p-3 text-xs font-mono tracking-wider flex items-center space-x-3 transition-all duration-200 border-l-2 ${activeSectionId === 'analysis' ? 'bg-cyan-950/30 text-cyan-400 border-cyan-500' : 'text-gray-500 border-transparent hover:text-white'}`}
             >
                <AnalysisIcon className="w-4 h-4" /> <span>FORENSIC SCAN</span>
             </button>

             <button 
                onClick={() => setActiveSectionId('drafting')}
                className={`w-full text-left p-3 text-xs font-mono tracking-wider flex items-center space-x-3 transition-all duration-200 border-l-2 ${activeSectionId === 'drafting' ? 'bg-red-950/30 text-red-400 border-red-500' : 'text-gray-500 border-transparent hover:text-white'}`}
             >
                <DraftIcon className="w-4 h-4" /> <span>DRAFTING LAB</span>
             </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 text-[9px] text-gray-600 font-mono text-center">
          SYSTEM V2.2 ONLINE
      </div>
    </aside>
  );
};

export default Sidebar;