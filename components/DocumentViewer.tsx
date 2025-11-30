
import React, { useState, useEffect, useRef } from 'react';
import type { Document, TimelineMonth } from '../types';

interface DocumentViewerProps {
  documents: Document[];
  targetDocId?: string;
  targetCitation?: string;
  timelineData?: TimelineMonth[];
  onNavigateToEvent?: (eventId: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documents, 
  targetDocId, 
  targetCitation, 
  timelineData, 
  onNavigateToEvent 
}) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(documents[0] || null);
  const scrollTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (targetDocId) {
        const found = documents.find(d => d.id === targetDocId || d.title === targetDocId);
        if (found) setSelectedDoc(found);
    }
  }, [targetDocId, documents]);

  // Scroll to citation if present
  useEffect(() => {
      if (targetCitation && selectedDoc && scrollTargetRef.current) {
          setTimeout(() => {
              scrollTargetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
      }
  }, [targetCitation, selectedDoc]);

  // Render text with interactive highlights
  const renderInteractiveContent = (content: string) => {
    // 1. Find all events linked to this document
    const linkedEvents = timelineData?.flatMap(m => m.events).filter(e => e.sourceId === selectedDoc?.id) || [];
    
    // 2. Split content by newlines to preserve basic formatting
    return content.split('\n').map((line, lineIndex) => {
      const trimmedLine = line.trim();
      
      // Handle meta tags
      if (trimmedLine.startsWith('== START OF OCR') || trimmedLine.startsWith('== END OF OCR')) {
        return <span key={lineIndex} className="block text-gray-500 italic mb-1">{line}</span>;
      }
      
      // Handle Key: Value pairs
      const parts = line.split(/:(.*)/s);
      if (parts.length > 1 && parts[0].length > 0 && parts[0].length < 50 && !parts[0].includes('http')) { 
         // For Key-Value lines, we just return them, complicated to highlight inside them cleanly without regex parsing
         // But we can check the Value part
         return (
            <span key={lineIndex} className="block">
                <span className="text-yellow-400 font-semibold">{parts[0]}:</span>
                <span>{parts[1]}</span>
            </span>
         );
      }

      // 3. Highlight logic for standard lines
      // We look for any extracted citation contained in this line
      let lineContent: React.ReactNode = line;
      
      linkedEvents.forEach(event => {
          if (event.sourceCitation && line.includes(event.sourceCitation)) {
              const citation = event.sourceCitation;
              const isTarget = targetCitation === citation;
              
              const segments = line.split(citation);
              if (segments.length > 1) {
                  lineContent = (
                      <>
                        {segments[0]}
                        <mark 
                            ref={isTarget ? scrollTargetRef : null}
                            onClick={() => onNavigateToEvent && onNavigateToEvent(event.id)}
                            className={`cursor-pointer rounded px-1 text-black font-semibold transition-all duration-500 ${isTarget ? 'bg-yellow-400 ring-4 ring-yellow-500/50 z-10 relative' : 'bg-yellow-200 hover:bg-yellow-400'}`}
                            title={`Jump to Event: ${event.title}`}
                        >
                            {citation}
                        </mark>
                        {segments[1]}
                      </>
                  );
              }
          }
      });

      return <span key={lineIndex} className="block min-h-[1.2em]">{lineContent}</span>;
    });
  };


  return (
    <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-140px)]">
      <aside className="w-full md:w-1/3 lg:w-1/4 flex flex-col min-h-0">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 flex flex-col h-full">
          <h3 className="text-xl font-serif font-bold text-yellow-400 mb-4 shrink-0">Documents</h3>
          <ul className="space-y-2 overflow-y-auto pr-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 ${
                    selectedDoc?.id === doc.id
                      ? 'bg-yellow-500/10 text-yellow-400 font-semibold border-l-2 border-yellow-400'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                  aria-current={selectedDoc?.id === doc.id}
                >
                  <div className="flex justify-between w-full">
                    <span className="truncate pr-2">{doc.title}</span>
                    {doc.batesNumber && <span className="text-xs font-mono text-gray-500">{doc.batesNumber}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      
      <div className="flex-1 min-h-0 flex flex-col">
        {selectedDoc ? (
          <div className="bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col h-full">
            <div className="flex justify-between items-start p-6 border-b border-gray-700 bg-gray-900/50 rounded-t-lg shrink-0">
              <div>
                  <h2 className="text-2xl font-bold font-serif text-gray-100" id="document-title">{selectedDoc.title}</h2>
                  {/* Chain of Custody Badge */}
                  <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500 font-mono">
                     {selectedDoc.hash && (
                         <span title={selectedDoc.hash} className="flex items-center gap-1">
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                             SHA-256 Verified
                         </span>
                     )}
                     {selectedDoc.addedAt && (
                         <span>Ingested: {new Date(selectedDoc.addedAt).toLocaleString()}</span>
                     )}
                  </div>
              </div>
              
              {selectedDoc.batesNumber && (
                <span className="px-3 py-1 bg-black border border-gray-600 rounded text-sm font-mono text-yellow-500 shadow-inner">
                  {selectedDoc.batesNumber}
                </span>
              )}
            </div>
            
            <div className="bg-gray-900 p-8 text-gray-300 font-mono text-xs leading-relaxed overflow-y-auto flex-1 relative">
              <div className="max-w-3xl mx-auto" aria-labelledby="document-title">
                  {renderInteractiveContent(selectedDoc.content)}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 h-full flex items-center justify-center">
            <p className="text-gray-400">Select a document to view its forensic content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
