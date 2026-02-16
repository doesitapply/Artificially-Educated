import React, { useState, useEffect } from 'react';
import { Type } from "@google/genai";
import { reportSections as initialSections, timelineData as initialTimelineData } from './constants';
import { documents as initialDocuments } from '../public/documents';
import type { ReportSection, TimelineMonth, Document, TimelineEvent, CaseMetadata, Conflict } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Timeline from './components/Timeline';
import SectionContent from './components/SectionContent';
import Footer from './components/Footer';
import PrintableReport from './components/PrintableReport';
import DraftingLab from './components/DraftingLab';
import ChatAssistant from './components/ChatAssistant';
import Dashboard from './components/Dashboard';
import AnalysisHub from './components/AnalysisHub';
import EvidenceVault from './components/EvidenceVault';
import { db } from './db';
import { MASTER_SYSTEM_PROMPT } from './ai-config';
import { aiClient } from '../ai-client';

const DEMO_CASE_ID = '3:24-cv-00579';

const App: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('dashboard');
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Persistent State
  const [cases, setCases] = useState<CaseMetadata[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>(() => {
      return localStorage.getItem('manus_active_case_id') || '';
  });
  
  // Dynamic State
  const [timelineData, setTimelineData] = useState<TimelineMonth[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [caseFilter, setCaseFilter] = useState<string>('All');
  
  // Targeting System State
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [preselectedTemplateId, setPreselectedTemplateId] = useState<string | null>(null);

  // Navigation State
  const [highlightedEventId, setHighlightedEventId] = useState<string | undefined>(undefined);
  
  // Smart Sections State
  const [reportSections, setReportSections] = useState<ReportSection[]>(initialSections);
  const [isDbReady, setIsDbReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
      if (activeCaseId) {
          localStorage.setItem('manus_active_case_id', activeCaseId);
      }
  }, [activeCaseId]);

  // --- DB Initialization & Loading ---
  useEffect(() => {
    const initPersistence = async () => {
        try {
            await db.init();
            
            const loadedCases = await db.getAllCases();
            setCases(loadedCases);
            
            setIsDbReady(true);

            if (activeCaseId) {
                loadCaseData(activeCaseId);
            } else if (loadedCases.length > 0) {
                setActiveCaseId(loadedCases[0].id);
                loadCaseData(loadedCases[0].id);
            }
        } catch (e) {
            console.error("DB Init Failed:", e);
        }
    };
    initPersistence();
  }, []);

  const loadCaseData = async (caseId: string) => {
      if (!db) return;
      try {
          const events = await db.getEventsByCase(caseId);
          
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

          setTimelineData(newTimelineData);

          const docs = await db.getDocumentsByCase(caseId);
          setDocuments(docs);
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

  const handleLoadDemo = async () => {
      if (!confirm("Load Demo Data? This creates the 'Church v. Breslow' workspace.")) return;
      
      const demoCase = {
        id: DEMO_CASE_ID,
        name: 'DEMO: Church v. Breslow',
        description: 'Federal Civil Rights Action',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      await db.saveCase(demoCase);
      
      const seedDocs = initialDocuments.map((doc, idx) => ({ 
        ...doc, 
        batesNumber: `DEF-${String(idx + 1).padStart(3, '0')}`,
        reliabilityScore: 100,
        caseId: DEMO_CASE_ID
      }));
      for (const doc of seedDocs) await db.saveDocument(doc);

      const flatEvents = initialTimelineData.flatMap(m => m.events);
      for (const ev of flatEvents) await db.saveEvent({ ...ev, caseId: DEMO_CASE_ID });

      setCases(prev => [...prev.filter(c => c.id !== DEMO_CASE_ID), demoCase]);
      handleSwitchCase(DEMO_CASE_ID);
  };

  const handleSwitchCase = async (caseId: string) => {
      setActiveCaseId(caseId);
      setTimelineData([]); 
      setDocuments([]); 
      setSelectedEventIds(new Set()); 
      await loadCaseData(caseId);
      setActiveSectionId('dashboard');
  };

  const handleAddEvents = async (newEvents: TimelineEvent[]) => {
    if (!activeCaseId) {
        alert("Please create or select a case first.");
        return;
    }
    for (const ev of newEvents) {
        await db.saveEvent({ ...ev, caseId: activeCaseId });
    }
    await loadCaseData(activeCaseId);
    setActiveSectionId('timeline');
  };

  const handleAddDocument = async (doc: Document) => {
    if (!activeCaseId) {
        alert("Please create or select a case first.");
        return;
    }
    const newDoc = {
      ...doc,
      batesNumber: `DEF-${String(documents.length + 1).padStart(3, '0')}`,
      reliabilityScore: 100,
      caseId: activeCaseId
    };
    await db.saveDocument(newDoc);
    const docs = await db.getDocumentsByCase(activeCaseId);
    setDocuments(docs);
  };

  const handleFetchDocumentContent = async (id: string) => {
      return await db.getDocumentContent(id);
  };

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

  const handleNavigateToEvent = (eventId: string) => {
      setHighlightedEventId(eventId);
      setActiveSectionId('timeline');
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
      case 'dashboard':
        return (
            <Dashboard 
                timelineData={timelineData}
                documents={documents}
                onNavigate={setActiveSectionId}
                onCreateCase={handleCreateCase}
                caseName={cases.find(c => c.id === activeCaseId)?.name || ''}
            />
        );
      case 'timeline':
        return (
            <Timeline 
                data={timelineData} 
                onViewDocument={(id) => { console.log('Nav to doc', id); setActiveSectionId('evidence'); }} // Simplified handling
                highlightedEventId={highlightedEventId}
                caseFilter={caseFilter}
                setCaseFilter={setCaseFilter}
                selectedEventIds={selectedEventIds}
                onToggleEventSelection={toggleEventSelection}
            />
        );
      case 'evidence':
        return (
            <EvidenceVault 
                documents={documents} 
                timelineData={timelineData}
                onAddEvents={handleAddEvents} 
                onAddDocument={handleAddDocument} 
                onLoadContent={handleFetchDocumentContent}
                onNavigateToEvent={handleNavigateToEvent}
            />
        );
      case 'analysis':
        return <AnalysisHub timelineData={timelineData} />;
      case 'drafting':
        return (
            <DraftingLab 
                timelineData={timelineData} 
                documents={documents} 
                selectedEventIds={selectedEventIds}
                onClearSelection={clearEventSelection}
                initialTemplateId={preselectedTemplateId}
            />
        );
      default:
        // Fallback for any legacy section IDs that might still exist in sidebar
        const activeSection = reportSections.find(s => s.id === activeSectionId);
        if (activeSection) {
            return <SectionContent section={activeSection} />;
        }
        return <Dashboard timelineData={timelineData} documents={documents} onNavigate={setActiveSectionId} onCreateCase={handleCreateCase} caseName={cases.find(c => c.id === activeCaseId)?.name || ''} />;
    }
  };

  const handleExportPDF = () => setIsPrinting(true);

  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => setIsPrinting(false);
      window.addEventListener('afterprint', handleAfterPrint);
      setTimeout(() => window.print(), 500);
      return () => window.removeEventListener('afterprint', handleAfterPrint);
    }
  }, [isPrinting]);

  if (isPrinting) return <PrintableReport sections={reportSections} timelineData={timelineData} documents={documents} />;

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
            <Sidebar 
                sections={reportSections} 
                activeSectionId={activeSectionId} 
                setActiveSectionId={setActiveSectionId} 
                cases={cases}
                activeCaseId={activeCaseId}
                onSwitchCase={handleSwitchCase}
                onCreateCase={handleCreateCase}
            />
            {cases.length === 0 && (
                <button onClick={handleLoadDemo} className="w-full bg-slate-900 text-xs text-gray-500 p-2 border border-dashed border-gray-700 hover:text-white hover:border-gray-500 mt-4">
                    LOAD DEMO DATA
                </button>
            )}
            
            <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-full bg-slate-900 border border-slate-700 p-2 text-xs font-mono text-gray-500 hover:text-white transition-colors uppercase tracking-widest mt-auto"
            >
                {showSettings ? 'Hide Config' : 'Configure AI'}
            </button>
            
            {showSettings && (
                <div className="p-3 bg-slate-900 border border-slate-700 rounded text-xs animate-fade-in">
                    <label className="block mb-1 text-cyan-500 font-bold">OpenAI Fallback Key</label>
                    <input 
                        type="password" 
                        placeholder="sk-..." 
                        className="w-full bg-black border border-slate-600 rounded p-1 text-white mb-2"
                        onChange={(e) => aiClient.setCredentials(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => aiClient.setCredentials(undefined, 'gemini')}
                            className={`flex-1 py-1 rounded border ${aiClient.getProvider() === 'gemini' ? 'bg-cyan-900 border-cyan-500 text-white' : 'border-gray-600 text-gray-500'}`}
                        >Gemini</button>
                        <button 
                            onClick={() => aiClient.setCredentials(undefined, 'openai')}
                            className={`flex-1 py-1 rounded border ${aiClient.getProvider() === 'openai' ? 'bg-green-900 border-green-500 text-white' : 'border-gray-600 text-gray-500'}`}
                        >OpenAI</button>
                    </div>
                </div>
            )}
        </div>
        <main className="flex-1 min-w-0">
          {activeCaseId ? renderMainContent() : (
              <div className="flex flex-col items-center justify-center h-full space-y-4 min-h-[50vh]">
                  <div className="text-4xl text-slate-700 font-hud opacity-50">NO CASE LOADED</div>
                  <p className="text-slate-500">Select a case or initialize a new workspace.</p>
                  <button onClick={handleCreateCase} className="bg-cyan-600 text-black px-6 py-2 rounded font-bold hover:bg-cyan-500">CREATE NEW CASE</button>
              </div>
          )}
        </main>
      </div>
      <ChatAssistant timelineData={timelineData} documents={documents} onNavigate={setActiveSectionId} />
      <Footer />
    </div>
  );
};

export default App;