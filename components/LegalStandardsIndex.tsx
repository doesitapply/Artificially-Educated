
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { TimelineMonth, LegalStandard } from '../types';

interface LegalStandardsIndexProps {
  timelineData: TimelineMonth[];
}

const LegalStandardsIndex: React.FC<LegalStandardsIndexProps> = ({ timelineData }) => {
    const [standards, setStandards] = useState<LegalStandard[]>([]);
    const [isCompiling, setIsCompiling] = useState(false);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    useEffect(() => {
        if (standards.length === 0 && timelineData.length > 0) {
            compileAuthorities();
        }
    }, []);

    const compileAuthorities = async () => {
        setIsCompiling(true);
        const claims = Array.from(new Set(timelineData.flatMap(m => m.events).map(e => e.claim))).filter(Boolean);
        
        const prompt = `
            You are a Law Clerk for the Ninth Circuit.
            Based on the following constitutional claims asserted in a § 1983 timeline, generate a "Table of Authorities".
            
            CLAIMS ASSERTED:
            ${claims.join(', ')}
            
            OUTPUT:
            A list of specific Case Law (SCOTUS/Ninth Circuit) and Statutes (USC/NRS) that govern these specific claims.
            Focus on: Brady violations, Speedy Trial (Barker v Wingo), Ineffective Assistance (Strickland), and Retaliation (Mt. Healthy).
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
                                category: { type: Type.STRING },
                                title: { type: Type.STRING },
                                citation: { type: Type.STRING },
                                relevance: { type: Type.STRING },
                                type: { type: Type.STRING, enum: ['case_law', 'statute', 'rule'] }
                            }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || '[]');
            setStandards(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsCompiling(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)]">
             <div className="mb-8 border-b border-gray-600 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold font-serif text-gray-100">Violation Authority Index</h2>
                    <p className="text-gray-400 mt-2">Dynamic Table of Authorities supporting detected violations.</p>
                </div>
                <button 
                    onClick={compileAuthorities}
                    disabled={isCompiling}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                    {isCompiling ? "Compiling..." : "Refresh Authorities"}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {standards.map((std, idx) => (
                    <div key={idx} className="bg-gray-900 border border-gray-700 p-5 rounded-lg hover:border-blue-500 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">{std.category}</span>
                            <span className="text-[10px] bg-gray-800 px-2 py-1 rounded text-gray-500 uppercase">{std.type.replace('_', ' ')}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-200 group-hover:text-blue-300 transition-colors">{std.title}</h3>
                        <p className="text-sm font-mono text-yellow-500 mb-3">{std.citation}</p>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {std.relevance}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LegalStandardsIndex;
