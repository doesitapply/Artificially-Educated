import React, { useEffect, useState } from 'react';
import { Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineMonth, PatternLoop } from '../types';
import { aiClient } from '../ai-client';

interface PatternAnalysisProps {
  timelineData: TimelineMonth[];
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ timelineData }) => {
    const [loops, setLoops] = useState<PatternLoop[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastScannedCount, setLastScannedCount] = useState(0);

    useEffect(() => {
        const currentEventCount = timelineData.reduce((acc, m) => acc + m.events.length, 0);
        if (currentEventCount > 0 && currentEventCount !== lastScannedCount) {
            analyzePatterns();
        }
    }, [timelineData]);

    const analyzePatterns = async () => {
        const currentEventCount = timelineData.reduce((acc, m) => acc + m.events.length, 0);
        setIsLoading(true);
        setError(null);
        
        try {
            const flatEvents = timelineData.flatMap(m => m.events);
            // Optimization: Send only relevant fields to save context window
            const minimalEvents = flatEvents.map(e => ({ 
                id: e.id, 
                date: e.date, 
                title: e.title, 
                description: `${e.cause} -> ${e.effect}`,
                case: e.caseReference
            }));
            
            const prompt = `
                Analyze this timeline for "Retaliation Loops", "Systemic Clusters", and "Protected Activity/Adverse Action" sequences.
                
                TIMELINE EVENTS:
                ${JSON.stringify(minimalEvents)}
                
                TASK:
                1. Identify loops where the Defendant asserts a right (trigger) and the State/Court responds with an adverse action (reaction) within a short timeframe (< 30 days).
                2. Identify clusters of systemic failure (e.g. repeated ignored motions or multiple warrant issuances).
                3. Flag procedural anomalies (orders without hearings, retroactive Nunc Pro Tunc filings).
                
                Return a JSON array of detected patterns.
            `;

            const data = await aiClient.generateJSON({
                systemPrompt: MASTER_SYSTEM_PROMPT,
                userPrompt: prompt,
                jsonMode: true,
                schema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            daysLag: { type: Type.NUMBER },
                            severity: { type: Type.STRING, enum: ["high", "critical"] },
                            type: { type: Type.STRING, enum: ["retaliation", "systemic", "anomaly"] }
                        }
                    }
                }
            });
            
            setLoops(data);
            setLastScannedCount(currentEventCount);
        } catch (e) {
            console.error("Pattern Analysis Failed:", e);
            setError("Pattern analysis system failure. AI provider connection unstable.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)]">
            <div className="mb-8 border-b border-gray-800 pb-4 flex justify-between items-end">
                 <div>
                    <h2 className="text-3xl font-bold font-hud text-gray-100 uppercase tracking-widest flex items-center gap-3">
                        Pattern Recognition Engine
                        {isLoading && <div className="h-3 w-3 rounded-full bg-cyan-500 animate-ping"></div>}
                    </h2>
                    <p className="text-cyan-600 font-mono mt-2 text-xs">SCANNING FOR RETALIATION LOOPS AND SYSTEMIC ANOMALIES...</p>
                 </div>
                 <button 
                    onClick={analyzePatterns} 
                    disabled={isLoading}
                    className="text-xs bg-cyan-900/30 border border-cyan-600/50 text-cyan-400 px-4 py-2 rounded hover:bg-cyan-800/50 transition-colors disabled:opacity-50"
                 >
                    {isLoading ? "SCANNING..." : "FORCE RESCAN"}
                 </button>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/50 p-4 rounded mb-6 text-red-300 font-mono text-sm flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                     <div className="relative">
                        <div className="animate-spin h-16 w-16 border-t-2 border-b-2 border-cyan-500 rounded-full shadow-[0_0_15px_cyan]"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 bg-cyan-900/50 rounded-full animate-pulse"></div>
                        </div>
                     </div>
                     <p className="text-cyan-500 font-mono text-xs animate-pulse">ANALYZING TEMPORAL CAUSALITY...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {loops.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-lg">
                            <p className="text-gray-500 italic font-mono mb-2">No definitive conflict patterns detected.</p>
                            <p className="text-xs text-gray-600">Ingest more timeline events to increase detection resolution.</p>
                        </div>
                    ) : (
                        loops.map((loop, idx) => (
                            <div 
                                key={loop.id || idx} 
                                className={`bg-slate-900/50 border-l-4 p-6 rounded-sm relative overflow-hidden group hover:bg-slate-900/80 transition-all ${
                                    loop.type === 'retaliation' ? 'border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.1)]' : 
                                    loop.type === 'systemic' ? 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 
                                    'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                                }`}
                            >
                                {/* Background Tech Decoration */}
                                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none transform group-hover:scale-110 transition-transform duration-700">
                                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                </div>
                                
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className={`text-xl font-bold font-hud tracking-wide ${
                                            loop.type === 'retaliation' ? 'text-red-400' : 
                                            loop.type === 'systemic' ? 'text-orange-400' : 
                                            'text-indigo-400'
                                        }`}>
                                            {loop.title}
                                        </h3>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold font-mono uppercase tracking-widest border ${
                                                loop.severity === 'critical' ? 'border-red-500 text-red-500 bg-red-950/30' : 'border-yellow-500 text-yellow-500 bg-yellow-950/30'
                                            }`}>
                                                {loop.severity}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <p className="text-gray-300 mb-4 font-mono text-sm leading-relaxed border-l-2 border-gray-700 pl-4 py-1">
                                        {loop.description}
                                    </p>
                                    
                                    <div className="flex items-center text-xs font-mono gap-6 pt-3 border-t border-gray-800/50">
                                        <span className="text-gray-500">CLASS: <span className="text-gray-300 uppercase font-bold">{loop.type}</span></span>
                                        {loop.daysLag !== undefined && (
                                            <span className="text-gray-500">
                                                TEMPORAL LAG: <span className={`font-bold ${loop.daysLag < 14 ? 'text-red-400' : 'text-white'}`}>{loop.daysLag} DAYS</span>
                                            </span>
                                        )}
                                        <span className="ml-auto text-[10px] text-gray-600">ID: {loop.id || 'GEN-PAT-' + idx}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PatternAnalysis;