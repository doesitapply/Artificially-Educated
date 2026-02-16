import React, { useState } from 'react';
import { Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineMonth, PatternLoop, Conflict, ActorProfile } from '../types';
import { aiClient } from '../ai-client';
import ViolationsChart from './ViolationsChart';
import EventProgression from './EventProgression';

interface AnalysisHubProps {
  timelineData: TimelineMonth[];
}

const AnalysisHub: React.FC<AnalysisHubProps> = ({ timelineData }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [activeTab, setActiveTab] = useState<'visuals' | 'patterns' | 'conflicts' | 'actors'>('visuals');
    
    const [patterns, setPatterns] = useState<PatternLoop[]>([]);
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [actors, setActors] = useState<ActorProfile[]>([]);
    
    const hasData = patterns.length > 0 || conflicts.length > 0 || actors.length > 0;

    const runFullScan = async () => {
        setIsScanning(true);
        try {
            const flatEvents = timelineData.flatMap(m => m.events);
            const minimalEvents = flatEvents.map(e => ({ 
                date: e.date, 
                title: e.title, 
                actor: e.actor,
                desc: `${e.cause} -> ${e.effect}`,
                claim: e.claim
            }));

            const patternPrompt = `
                Analyze these events for "Retaliation Loops" (Protected Activity -> Adverse Action < 30 days) and "Timeline Conflicts" (Illogical dates, missing filings).
                Return JSON: { "patterns": [...], "conflicts": [...] }
                EVENTS: ${JSON.stringify(minimalEvents)}
            `;
            
            const aiPromise = aiClient.generateJSON({
                systemPrompt: MASTER_SYSTEM_PROMPT,
                userPrompt: patternPrompt,
                jsonMode: true,
                schema: {
                    type: Type.OBJECT,
                    properties: {
                        patterns: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, description: {type: Type.STRING}, type: {type: Type.STRING}, severity: {type: Type.STRING} } } },
                        conflicts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: {type: Type.STRING}, description: {type: Type.STRING}, type: {type: Type.STRING}, severity: {type: Type.STRING} } } }
                    }
                }
            });

            const actorMap = new Map<string, any>();
            flatEvents.forEach(ev => {
                if(!ev.actor) return;
                const name = ev.actor.trim();
                if(!actorMap.has(name)) actorMap.set(name, { name, role: 'Official', count: 0, score: 0 });
                const entry = actorMap.get(name);
                entry.count++;
                if (ev.claim) entry.score += 10; 
            });
            const actorList = Array.from(actorMap.values()).map(a => ({
                ...a,
                heatScore: Math.min(100, a.score),
                eventCount: a.count,
                associatedViolations: []
            })).sort((a, b) => b.eventCount - a.eventCount);

            const aiResult = await aiPromise;
            
            setPatterns(aiResult.patterns || []);
            setConflicts(aiResult.conflicts || []);
            setActors(actorList as any);
            setActiveTab('patterns');

        } catch (e) {
            console.error("Scan failed", e);
            alert("Analysis Scan Failed. Check console.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="p-6 md:p-10 animate-fade-in min-h-[calc(100vh-140px)]">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-hud font-black text-white tracking-widest flex items-center gap-3">
                        FORENSIC SCANNER
                        {isScanning && <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>}
                    </h1>
                    <p className="text-gray-400 mt-2 font-mono text-sm max-w-2xl">
                        Multi-vector intelligence hub. Aggregate visual distributions, retaliation loops, and compromised actor heatmaps.
                    </p>
                </div>
                <button
                    onClick={runFullScan}
                    disabled={isScanning || timelineData.length === 0}
                    className="mt-4 md:mt-0 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-all flex items-center gap-3 disabled:opacity-50 disabled:shadow-none"
                >
                    {isScanning ? (
                        <span className="font-mono animate-pulse">INITIATING DEEP SCAN...</span>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            RUN INTELLIGENCE PASS
                        </>
                    )}
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab('visuals')} className={`px-4 py-2 font-bold font-mono text-xs rounded-t border-t border-x ${activeTab === 'visuals' ? 'bg-slate-800 text-emerald-400 border-slate-600' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}>
                    VISUAL INTELLIGENCE
                </button>
                <button onClick={() => setActiveTab('patterns')} className={`px-4 py-2 font-bold font-mono text-xs rounded-t border-t border-x ${activeTab === 'patterns' ? 'bg-slate-800 text-cyan-400 border-slate-600' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}>
                    PATTERNS ({patterns.length})
                </button>
                <button onClick={() => setActiveTab('conflicts')} className={`px-4 py-2 font-bold font-mono text-xs rounded-t border-t border-x ${activeTab === 'conflicts' ? 'bg-slate-800 text-orange-400 border-slate-600' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}>
                    CONFLICTS ({conflicts.length})
                </button>
                <button onClick={() => setActiveTab('actors')} className={`px-4 py-2 font-bold font-mono text-xs rounded-t border-t border-x ${activeTab === 'actors' ? 'bg-slate-800 text-purple-400 border-slate-600' : 'bg-transparent text-gray-500 border-transparent hover:text-gray-300'}`}>
                    ACTORS ({actors.length})
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-b min-h-[400px]">
                
                {activeTab === 'visuals' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                        <div className="bg-black/40 border border-slate-800 p-6 rounded-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-hud text-cyan-500 uppercase tracking-widest">Constitutional Violation Distribution</h3>
                                <span className="text-[10px] font-mono text-slate-600 uppercase">Analysis Engine v2.2</span>
                            </div>
                            <ViolationsChart data={timelineData} />
                            <p className="text-[10px] text-gray-600 font-mono mt-4 leading-relaxed italic">
                                * This metric aggregates claims associated with timeline events to identify systemic legal exposure.
                            </p>
                        </div>
                        <div className="bg-black/40 border border-slate-800 p-6 rounded-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-hud text-emerald-500 uppercase tracking-widest">Case Velocity & Temporal Density</h3>
                                <span className="text-[10px] font-mono text-slate-600 uppercase">Real-time Stream</span>
                            </div>
                            <EventProgression data={timelineData} />
                            <p className="text-[10px] text-gray-600 font-mono mt-4 leading-relaxed italic">
                                * Peaks indicate intense procedural activity or clusters of institutional adverse actions.
                            </p>
                        </div>
                        <div className="lg:col-span-2 bg-slate-950/50 border border-dashed border-slate-700 p-8 rounded text-center">
                            <p className="text-sm text-slate-500 font-mono italic">
                                Select "Initiate Scan" to augment these statistics with algorithmic pattern recognition and conflict discovery.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'patterns' && (
                    <div className="space-y-4 animate-fade-in">
                        {!hasData && <p className="text-gray-500 italic text-center py-20 font-mono uppercase tracking-widest opacity-50">SCN-404: NO PATTERNS LOGGED. RUN SCAN.</p>}
                        {patterns.map((p, i) => (
                            <div key={i} className="bg-black/40 border-l-4 border-cyan-500 p-4 rounded shadow-sm">
                                <h3 className="font-bold text-cyan-400 font-hud mb-1 uppercase tracking-wide">{p.title}</h3>
                                <p className="text-sm text-gray-300 font-mono">{p.description}</p>
                                <div className="mt-2 flex gap-2">
                                    <span className="text-[10px] bg-cyan-900/30 text-cyan-200 px-2 py-0.5 rounded uppercase">{p.type}</span>
                                    <span className="text-[10px] bg-red-900/30 text-red-300 px-2 py-0.5 rounded uppercase">{p.severity} SEVERITY</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'conflicts' && (
                    <div className="space-y-4 animate-fade-in">
                        {!hasData && <p className="text-gray-500 italic text-center py-20 font-mono uppercase tracking-widest opacity-50">CFG-404: NO CONFLICTS LOGGED. RUN SCAN.</p>}
                        {conflicts.map((c, i) => (
                            <div key={i} className="bg-black/40 border-l-4 border-orange-500 p-4 rounded shadow-sm">
                                <h3 className="font-bold text-orange-400 font-hud mb-1 uppercase tracking-wide">{c.title}</h3>
                                <p className="text-sm text-gray-300 font-mono">{c.description}</p>
                                <div className="mt-2">
                                    <span className="text-[10px] bg-orange-900/30 text-orange-200 px-2 py-0.5 rounded uppercase">{c.type.replace('_', ' ')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'actors' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                        {!hasData && <p className="text-gray-500 italic text-center py-20 font-mono uppercase tracking-widest opacity-50 col-span-3">ACT-404: NO ENTITY DATA. RUN SCAN.</p>}
                        {actors.map((a, i) => (
                            <div key={i} className="bg-black/40 border border-slate-700 p-4 rounded hover:border-purple-500 transition-colors group">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-white truncate pr-2 group-hover:text-purple-400 transition-colors">{a.name}</h3>
                                    <span className="text-xs font-mono text-gray-500 bg-black px-1 rounded">{a.eventCount} Events</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mb-1">
                                    <div className="bg-purple-500 h-full" style={{width: `${Math.min(100, (a.heatScore || 0))}%`}}></div>
                                </div>
                                <div className="flex justify-between text-[9px] font-mono uppercase text-gray-600">
                                    <span>Heat Index</span>
                                    <span>Score: {a.heatScore || 0}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisHub;