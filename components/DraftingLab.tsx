
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import type { TimelineMonth, Document } from '../types';

interface DraftingLabProps {
  timelineData: TimelineMonth[];
  documents: Document[];
}

const templates = [
    { id: 'motion-dismiss', title: 'Motion to Dismiss (Speedy Trial)', desc: 'Dismissal based on 6th Amendment violations.' },
    { id: 'motion-sanctions', title: 'Motion for Sanctions', desc: 'Targeting prosecutorial misconduct or discovery abuse.' },
    { id: 'judicial-complaint', title: 'Judicial Misconduct Complaint', desc: 'Formal complaint against judicial bias or abuse of discretion.' },
    { id: 'doj-referral', title: 'DOJ Pattern-or-Practice Referral', desc: 'Request for federal investigation into systemic deprivation of rights.' },
    { id: 'writ-mandamus', title: 'Petition for Writ of Mandamus', desc: 'Emergency order to compel the lower court to act.' }
];

const DraftingLab: React.FC<DraftingLabProps> = ({ timelineData, documents }) => {
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const handleGenerate = async () => {
        setIsGenerating(true);
        const flatEvents = timelineData.flatMap(m => m.events);
        const docList = documents.map(d => `${d.title} (${d.date})`).join(', ');
        
        const prompt = `
            You are a fierce, highly skilled civil rights defense attorney representing Cameron Church in State v. Church (CR23-0657).
            
            TASK: Draft a **${templates.find(t => t.id === selectedTemplate)?.title}**.
            
            EVIDENCE BASE:
            ${JSON.stringify(flatEvents.map(e => ({ date: e.date, title: e.title, violation: e.claim, description: e.cause + " -> " + e.effect })))}
            
            AVAILABLE DOCUMENTS:
            ${docList}
            
            INSTRUCTIONS:
            1. Use standard legal formatting (Heading, Introduction, Argument, Conclusion).
            2. Be aggressive, precise, and cite the specific dates and events from the timeline as factual predicates.
            3. Cite relevant US Supreme Court and Nevada caselaw where applicable to the specific motion type.
            4. Emphasize the "Pattern and Practice" of misconduct.
            
            Format the output in Markdown.
        `;

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            setGeneratedContent(response.text || 'Error generating document.');
        } catch (e) {
            console.error(e);
            setGeneratedContent("Error: Could not generate draft. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-6 flex justify-between items-end border-b border-gray-600 pb-4">
                <div>
                    <h2 className="text-3xl font-bold font-serif text-gray-100">Legal Drafting Lab</h2>
                    <p className="text-gray-400 mt-1">Select a strategic filing template. The AI will populate it with your forensic timeline data.</p>
                </div>
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                {/* Configuration Sidebar */}
                <div className="w-1/3 flex flex-col gap-4">
                    <div className="space-y-2 overflow-y-auto pr-2">
                        {templates.map(t => (
                            <div 
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTemplate === t.id ? 'bg-red-900/20 border-red-500' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                            >
                                <h3 className={`font-bold ${selectedTemplate === t.id ? 'text-red-400' : 'text-gray-200'}`}>{t.title}</h3>
                                <p className="text-xs text-gray-500 mt-1">{t.desc}</p>
                            </div>
                        ))}
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded shadow-lg flex items-center justify-center gap-2 mt-auto"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Drafting...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>
                                Generate Document
                            </>
                        )}
                    </button>
                </div>

                {/* Editor Area */}
                <div className="w-2/3 bg-gray-900 rounded-lg border border-gray-700 p-4 overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
                         <span className="text-xs font-mono text-gray-500">PREVIEW MODE</span>
                         <button 
                            onClick={() => navigator.clipboard.writeText(generatedContent)}
                            className="text-xs text-yellow-400 hover:text-yellow-300"
                         >
                            Copy to Clipboard
                         </button>
                    </div>
                    <textarea
                        className="w-full h-full bg-transparent text-gray-300 font-mono text-sm outline-none resize-none"
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        placeholder="Select a template and click Generate..."
                    />
                </div>
            </div>
        </div>
    );
};

export default DraftingLab;
