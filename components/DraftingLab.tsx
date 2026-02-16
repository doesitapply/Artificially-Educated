import React, { useState, useMemo, useEffect } from 'react';
import { Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineMonth, Document } from '../types';
import { aiClient } from '../ai-client';

interface DraftingLabProps {
  timelineData: TimelineMonth[];
  documents: Document[];
  selectedEventIds?: Set<string>;
  onClearSelection?: () => void;
  initialTemplateId?: string | null;
}

const templates = [
    { 
        id: 'motion-dismiss', 
        title: 'Motion to Dismiss (Speedy Trial)', 
        desc: 'Dismissal based on 6th Amendment/Barker v. Wingo violations.',
        category: 'DEFENSIVE'
    },
    { 
        id: 'motion-compel', 
        title: 'Motion to Compel Discovery (Brady)', 
        desc: 'Force production of exculpatory evidence withheld by prosecution.',
        category: 'OFFENSIVE'
    },
    { 
        id: 'motion-sanctions', 
        title: 'Motion for Sanctions', 
        desc: 'Targeting prosecutorial misconduct or bad-faith delays.',
        category: 'OFFENSIVE'
    },
    { 
        id: 'motion-recusal', 
        title: 'Motion to Disqualify Judge', 
        desc: 'Demand recusal based on demonstrated bias or conflict (NRS 1.230 / 28 U.S.C. § 455).',
        category: 'OFFENSIVE'
    },
    { 
        id: 'writ-habeas', 
        title: 'Petition for Writ of Habeas Corpus', 
        desc: 'Challenge the legality of detention (28 U.S.C. § 2254 / § 2241).',
        category: 'NUCLEAR'
    },
    { 
        id: 'writ-mandamus', 
        title: 'Petition for Writ of Mandamus', 
        desc: 'Emergency order from higher court to compel lower court action.',
        category: 'NUCLEAR'
    },
    { 
        id: 'doj-referral', 
        title: 'DOJ Pattern-or-Practice Referral', 
        desc: 'Request federal investigation into systemic deprivation of rights (34 U.S.C. § 12601).',
        category: 'NUCLEAR'
    },
    { 
        id: 'section-1983', 
        title: 'Civil Rights Complaint (§ 1983)', 
        desc: 'Federal lawsuit for damages against state actors for constitutional violations.',
        category: 'NUCLEAR'
    },
    { 
        id: 'judicial-complaint', 
        title: 'Judicial Misconduct Complaint', 
        desc: 'Formal administrative complaint regarding judicial demeanor or ethics.',
        category: 'ADMIN'
    },
    { 
        id: 'notice-removal', 
        title: 'Notice of Removal to Federal Court', 
        desc: 'Remove state criminal prosecution to Federal Court under 28 U.S.C. § 1443 or § 1455.',
        category: 'STRATEGIC'
    }
];

type ToneStrategy = 'AGGRESSIVE' | 'PROCEDURAL' | 'DEFENSIVE';

interface StrategyRecommendation {
    templateId: string;
    strategyName: string;
    reasoning: string;
    confidence: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'NUCLEAR';
}

const DraftingLab: React.FC<DraftingLabProps> = ({ 
    timelineData, 
    documents, 
    selectedEventIds, 
    onClearSelection,
    initialTemplateId
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState(templates[0].id);
    const [tone, setTone] = useState<ToneStrategy>('PROCEDURAL');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Strategy State
    const [recommendation, setRecommendation] = useState<StrategyRecommendation | null>(null);
    const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState(false);

    useEffect(() => {
        if (initialTemplateId) setSelectedTemplate(initialTemplateId);
    }, [initialTemplateId]);

    // Derived State for Targeted Drafting
    const targetMode = selectedEventIds && selectedEventIds.size > 0;
    
    // Filter events if in target mode
    const activeEvents = useMemo(() => {
        const allEvents = timelineData.flatMap(m => m.events);
        if (!targetMode || !selectedEventIds) return allEvents;
        return allEvents.filter(e => selectedEventIds.has(e.id));
    }, [timelineData, selectedEventIds, targetMode]);

    const contextStats = {
        eventCount: activeEvents.length,
        docCount: documents.length
    };

    // Auto-Run Strategy Analysis when Targets Change
    useEffect(() => {
        if (targetMode) {
            analyzeStrategy();
        } else {
            setRecommendation(null);
        }
    }, [selectedEventIds]); // Only re-run if selection ID set changes specifically

    const analyzeStrategy = async () => {
        if (activeEvents.length === 0) return;
        setIsAnalyzingStrategy(true);

        const prompt = `
            You are a Senior Litigation Strategist.
            Analyze the following selected timeline events.
            Determine the single most effective legal filing from the provided arsenal.
            
            SELECTED EVENTS:
            ${JSON.stringify(activeEvents.map(e => ({ date: e.date, title: e.title, desc: e.cause + ' ' + e.effect })))}
            
            AVAILABLE ARSENAL (Templates):
            ${JSON.stringify(templates.map(t => ({ id: t.id, name: t.title, category: t.category })))}
            
            TASK:
            1. Recommend the best template ID.
            2. Explain WHY (Reasoning).
            3. Assess Risk Level (LOW/MEDIUM/HIGH/NUCLEAR).
            
            OUTPUT JSON: { templateId, strategyName, reasoning, confidence, riskLevel }
        `;

        try {
            const result = await aiClient.generateJSON({
                systemPrompt: MASTER_SYSTEM_PROMPT,
                userPrompt: prompt,
                jsonMode: true,
                schema: {
                    type: Type.OBJECT,
                    properties: {
                        templateId: { type: Type.STRING },
                        strategyName: { type: Type.STRING },
                        reasoning: { type: Type.STRING },
                        confidence: { type: Type.NUMBER },
                        riskLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'NUCLEAR'] }
                    }
                }
            });
            
            setRecommendation(result);
            if (result.templateId && templates.some(t => t.id === result.templateId)) {
                setSelectedTemplate(result.templateId);
            }
        } catch (e) {
            console.error("Strategy Analysis Failed", e);
        } finally {
            setIsAnalyzingStrategy(false);
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        
        // Prepare Document List as Exhibits
        const docList = documents.map((d, i) => `Exhibit ${String.fromCharCode(65 + i)}: ${d.title} (Bates: ${d.batesNumber || 'N/A'}) - SHA256: ${d.hash?.substring(0,8)}...`).join('\n');
        
        let specificInstructions = "";
        
        // Tactical Instructions based on Template
        switch (selectedTemplate) {
            case 'doj-referral':
                specificInstructions = `
                ## **DOJ REFERRAL GUIDELINES**
                1.  **Nexus:** Explicitly link Court/PD actors to *law enforcement detention mechanisms*.
                2.  **Phrasing:** Use "functions as a structural mechanism that insulates court actors from oversight."
                3.  **Pattern:** Visualize the cycle: Protected Activity -> Obstruction -> Adverse Action.
                `;
                break;
            case 'writ-habeas':
                specificInstructions = `
                ## **HABEAS CORPUS GUIDELINES**
                1.  **Focus:** The illegality of the *current custody* or conditions of release.
                2.  **Exhaustion:** Explicitly state how state remedies have been exhausted or are futile (cite specific ignored motions).
                3.  **Relief:** Immediate release or setting of reasonable bail.
                `;
                break;
            case 'motion-compel':
                specificInstructions = `
                ## **MOTION TO COMPEL (BRADY) GUIDELINES**
                1.  **Specifics:** Identify exactly what is missing (Bodycam, Communications, etc.).
                2.  **Materiality:** Explain why this evidence is exculpatory or impeachment material.
                3.  **Prejudice:** Argue that suppression undermines confidence in the outcome (Kyles v. Whitley).
                `;
                break;
            case 'motion-recusal':
                specificInstructions = `
                ## **RECUSAL GUIDELINES**
                1.  **Bias Source:** Cite *extrajudicial* sources of bias if possible, or *pervasive* intrajudicial bias (Liteky v. U.S.).
                2.  **Objective Standard:** Argue that "impartiality might reasonably be questioned."
                3.  **Tone:** Firm but respectful; focus on the *appearance* of impropriety.
                `;
                break;
            case 'section-1983':
                specificInstructions = `
                ## **SECTION 1983 GUIDELINES**
                1.  **Color of Law:** Explicitly state defendants acted under color of state statutes/customs.
                2.  **Deprivation:** Link specific timeline events to specific Amendments (1st, 4th, 6th, 14th).
                3.  **Monell:** If suing the County, cite the "custom or policy" of ignoring pro se filings.
                `;
                break;
            default:
                specificInstructions = `
                ## **MOTION GUIDELINES**
                1.  **Format:** Standard Federal/State motion format (Caption, Intro, Facts, Argument, Conclusion).
                2.  **Citations:** Cite specific timeline events using [Date: Title].
                3.  **Exhibits:** YOU MUST reference the available documents as Exhibits (e.g., "See Exhibit A").
                `;
        }

        const prompt = `
            You are a specialized Legal Drafting Engine (Project MANUS).
            TASK: Draft a **${templates.find(t => t.id === selectedTemplate)?.title}** for Case No. CR23-0657 / 3:24-cv-00579.
            
            STRATEGY SETTING: **${tone}**
            ${tone === 'AGGRESSIVE' ? "- Focus on 'bad faith', 'deliberate indifference', and 'systemic bias'. Use strong verbs." : ""}
            ${tone === 'PROCEDURAL' ? "- Focus on 'statutory deadlines', 'rules of civil procedure', and 'jurisdictional errors'. Be cold and clinical." : ""}
            ${tone === 'DEFENSIVE' ? "- Focus on 'preservation of rights', 'exhaustion of remedies', and 'compliance'. Be cautious." : ""}

            ${targetMode ? "CRITICAL: The user has selected a TARGETED subset of events. Focus the motion entirely on these specific events, ignoring extraneous history unless necessary for context." : "Use the entire timeline to build the narrative."}

            TIMELINE EVIDENCE (The Facts):
            ${JSON.stringify(activeEvents.map(e => ({ 
                date: e.date, 
                title: e.title, 
                violation: e.claim, 
                description: e.cause + " -> " + e.effect,
                source: e.sourceCitation ? `(Supported by Record: ${e.sourceCitation})` : "(Alleged)"
            })))}
            
            AVAILABLE DOCUMENTS (The Proof):
            ${docList}
            
            ${specificInstructions}
            
            OUTPUT:
            Full legal document in Markdown. Include Caption, Introduction, Statement of Facts, Argument, and Conclusion.
        `;

        try {
            const text = await aiClient.generate({
                systemPrompt: MASTER_SYSTEM_PROMPT,
                userPrompt: prompt
            });
            setGeneratedContent(text);
        } catch (e) {
            console.error(e);
            setGeneratedContent("Error: Could not generate draft. AI Provider connection failed.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in h-[calc(100vh-140px)] flex flex-col">
            <div className="mb-6 border-b border-gray-600 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold font-serif text-gray-100 flex items-center gap-3">
                            Motion Maker
                            {targetMode && (
                                <span className="text-xs bg-red-950/50 text-red-400 border border-red-500 px-2 py-1 font-mono tracking-widest animate-pulse">
                                    PRECISION STRIKE MODE
                                </span>
                            )}
                        </h2>
                        <p className="text-gray-400 mt-1">Select a template. AI will fuse your {targetMode ? "SELECTED" : "Timeline"} Events and Evidence into a filing.</p>
                    </div>
                    <div className="flex gap-4">
                        {targetMode && (
                            <button 
                                onClick={onClearSelection}
                                className="text-xs text-red-400 hover:text-red-300 underline font-mono self-center mr-4"
                            >
                                [CLEAR TARGETS]
                            </button>
                        )}
                        <div className="text-right">
                            <span className={`block text-xl font-bold font-mono ${targetMode ? 'text-red-400' : 'text-cyan-400'}`}>
                                {contextStats.eventCount}
                            </span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Events</span>
                        </div>
                        <div className="text-right">
                            <span className="block text-xl font-bold text-cyan-400 font-mono">{contextStats.docCount}</span>
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Exhibits</span>
                        </div>
                    </div>
                </div>

                {/* TACTICAL RECOMMENDATION ENGINE */}
                {isAnalyzingStrategy && (
                    <div className="mt-4 p-3 bg-cyan-900/20 border border-cyan-500/30 rounded flex items-center gap-3 animate-pulse">
                        <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest">
                            ANALYZING LEGAL VECTORS...
                        </span>
                    </div>
                )}

                {recommendation && !isAnalyzingStrategy && (
                    <div className={`mt-4 p-4 rounded border-l-4 shadow-lg animate-fade-in ${
                        recommendation.riskLevel === 'NUCLEAR' ? 'bg-red-950/20 border-red-600' : 
                        recommendation.riskLevel === 'HIGH' ? 'bg-orange-950/20 border-orange-500' : 
                        'bg-cyan-950/20 border-cyan-500'
                    }`}>
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <h3 className={`text-sm font-bold font-hud uppercase tracking-widest flex items-center gap-2 ${
                                    recommendation.riskLevel === 'NUCLEAR' ? 'text-red-400' : 'text-cyan-400'
                                }`}>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    STRATEGY IDENTIFIED: {recommendation.strategyName}
                                </h3>
                            </div>
                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded uppercase ${
                                recommendation.riskLevel === 'NUCLEAR' ? 'border-red-500 text-red-500' : 'border-cyan-500 text-cyan-500'
                            }`}>
                                RISK: {recommendation.riskLevel}
                            </span>
                        </div>
                        <p className="text-xs text-gray-300 font-mono leading-relaxed mb-3">
                            <strong className="text-gray-500">REASONING:</strong> {recommendation.reasoning}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedTemplate(recommendation.templateId)}
                                className={`text-[10px] font-bold px-3 py-1.5 rounded transition-colors uppercase flex items-center gap-1 ${
                                    selectedTemplate === recommendation.templateId
                                    ? 'bg-green-600 text-white cursor-default'
                                    : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600'
                                }`}
                            >
                                {selectedTemplate === recommendation.templateId ? (
                                    <>✓ TEMPLATE SELECTED</>
                                ) : (
                                    <>APPLY RECOMENDATION</>
                                )}
                            </button>
                            <span className="text-[10px] text-gray-600 font-mono">Confidence: {recommendation.confidence}%</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-6 flex-1 min-h-0">
                <div className="w-1/3 flex flex-col gap-4">
                    {/* Strategy Selector */}
                    <div className="bg-gray-900 border border-gray-700 p-4 rounded-lg mb-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Strategy / Tone</label>
                        <div className="flex gap-2">
                            {(['PROCEDURAL', 'AGGRESSIVE', 'DEFENSIVE'] as ToneStrategy[]).map(t => (
                                <button
                                    key={t}
                                    onClick={() => setTone(t)}
                                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-all ${
                                        tone === t 
                                        ? t === 'AGGRESSIVE' ? 'bg-red-900 text-red-100 border-red-500 shadow-[0_0_10px_red]' 
                                        : 'bg-cyan-900 text-cyan-100 border-cyan-500 shadow-[0_0_10px_cyan]'
                                        : 'bg-gray-800 text-gray-500 border-gray-700 hover:border-gray-500'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Template List */}
                    <div className="space-y-2 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                        {templates.map(t => (
                            <div 
                                key={t.id}
                                onClick={() => setSelectedTemplate(t.id)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all group ${
                                    selectedTemplate === t.id 
                                    ? t.category === 'NUCLEAR' ? 'bg-red-950/40 border-red-500' : 'bg-cyan-950/40 border-cyan-500' 
                                    : 'bg-gray-900 border-gray-700 hover:border-gray-500'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className={`font-bold text-sm ${selectedTemplate === t.id ? 'text-white' : 'text-gray-300'}`}>{t.title}</h3>
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                                        t.category === 'NUCLEAR' ? 'border-red-600 text-red-500' : 
                                        t.category === 'OFFENSIVE' ? 'border-orange-600 text-orange-500' : 
                                        'border-gray-600 text-gray-500'
                                    }`}>
                                        {t.category}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">{t.desc}</p>
                            </div>
                        ))}
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={`w-full text-white font-bold py-3 px-4 rounded shadow-lg flex items-center justify-center gap-2 mt-auto transition-transform active:scale-95 border ${
                            targetMode 
                            ? 'bg-red-700 hover:bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.4)]' 
                            : 'bg-gradient-to-r from-cyan-800 to-cyan-700 hover:from-cyan-700 hover:to-cyan-600 border-cyan-500'
                        }`}
                    >
                        {isGenerating ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span className="animate-pulse">{targetMode ? "EXECUTING STRIKE..." : "ASSEMBLING FILING..."}</span>
                            </>
                        ) : (
                            targetMode ? "GENERATE TARGETED MOTION" : "GENERATE DOCUMENT"
                        )}
                    </button>
                </div>

                {/* Editor / Preview */}
                <div className="w-2/3 bg-gray-900 rounded-lg border border-gray-700 p-4 overflow-hidden flex flex-col relative shadow-inner">
                    <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-800">
                         <span className="text-xs font-mono text-gray-500">PREVIEW MODE</span>
                         <button 
                            onClick={() => navigator.clipboard.writeText(generatedContent)}
                            className="text-xs text-yellow-400 hover:text-yellow-300 font-bold flex items-center gap-1"
                         >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            COPY TO CLIPBOARD
                         </button>
                    </div>
                    <textarea
                        className="w-full h-full bg-transparent text-gray-300 font-mono text-sm outline-none resize-none p-2 custom-scrollbar"
                        value={generatedContent}
                        onChange={(e) => setGeneratedContent(e.target.value)}
                        placeholder={targetMode ? "Targeted Mode Active. Selected events will form the core of the motion..." : "Select a strategy and template, then click GENERATE..."}
                    />
                    {isGenerating && (
                        <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                            <div className="text-red-500 font-hud text-2xl animate-pulse mb-2 tracking-widest">CONSTRUCTING ARGUMENTS</div>
                            <div className="text-cyan-500 text-xs font-mono">Injecting {contextStats.docCount} Exhibits...</div>
                            <div className="text-cyan-500 text-xs font-mono mt-1">Cross-referencing {contextStats.eventCount} Timeline Events...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DraftingLab;