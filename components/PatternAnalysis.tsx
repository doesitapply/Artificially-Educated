
import React, { useEffect, useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { TimelineMonth, PatternLoop } from '../types';

interface PatternAnalysisProps {
  timelineData: TimelineMonth[];
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ timelineData }) => {
    const [loops, setLoops] = useState<PatternLoop[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    useEffect(() => {
        analyzePatterns();
    }, [timelineData]);

    const analyzePatterns = async () => {
        setIsLoading(true);
        const flatEvents = timelineData.flatMap(m => m.events);
        
        const prompt = `
            Analyze this timeline for "Retaliation Loops" and "Systemic Patterns".
            A Retaliation Loop is when the Defendant asserts a right (files a motion, asks for counsel) and the State/Court responds with an adverse action (warrant, competency hearing, strike order) shortly after.
            
            EVENTS:
            ${JSON.stringify(flatEvents.map(e => ({ id: e.id, date: e.date, title: e.title, description: e.cause })))}
            
            Return JSON array of patterns found.
        `;

        try {
             const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                title: { type: Type.STRING },
                                description: { type: Type.STRING },
                                daysLag: { type: Type.NUMBER, description: "Days between trigger and reaction" },
                                severity: { type: Type.STRING, enum: ["high", "critical"] }
                            }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || '[]');
            setLoops(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in">
            <div className="mb-8">
                 <h2 className="text-3xl font-bold font-serif text-gray-100">Pattern Recognition Engine</h2>
                 <p className="text-gray-400 mt-2">Detecting systemic anomalies and retaliation loops in the timeline data.</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            ) : (
                <div className="space-y-6">
                    {loops.length === 0 ? (
                        <p className="text-gray-500 italic">No strong patterns detected yet.</p>
                    ) : (
                        loops.map(loop => (
                            <div key={loop.id} className="bg-gray-900 border-l-4 border-indigo-500 p-6 rounded-r-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-indigo-300">{loop.title}</h3>
                                        <span className={`px-2 py-1 text-xs font-bold uppercase rounded ${loop.severity === 'critical' ? 'bg-red-900 text-red-200' : 'bg-yellow-900 text-yellow-200'}`}>
                                            {loop.severity} Severity
                                        </span>
                                    </div>
                                    <p className="text-gray-300 mb-4">{loop.description}</p>
                                    <div className="flex items-center text-sm text-gray-500 font-mono">
                                        <span className="mr-2">⏱ Reaction Time:</span>
                                        <span className="text-white font-bold">{loop.daysLag} Days</span>
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
