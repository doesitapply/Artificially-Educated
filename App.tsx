
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { reportSections as initialSections, timelineData as initialTimelineData } from './constants';
import { documents as initialDocuments } from '../public/documents';
import type { ReportSection, TimelineMonth, Document, TimelineEvent } from './types';
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

const App: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('timeline');
  const [isPrinting, setIsPrinting] = useState(false);
  
  // Dynamic State
  const [timelineData, setTimelineData] = useState<TimelineMonth[]>(initialTimelineData);
  const [documents, setDocuments] = useState<Document[]>(
    initialDocuments.map((doc, idx) => ({ ...doc, batesNumber: `DEF-${String(idx + 1).padStart(3, '0')}` }))
  );
  
  // Navigation & Highlighting State
  const [targetDocId, setTargetDocId] = useState<string | undefined>(undefined);
  const [targetCitation, setTargetCitation] = useState<string | undefined>(undefined);
  const [highlightedEventId, setHighlightedEventId] = useState<string | undefined>(undefined);
  
  // Smart Sections State
  const [reportSections, setReportSections] = useState<ReportSection[]>(initialSections);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const activeSection = reportSections.find(s => s.id === activeSectionId) || reportSections[0];

  // Initialize Gemini for global analysis
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const handleAddEvents = (newEvents: TimelineEvent[]) => {
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

  const handleAddDocument = (doc: Document) => {
    const newDoc = {
      ...doc,
      batesNumber: `DEF-${String(documents.length + 1).padStart(3, '0')}`
    };
    setDocuments([...documents, newDoc]);
  };

  // Navigate from Timeline -> Document
  const handleViewDocument = (docId: string, citation?: string) => {
      setTargetDocId(docId);
      setTargetCitation(citation);
      setActiveSectionId('documents');
  };

  // Navigate from Document -> Timeline
  const handleNavigateToEvent = (eventId: string) => {
      setHighlightedEventId(eventId);
      setActiveSectionId('timeline');
      // Timeout to allow render before clearing, though logic in TimelineItem handles the scroll
      setTimeout(() => setHighlightedEventId(undefined), 3000);
  };

  const performFullCaseAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const flatEvents = timelineData.flatMap(m => m.events);
      const prompt = `
        You are the lead defense strategist for State v. Church.
        Based on the updated timeline below, regenerate the Executive Summary, Conclusion, and Systemic Violations sections.
        
        TIMELINE DATA:
        ${JSON.stringify(flatEvents.map(e => ({ date: e.date, title: e.title, claim: e.claim, cause: e.cause, effect: e.effect })))}
        
        REQUIREMENTS:
        1. **Executive Summary**: Synthesize the new timeline into a compelling narrative of systemic failure.
        2. **Systemic Violations**: Identify patterns (e.g. "RICO", "Monell", "Conspiracy") supported by the new evidence.
        3. **Conclusion & Remedies**: List specific next steps for the court and lawyers. Cite specific remedies (e.g. "Writ of Mandamus", "Motion for Sanctions").
        
        Return JSON with keys: "summary", "systemic", "conclusion". Content should be formatted in Markdown.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
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

  const renderMainContent = () => {
    switch (activeSectionId) {
      case 'timeline':
        return (
            <Timeline 
                data={timelineData} 
                onViewDocument={handleViewDocument} 
                highlightedEventId={highlightedEventId}
            />
        );
      case 'documents':
        return (
            <DocumentViewer 
                documents={documents} 
                targetDocId={targetDocId} 
                targetCitation={targetCitation}
                timelineData={timelineData}
                onNavigateToEvent={handleNavigateToEvent}
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
        return <DraftingLab timelineData={timelineData} documents={documents} />;
      case 'pattern-analysis':
        return <PatternAnalysis timelineData={timelineData} />;
      default:
        return <SectionContent section={activeSection} />;
    }
  };

  const handleExport = () => {
    setIsPrinting(true);
  };

  useEffect(() => {
    if (isPrinting) {
      const handleAfterPrint = () => {
        setIsPrinting(false);
        window.removeEventListener('afterprint', handleAfterPrint);
      };
      window.addEventListener('afterprint', handleAfterPrint);
      window.print();
    }
  }, [isPrinting]);

  if (isPrinting) {
    return <PrintableReport 
      sections={reportSections} 
      timelineData={timelineData} 
      documents={documents} 
    />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300" id="app-container">
      <Header onExport={handleExport} />
      <div className="flex flex-col md:flex-row max-w-screen-2xl mx-auto p-4 md:p-8 gap-8">
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
             {/* Sidebar Navigation */}
            <Sidebar 
                sections={reportSections} 
                activeSectionId={activeSectionId} 
                setActiveSectionId={setActiveSectionId} 
            />
            
            {/* AI Analysis Trigger */}
            <div className="sticky top-[450px]">
                <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Forensic AI</h3>
                    <button 
                        onClick={performFullCaseAnalysis}
                        disabled={isAnalyzing}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <span className="animate-pulse">Analyzing Case...</span>
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                Regenerate Analysis
                            </>
                        )}
                    </button>
                    <p className="text-[10px] text-gray-500 mt-2">
                        Updates Summary, Systemic Analysis, and Conclusion based on current timeline.
                    </p>
                </div>
            </div>
        </div>

        <main className="flex-1 min-w-0">
          {renderMainContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default App;
