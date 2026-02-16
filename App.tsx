
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { reportSections as initialSections, timelineData as initialTimelineData } from './constants';
import { documents as initialDocuments } from '../public/documents';
import type { ReportSection, TimelineMonth, Document, TimelineEvent, CaseMetadata, Conflict } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Timeline from './components/Timeline';
import SectionContent from './components/SectionContent';
import Footer from './components/Footer';
import DocumentViewer from './components/DocumentViewer';
import PrintableReport from './components/PrintableReport';
import EvidenceInput from './components/EvidenceInput';
import DraftingLab from './components/DraftingLab';
import PatternAnalysis from './components/PatternAnalysis';
import ChainOfCustodyLedger from './components/ChainOfCustodyLedger';
import ConflictAnalysis from './components/ConflictAnalysis';
import LegalStandardsIndex from './components/LegalStandardsIndex';
import ActorNetwork from './components/ActorNetwork';
import TacticalSimulator from './components/TacticalSimulator';
import GlobalSearch from './components/GlobalSearch';
import ChatAssistant from './components/ChatAssistant';
import { db } from './db';
import { MASTER_SYSTEM_PROMPT } from './ai-config';

const DEFAULT_CASE_ID = '3:24-cv-00579';

const App: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('timeline');
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Persistent State
  const [cases, setCases] = useState<CaseMetadata[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>(DEFAULT_CASE_ID);
  
  // Dynamic State
  const [timelineData, setTimelineData] = useState<TimelineMonth[]>(initialTimelineData);
  // Initial state might contain full docs from constants, but DB load will replace with metadata
  const [documents, setDocuments] = useState<Document[]>(
    initialDocuments.map((doc, idx) => ({ 
        ...doc, 
        batesNumber: `DEF-${String(idx + 1).padStart(3, '0')}`,
        reliabilityScore: 100,
        caseId: DEFAULT_CASE_ID
    }))
  );
  const [caseFilter, setCaseFilter] = useState<string>('All');
  
  // Targeting System State (The "God's Hand")
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | null>(null);

  // Navigation & Highlighting State
  const [targetDocId, setTargetDocId] = useState<string | undefined>(undefined);
  const [targetCitation, setTargetCitation] = useState<string | undefined>(undefined);
  const [targetAnchor, setTargetAnchor] = useState<string | undefined>(undefined);
  const [highlightedEventId, setHighlightedEventId] = useState<string | undefined>(undefined);
  
  // Smart Sections State
  const [reportSections, setReportSections] = useState<ReportSection[]>(initialSections);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDbReady, setIsDbReady] = useState(false);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // --- DB Initialization & Loading ---
  useEffect(() => {
    const initPersistence = async () => {
        try {
            await db.init();
            
            // Load Cases
            const loadedCases = await db.getAllCases();
            if (loadedCases.length === 0) {
                // Init Default Case
                const defaultCase = {
                    id: DEFAULT_CASE_ID,
                    name: 'Church v. Breslow (3:24-cv-00579)',
                    description: 'Federal Civil Rights Action',
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                await db.saveCase(defaultCase);
                setCases([defaultCase]);
                
                // Save Initial Data
                for (const doc of documents) {
                    await db.saveDocument(doc);
                }
                const flatEvents = initialTimelineData.flatMap(m => m.events);
                for (const ev of flatEvents) {
                    await db.saveEvent({ ...ev, caseId: DEFAULT_CASE_ID });
                }
            } else {
                setCases(loadedCases);
            }
            
            setIsDbReady(true);
            loadCaseData(DEFAULT_CASE_ID);
        } catch (e) {
            console.error("DB Init Failed:", e);
        }
    };
    initPersistence();
  }, []);

  const loadCaseData = async (caseId: string) => {
      if (!db) return;
      
      try {
          // Load Events
          const events = await db.getEventsByCase(caseId);
          // Group by Month
          const grouped: { [key: string]: TimelineEvent[] } = {};
          events.forEach(ev => {
              const date = new Date(ev.date);
              const month = date.toLocaleString('default', { month: 'long', year: 'numeric' });
              if (!grouped[month]) grouped[month] = [];
              grouped[month].push(ev);
          });
          
          const sortedMonths = Object.keys(grouped).sort((a, b) => {
               const dateA = new Date(grouped[a][0].date);
               const dateB = new Date(grouped[b][0].date);
               return dateA.getTime() - dateB.getTime();
          });
          
          const newTimelineData: TimelineMonth[] = sortedMonths.map(m => ({
              month: m,
              events: grouped[m].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          }));

          if (events.length > 0) setTimelineData(newTimelineData);

          // Load Documents (Metadata Only)
          const docs = await db.getDocumentsByCase(caseId);
          if (docs.length > 0) setDocuments(docs);
          
      } catch (e) {
          console.error("Failed to load case data:", e);
      }
  };

  const handleCreateCase = async () => {
      const name = prompt("Enter New Case Name (e.g., 'State v. Doe'):");
      if (!name) return;
      
      const newCaseId = `case-${Date.now()}`;
      const newCase: CaseMetadata = {
          id: newCaseId,
          name,
          description: 'New Workspace',
          created: new Date().toISOString(),
          lastModified: new Date().toISOString()
      };
      
      await db.saveCase(newCase);
      setCases([...cases, newCase]);
      handleSwitchCase(newCaseId);
  };

  const handleSwitchCase = async (caseId: string) => {
      setActiveCaseId(caseId);
      // Clear current state visual only, then load
      setTimelineData([]); 
      setDocuments([]); 
      setSelectedEventIds(new Set()); // Clear selection
      await loadCaseData(caseId);
  };

  const handleAddEvents = async (newEvents: TimelineEvent[]) => {
    // 1. Update DB
    for (const ev of newEvents) {
        await db.saveEvent({ ...ev, caseId: activeCaseId });
    }

    // 2. Update State
    const updatedData = [...timelineData];

    newEvents.forEach(event => {
      const eventDate = new Date(event.date);
      const monthName = eventDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const existingMonthIndex = updatedData.findIndex(m => m.month === monthName);

      if (existingMonthIndex >= 0) {
        updatedData[existingMonthIndex].events.push(event);
        updatedData[existingMonthIndex].events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      } else {
        updatedData.push({
          month: monthName,
          events: [event]
        });
      }
    });

    updatedData.sort((a, b) => {
      const dateA = new Date(a.events[0]?.date || a.month);
      const dateB = new Date(b.events[0]?.date || b.month);
      return dateA.getTime() - dateB.getTime();
    });

    setTimelineData(updatedData);
    setActiveSectionId('timeline');
  };

  const handleAddDocument = async (doc: Document) => {
    const newDoc = {
      ...doc,
      batesNumber: `DEF-${String(documents.length + 1).padStart(3, '0')}`,
      reliabilityScore: 100,
      caseId: activeCaseId
    };
    
    // Save splits the content automatically in DB
    await db.saveDocument(newDoc);
    
    // Update state with metadata only to save memory
    // Create a lightweight copy
    const { content, mediaData, ...metaDoc } = newDoc;
    setDocuments(prev => [...prev, metaDoc as Document]);
  };

  const handleFetchDocumentContent = async (id: string) => {
      return await db.getDocumentContent(id);
  };

  // Targeting / Selection Logic
  const toggleEventSelection = (eventId: string) => {
      const newSet = new Set(selectedEventIds);
      if (newSet.has(eventId)) newSet.delete(eventId);
      else newSet.add(eventId);
      setSelectedEventIds(newSet);
  };

  const clearEventSelection = () => {
      setSelectedEventIds(new Set());
      setPreselectedTemplateId(null);
  };

  // Navigate from Conflict/Pattern -> Drafting
  const handleDraftFromConflict = (conflict: Conflict) => {
      if (conflict.involvedEventIds) {
          setSelectedEventIds(new Set(conflict.involvedEventIds));
      }
      setPreselectedTemplateId('motion-sanctions');
      setActiveSectionId('drafting-lab');
  };

  // Navigate from Timeline -> Document
  const handleViewDocument = (docId: string, citation?: string, anchor?: string) => {
      setTargetDocId(docId);
      setTargetCitation(citation);
      setTargetAnchor(anchor);
      setActiveSectionId('documents');
  };

  // Navigate from Document -> Timeline
  const handleNavigateToEvent = (eventId: string) => {
      setHighlightedEventId(eventId);
      setActiveSectionId('timeline');
  };

  const performFullCaseAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const flatEvents = timelineData.flatMap(m => m.events);
      const prompt = `
        You are a Forensic Judicial Timeline Analyst AI assigned to Case No. 3:24-cv-00579-ART-CSD (Church v. Breslow et al.) and related underlying state matters.

        INPUT TIMELINE DATA:
        ${JSON.stringify(flatEvents.map(e => ({ 
            date: e.date, 
            title: e.title, 
            cause: e.cause, 
            effect: e.effect,
            legalSignificance: e.legalSignificance,
            caseReference: e.caseReference || 'CR23-0657'
        })))}

        PRIMARY GOAL: Regenerate Executive Summary, Systemic Violations, and Conclusion.
        
        TASK 1: Executive Summary (2-4 paragraphs) - Identify key actors, phases, and constitutional domains.
        TASK 2: Systemic Violations - Organize by: Pretrial Restraints, Record Handling, Charging Decisions, Judicial Conduct, Retaliation. Cite specific dates/events.
        TASK 3: Conclusion & Remedial Frame - Summarize patterns relevant to § 1983 liability and DOJ intervention.

        Return JSON keys: "summary", "systemic", "conclusion". Content in Markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
            systemInstruction: MASTER_SYSTEM_PROMPT,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    systemic: { type: Type.STRING },
                    conclusion: { type: Type.STRING }
                }
            }
        }
      });

      const analysis = JSON.parse(response.text || '{}');

      setReportSections(prev => prev.map(section => {
        if (section.id === 'summary' && analysis.summary) return { ...section, content: analysis.summary, isAiGenerated: true };
        if (section.id === 'systemic' && analysis.systemic) return { ...section, content: analysis.systemic, isAiGenerated: true };
        if (section.id === 'conclusion' && analysis.conclusion) return { ...section, content: analysis.conclusion, isAiGenerated: true };
        return section;
      }));

    } catch (e) {
      console.error("Analysis failed", e);
      alert("Failed to regenerate case analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveCase = () => {
      const caseData = {
          version: '2.0',
          savedAt: new Date().toISOString(),
          timelineData,
          documents,
          reportSections
      };
      const blob = new Blob([JSON.stringify(caseData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MANUS_DOSSIER_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleLoadCase = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const result = e.target?.result as string;
              const data = JSON.parse(result);
              
              if (data.timelineData) setTimelineData(data.timelineData);
              if (data.documents) setDocuments(data.documents);
              if (data.reportSections) setReportSections(data.reportSections);
              
              alert("Dossier loaded successfully.");
          } catch (err) {
              console.error(err);
              alert("Failed to parse dossier file.");
          }
      };
      reader.readAsText(file);
  };

  const renderMainContent = () => {
    switch (activeSectionId) {
      case 'timeline':
        return (
            <Timeline 
                data={timelineData} 
                onViewDocument={handleViewDocument} 
                highlightedEventId={highlightedEventId}
                caseFilter={caseFilter}
                setCaseFilter={setCaseFilter}
                selectedEventIds={selectedEventIds}
                onToggleEventSelection={toggleEventSelection}
            />
        );
      case 'documents':
        return (
            <DocumentViewer 
                documents={documents} 
                targetDocId={targetDocId} 
                targetCitation={targetCitation}
                targetAnchor={targetAnchor}
                timelineData={timelineData}
                onNavigateToEvent={handleNavigateToEvent}
                onLoadContent={handleFetchDocumentContent}
            />
        );
      case 'evidence-input':
        return (
          <EvidenceInput 
            onAddEvents={handleAddEvents} 
            onAddDocument={handleAddDocument} 
            documents={documents}
          />
        );
      case 'drafting-lab':
        return (
            <DraftingLab 
                timelineData={timelineData} 
                documents={documents} 
                selectedEventIds={selectedEventIds}
                onClearSelection={clearEventSelection}
                initialTemplateId={preselectedTemplateId}
            />
        );
      case 'pattern-analysis':
        return <PatternAnalysis timelineData={timelineData} />;
      case 'custody-ledger':
        return <ChainOfCustodyLedger documents={documents} />;
      case 'conflict-analysis':
        return (
            <ConflictAnalysis 
                timelineData={timelineData} 
                onDraftRemedy={handleDraftFromConflict}
            />
        );
      case 'legal-standards':
        return <LegalStandardsIndex timelineData={timelineData} />;
      case 'actor-network':
        return <ActorNetwork timelineData={timelineData} />;
      case 'tactical-simulator':
        return <TacticalSimulator timelineData={timelineData} />;
      case 'global-search':
        return (
            <GlobalSearch 
                timelineData={timelineData} 
                documents={documents} 
                onNavigateToEvent={handleNavigateToEvent}
                onViewDocument={(id) => handleViewDocument(id)}
            />
        );
      default:
        const activeSection = reportSections.find(s => s.id === activeSectionId);
        if (activeSection) {
            return <SectionContent section={activeSection} />;
        }
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>Section not found</p>
            </div>
        );
    }
  };

  const handleExportPDF = () => {
    setIsPrinting(true);
  };

  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => {
        setIsPrinting(false);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      setTimeout(() => window.print(), 500);
      return () => window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, [isPrinting]);

  if (isPrinting) {
    return <PrintableReport 
      sections={reportSections} 
      timelineData={timelineData} 
      documents={documents} 
    />;
  }

  if (!isDbReady) {
      return (
          <div className="min-h-screen bg-black flex flex-col items-center justify-center">
              <div className="text-center space-y-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mx-auto shadow-[0_0_20px_rgba(6,182,212,0.5)]"></div>
                  <h2 className="text-2xl font-hud font-bold text-white tracking-widest">PROJECT MANUS</h2>
                  <p className="text-cyan-500 font-mono text-sm blink">INITIALIZING SECURE ENCLAVE...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen text-gray-300" id="app-container">
      <Header onExportPDF={handleExportPDF} onSaveCase={handleSaveCase} onLoadCase={handleLoadCase} />
      <div className="flex flex-col md:flex-row max-w-screen-2xl mx-auto p-4 md:p-6 gap-6">
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
             {/* Sidebar Navigation */}
            <Sidebar 
                sections={reportSections} 
                activeSectionId={activeSectionId} 
                setActiveSectionId={setActiveSectionId} 
                cases={cases}
                activeCaseId={activeCaseId}
                onSwitchCase={handleSwitchCase}
                onCreateCase={handleCreateCase}
            />
            
            {/* AI Analysis Trigger */}
            <div className="sticky top-[600px]">
                <div className="p-3 bg-slate-900/80 rounded-sm border border-slate-700">
                    <h3 className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest mb-2 font-hud">Analysis Subsystem</h3>
                    <button 
                        onClick={performFullCaseAnalysis}
                        disabled={isAnalyzing}
                        className="w-full bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 text-xs font-mono font-bold py-2 px-4 transition-all flex items-center justify-center gap-2 group"
                    >
                        {isAnalyzing ? (
                            <span className="animate-pulse">PROCESSING...</span>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-cyan-500 group-hover:animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                REGENERATE
                            </>
                        )}
                    </button>
                    <p className="text-[9px] text-gray-600 mt-2 font-mono text-center">
                        AI MODEL: GEMINI-1.5-PRO
                    </p>
                </div>
            </div>
        </div>

        <main className="flex-1 min-w-0">
          {renderMainContent()}
        </main>
      </div>
      <ChatAssistant 
        timelineData={timelineData} 
        documents={documents} 
        onNavigate={setActiveSectionId} 
      />
      <Footer />
    </div>
  );
};

export default App;
