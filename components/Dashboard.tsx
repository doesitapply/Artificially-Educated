import React from 'react';
import type { TimelineMonth, Document } from '../types';

interface DashboardProps {
  timelineData: TimelineMonth[];
  documents: Document[];
  onNavigate: (page: string) => void;
  onCreateCase: () => void;
  caseName: string;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
    <div className={`bg-slate-900/50 border border-slate-800 p-4 rounded-sm flex items-center gap-4 ${color}`}>
        <div className="p-3 bg-black rounded-full border border-slate-700">
            {icon}
        </div>
        <div>
            <div className="text-2xl font-bold font-mono text-white">{value}</div>
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">{label}</div>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ timelineData, documents, onNavigate, onCreateCase, caseName }) => {
    const eventCount = timelineData.reduce((acc, m) => acc + m.events.length, 0);
    const lastEvent = timelineData.length > 0 && timelineData[timelineData.length - 1].events.length > 0 
        ? timelineData[timelineData.length - 1].events[timelineData[timelineData.length - 1].events.length - 1] 
        : null;

    return (
        <div className="p-6 md:p-10 min-h-[calc(100vh-140px)] animate-fade-in">
            <div className="mb-10">
                <h1 className="text-4xl font-hud font-black text-white mb-2 tracking-wide">
                    MISSION CONTROL
                </h1>
                <div className="flex items-center gap-3 text-sm font-mono text-gray-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span>ACTIVE WORKSPACE: <span className="text-cyan-400 font-bold">{caseName || "NO CASE SELECTED"}</span></span>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard 
                    label="Timeline Events" 
                    value={eventCount} 
                    color="border-l-4 border-l-cyan-500"
                    icon={<svg className="w-6 h-6 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                />
                <StatCard 
                    label="Evidence Items" 
                    value={documents.length} 
                    color="border-l-4 border-l-purple-500"
                    icon={<svg className="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                />
                <StatCard 
                    label="Latest Activity" 
                    value={lastEvent ? lastEvent.date : "N/A"} 
                    color="border-l-4 border-l-yellow-500"
                    icon={<svg className="w-6 h-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
                <StatCard 
                    label="System Status" 
                    value="ONLINE" 
                    color="border-l-4 border-l-green-500"
                    icon={<svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                />
            </div>

            {/* Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Action 1 */}
                <button 
                    onClick={() => onNavigate('evidence')}
                    className="group bg-slate-900/80 border border-slate-700 p-6 text-left hover:border-cyan-500 hover:bg-slate-900 transition-all shadow-lg"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-cyan-950/30 rounded border border-cyan-900 group-hover:border-cyan-500 transition-colors">
                            <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <span className="text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-hud">INGEST EVIDENCE</h3>
                    <p className="text-sm text-gray-400">Upload PDFs, Audio, and Video. AI extracts timeline events and transcripts automatically.</p>
                </button>

                {/* Action 2 */}
                <button 
                    onClick={() => onNavigate('analysis')}
                    className="group bg-slate-900/80 border border-slate-700 p-6 text-left hover:border-red-500 hover:bg-slate-900 transition-all shadow-lg"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-red-950/30 rounded border border-red-900 group-hover:border-red-500 transition-colors">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                        </div>
                        <span className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-hud">RUN FORENSIC SCAN</h3>
                    <p className="text-sm text-gray-400">Execute deep analysis: Pattern Recognition, Conflict Detection, and Actor Profiling.</p>
                </button>

                {/* Action 3 */}
                <button 
                    onClick={() => onNavigate('drafting')}
                    className="group bg-slate-900/80 border border-slate-700 p-6 text-left hover:border-emerald-500 hover:bg-slate-900 transition-all shadow-lg"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-950/30 rounded border border-emerald-900 group-hover:border-emerald-500 transition-colors">
                            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <span className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">➔</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 font-hud">DRAFT MOTIONS</h3>
                    <p className="text-sm text-gray-400">Generate federal-grade legal filings (DOJ Referrals, Motions to Dismiss) using verified facts.</p>
                </button>
            </div>

            {/* Empty State Helper */}
            {eventCount === 0 && (
                <div className="mt-12 p-8 border-2 border-dashed border-slate-700 rounded-lg text-center">
                    <h3 className="text-2xl font-bold text-gray-500 mb-4">The Case File is Empty</h3>
                    <p className="text-gray-400 mb-6 max-w-lg mx-auto">Start by ingesting evidence files or manually adding timeline events. Alternatively, load the demonstration dataset to explore capabilities.</p>
                    <div className="flex gap-4 justify-center">
                        <button onClick={() => onNavigate('evidence')} className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded font-bold transition-colors">START UPLOAD</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;