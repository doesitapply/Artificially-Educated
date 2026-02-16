
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineMonth, SimulationScenario } from '../types';

interface TacticalSimulatorProps {
  timelineData: TimelineMonth[];
}

const TacticalSimulator: React.FC<TacticalSimulatorProps> = ({ timelineData }) => {
    const [userAction, setUserAction] = useState('');
    const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);
    
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const runSimulation = async () => {
        if (!userAction.trim()) return;
        setIsSimulating(true);

        const flatEvents = timelineData.flatMap(m => m.events);
        const prompt = `
            You are a Strategic Legal AI Simulator for Case 3:24-cv-00579.
            The user (Plaintiff) proposes an action.
            Based on the historic behavior of the "Washoe System" (Judge Breslow, DA, Counsel) in the timeline below, predict the REACTION.
            
            TIMELINE PATTERNS:
            ${JSON.stringify(flatEvents.slice(-20).map(e => ({ title: e.title, desc: e.cause + ' -> ' + e.effect })))}
            
            USER ACTION: "${userAction}"
            
            Generate 3 likely scenarios:
            1. Most Likely Reaction (Based on past retaliation/striking).
            2. Best Case Scenario.
            3. Worst Case Scenario (Retaliation).
            
            Provide probability %, Risk Level, and Reasoning based on timeline precedents.
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
                                userAction: { type: Type.STRING },
                                predictedReaction: { type: Type.STRING },
                                probability: { type: Type.NUMBER },
                                riskLevel: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
                                likelyActors: { type: Type.ARRAY, items: { type: Type.STRING } },
                                reasoning: { type: Type.STRING }
                            }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text || '[]');
            setScenarios(data);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="glass-panel p-6 md:p-8 rounded-sm animate-fade-in min-h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-6 border-b border-gray-800 pb-4">
                 <h2 className="text-3xl font-bold font-hud text-gray-100 flex items-center gap-3">
                    TACTICAL SIMULATOR
                    <span className="text-[10px] bg-red-950/50 text-red-400 px-2 py-1 border border-red-600 font-mono tracking-widest">WAR ROOM</span>
                </h2>
                 <p className="text-gray-400 mt-2 font-mono text-xs">PREDICT SYSTEM REACTIONS BASED ON HISTORICAL BEHAVIORAL PROFILES.</p>
            </div>

            <div className="flex gap-4 mb-8 bg-slate-900/50 p-1 border border-slate-700 rounded-sm">
                <input 
                    type="text" 
                    value={userAction}
                    onChange={(e) => setUserAction(e.target.value)}
                    placeholder="ENTER PROPOSED ACTION (e.g., 'File Motion to Disqualify Judge')"
                    className="flex-1 bg-transparent text-white p-4 font-mono outline-none placeholder-gray-600"
                    onKeyDown={(e) => e.key === 'Enter' && runSimulation()}
                />
                <button 
                    onClick={runSimulation}
                    disabled={isSimulating || !userAction}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold px-8 font-hud tracking-widest transition-all flex items-center gap-2 border-l border-slate-700"
                >
                    {isSimulating ? (
                        <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    ) : (
                        "SIMULATE"
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {scenarios.map((scenario, idx) => (
                    <div key={idx} className={`p-6 rounded-sm border-t-4 bg-slate-950/80 shadow-lg ${
                        scenario.riskLevel === 'critical' || scenario.riskLevel === 'high' ? 'border-red-600' : 
                        scenario.riskLevel === 'medium' ? 'border-amber-500' : 'border-green-500'
                    }`}>
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-[10px] font-bold text-gray-500 uppercase font-mono tracking-widest">SCENARIO {idx + 1}</span>
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase font-mono tracking-widest border ${
                                scenario.riskLevel === 'critical' ? 'border-red-500 text-red-500 bg-red-950/30' : 
                                scenario.riskLevel === 'high' ? 'border-orange-500 text-orange-500 bg-orange-950/30' : 
                                'border-green-500 text-green-500 bg-green-950/30'
                            }`}>
                                {scenario.riskLevel}
                            </span>
                        </div>
                        
                        <h3 className="text-base font-bold text-gray-100 mb-2 font-hud leading-tight min-h-[3rem]">{scenario.predictedReaction}</h3>
                        
                        <div className="flex items-center gap-4 mb-4 text-sm border-y border-gray-800 py-3">
                             <div className="flex flex-col">
                                 <span className="text-gray-600 text-[10px] uppercase">Probability</span>
                                 <span className={`font-mono text-xl font-bold ${scenario.probability > 70 ? 'text-cyan-400' : 'text-gray-400'}`}>{scenario.probability}%</span>
                             </div>
                             <div className="flex flex-col flex-1 text-right">
                                 <span className="text-gray-600 text-[10px] uppercase mb-1">Likely Actors</span>
                                 <div className="flex gap-1 justify-end flex-wrap">
                                    {scenario.likelyActors.map(a => (
                                        <span key={a} className="bg-slate-800 px-1.5 py-0.5 text-[10px] text-gray-300 font-mono border border-slate-700">{a}</span>
                                    ))}
                                 </div>
                             </div>
                        </div>

                        <p className="text-xs text-gray-400 font-mono leading-relaxed">
                            <strong className="text-cyan-600 block mb-1 uppercase tracking-wider">AI Analysis:</strong>
                            {scenario.reasoning}
                        </p>
                    </div>
                ))}
            </div>
            
            {scenarios.length === 0 && !isSimulating && (
                <div className="flex-1 flex items-center justify-center border border-dashed border-gray-800 rounded-sm opacity-50 bg-slate-900/20">
                    <div className="text-center">
                        <p className="text-cyan-900 font-hud text-xl tracking-widest">AWAITING TACTICAL INPUT</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TacticalSimulator;
