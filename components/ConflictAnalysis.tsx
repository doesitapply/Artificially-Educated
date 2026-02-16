
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineMonth, Conflict } from '../types';

interface ConflictAnalysisProps {
  timelineData: TimelineMonth[];
  onDraftRemedy?: (conflict: Conflict) => void;
}

const ConflictAnalysis: React.FC<ConflictAnalysisProps> = ({ timelineData, onDraftRemedy }) => {
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Initial scan on mount if no conflicts exist
    useEffect(() => {
        if (conflicts.length === 0 && timelineData.length > 0) {
            // Optional: Auto-scan or wait for user. Let's wait for user to be explicit.
        }
    }, [timelineData]);

    const runAudit = async () => {
        setIsScanning(true);
        const flatEvents = timelineData.flatMap(m => m.events);
        
        const prompt = `
            You are a Forensic Auditor for a federal civil rights lawsuit (Case 3:24-cv-00579).
            
            YOUR MISSION:
            Audit the following timeline for logical impossibilities, procedural anomalies, and contradictions.
            
            LOOK FOR:
            1. **Temporal Paradoxes (Timeline Collisions):** An Order issued before a Motion was filed. A Hearing held before it was scheduled.
            2. **Missing Filings:** An Order references a "Motion" that does not exist in the record.
            3. **Procedural Gaps:** A Competency Evaluation ordered without a preceding hearing or petition.
            4. **Backdating:** Events that appear to have been entered "Nunc Pro Tunc" to cover up delays.
            
            TIMELINE DATA:
            ${JSON.stringify(flatEvents.map(e => ({ 
                id: e.id, 
                date: e.date, 
                title: e.title, 
                desc: e.cause + " " + e.effect
            })))}
            
            Return a list of detected CONFLICTS. For each conflict, include the IDs of the involved events in 'involvedEventIds'.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    systemInstruction: MASTER_SYSTEM_PROMPT,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['contradiction', 'missing_filing', 'timeline_collision', 'procedural_anomaly'] },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                                detectedAt: { type: Type.STRING },
                                involvedEventIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                            }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || '[]');
            setConflicts(data.map((c: any) => ({...c, detectedAt: new Date().toISOString()})));
        } catch (e) {
            console.error(e);
            alert("Audit failed. AI could not complete the forensic scan.");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)]">
            <div className="flex justify-between items-end mb-8 border-b border-gray-600 pb-4">
                <div>
                    <h2 className="text-3xl font-bold font-serif text-gray-100 flex items-center gap-3">
                        Conflict Analysis Engine
                        {isScanning && <span className="text-xs font-mono text-red-500 animate-pulse">[SCANNING...]</span>}
                    </h2>
                    <p className="text-gray-400 mt-2">Detects timeline collisions, missing filings, and procedural paradoxes.</p>
                </div>
                <button
                    onClick={runAudit}
                    disabled={isScanning}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded shadow-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    RUN FORENSIC AUDIT
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {conflicts.length === 0 && !isScanning && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-700 rounded-lg">
                        <p className="text-gray-500">System Ready. Initiate audit to scan for irregularities.</p>
                    </div>
                )}

                {conflicts.map(conflict => (
                    <div 
                        key={conflict.id} 
                        className={`relative p-6 rounded-lg border-l-8 shadow-md transition-transform hover:-translate-y-1 ${
                            conflict.severity === 'high' ? 'bg-red-900/20 border-red-600' : 
                            conflict.severity === 'medium' ? 'bg-orange-900/20 border-orange-500' : 
                            'bg-yellow-900/20 border-yellow-500'
                        }`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className={`text-xl font-bold ${
                                conflict.severity === 'high' ? 'text-red-400' : 
                                conflict.severity === 'medium' ? 'text-orange-400' : 
                                'text-yellow-400'
                            }`}>
                                {conflict.title}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                conflict.severity === 'high' ? 'bg-red-900 text-red-200' : 'bg-gray-800 text-gray-400'
                            }`}>
                                {conflict.type.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-gray-300 font-mono text-sm leading-relaxed mb-4">
                            {conflict.description}
                        </p>
                        <div className="flex justify-between items-center pt-4 border-t border-gray-700/50">
                             <span className="text-xs text-gray-500">Detected: {new Date(conflict.detectedAt).toLocaleTimeString()}</span>
                             <div className="flex gap-4">
                                 {onDraftRemedy && (
                                     <button 
                                        onClick={() => onDraftRemedy(conflict)}
                                        className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1 border border-red-900 bg-red-950/30 px-3 py-1 rounded hover:bg-red-900/50"
                                    >
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        DRAFT REMEDY
                                     </button>
                                 )}
                             </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConflictAnalysis;
