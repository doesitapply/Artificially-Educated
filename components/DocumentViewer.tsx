
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Document, TimelineMonth, TimelineEvent } from '../types';

interface DocumentViewerProps {
  documents: Document[];
  targetDocId?: string;
  targetCitation?: string;
  targetAnchor?: string;
  timelineData?: TimelineMonth[];
  onNavigateToEvent?: (eventId: string) => void;
  onLoadContent?: (docId: string) => Promise<{content?: string, mediaData?: string} | null>;
}

// --- Icons & Visuals ---

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const FingerprintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 6"></path><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"></path><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"></path><path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"></path><path d="M8.65 22c.21-.66.45-1.32.57-2"></path><path d="M14 13.12c0 2.38 0 6.38-1 8.88"></path><path d="M2 16h.01"></path><path d="M21.8 16c.2-2 .131-5.354 0-6"></path><path d="M9 6.8a6 6 0 0 1 9 5.2c0 .47 0 1.17-.02 2"></path></svg>;

const AudioWaveform: React.FC<{ active: boolean }> = ({ active }) => (
    <div className="flex items-center gap-0.5 h-12 w-full justify-center px-4 overflow-hidden mask-gradient-x">
        {[...Array(60)].map((_, i) => {
            const height = Math.max(20, Math.random() * 100);
            return (
                <div 
                    key={i} 
                    className={`w-1 bg-cyan-500 rounded-full transition-all duration-75 ${active ? 'animate-pulse' : 'opacity-30'}`} 
                    style={{ 
                        height: `${active ? height : 10}%`, 
                        animationDelay: `${i * 0.05}s`,
                        opacity: active ? 1 - Math.abs(30 - i) / 30 : 0.3
                    }}
                ></div>
            );
        })}
    </div>
);

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  documents, 
  targetDocId, 
  targetCitation, 
  targetAnchor,
  timelineData, 
  onNavigateToEvent,
  onLoadContent 
}) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [docMediaData, setDocMediaData] = useState<string | undefined>(undefined);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'MEDIA' | 'TEXT'>('ALL');
  
  const scrollTargetRef = useRef<HTMLElement | null>(null);
  const mediaRef = useRef<HTMLMediaElement>(null);

  // Sync external navigation to internal state
  useEffect(() => {
    if (targetDocId) {
        const found = documents.find(d => d.id === targetDocId || d.title === targetDocId);
        if (found) setSelectedDoc(found);
    } else if (!selectedDoc && documents.length > 0) {
        setSelectedDoc(documents[0]);
    }
  }, [targetDocId, documents]);

  // JIT Loading Logic
  useEffect(() => {
      const loadContent = async () => {
          if (!selectedDoc) return;
          
          setIsLoadingContent(true);
          
          // Check if we already have content in the object (pre-loaded or small file)
          if (selectedDoc.content || selectedDoc.mediaData) {
              setDocContent(selectedDoc.content || '');
              setDocMediaData(selectedDoc.mediaData);
              setIsLoadingContent(false);
              return;
          }

          // If not, fetch from Blob store
          if (onLoadContent) {
              const data = await onLoadContent(selectedDoc.id);
              if (data) {
                  setDocContent(data.content || '');
                  setDocMediaData(data.mediaData);
              } else {
                  setDocContent('[ERROR: CONTENT NOT FOUND IN ARCHIVE]');
                  setDocMediaData(undefined);
              }
          }
          setIsLoadingContent(false);
      };

      loadContent();
  }, [selectedDoc, onLoadContent]);

  // Filtering Logic
  const filteredDocuments = useMemo(() => {
      return documents.filter(doc => {
          const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                doc.batesNumber?.toLowerCase().includes(searchQuery.toLowerCase());
          const matchesType = typeFilter === 'ALL' 
              ? true 
              : typeFilter === 'MEDIA' 
                  ? doc.mediaType === 'audio' || doc.mediaType === 'video'
                  : doc.mediaType !== 'audio' && doc.mediaType !== 'video';
          return matchesSearch && matchesType;
      });
  }, [documents, searchQuery, typeFilter]);

  // Linked Events Logic
  const linkedEvents = useMemo(() => {
      if (!selectedDoc || !timelineData) return [];
      return timelineData.flatMap(m => m.events).filter(e => e.sourceId === selectedDoc.id);
  }, [selectedDoc, timelineData]);

  // Handling Scroll & Seek
  useEffect(() => {
      if (!selectedDoc || isLoadingContent) return;

      // 1. Media Seek
      if (targetCitation && (selectedDoc.mediaType === 'audio' || selectedDoc.mediaType === 'video') && mediaRef.current) {
          const parts = targetCitation.split(':').map(Number);
          let seconds = 0;
          if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
          if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
          
          if (!isNaN(seconds)) {
              mediaRef.current.currentTime = seconds;
              mediaRef.current.play();
          }
      } 
      // 2. Text Scroll
      else if (targetCitation && scrollTargetRef.current) {
          setTimeout(() => {
              scrollTargetRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 300);
      }
  }, [targetCitation, selectedDoc, isLoadingContent]);

  const getTypeIcon = (type?: string) => {
      switch(type) {
          case 'audio': return <span className="text-red-400">AUDIO</span>;
          case 'video': return <span className="text-red-400">VIDEO</span>;
          case 'image': return <span className="text-yellow-400">IMG</span>;
          default: return <span className="text-cyan-400">DOC</span>;
      }
  };

  const renderContent = () => {
      if (!selectedDoc) return null;
      if (isLoadingContent) return <div className="text-cyan-500 animate-pulse font-mono">DECRYPTING ARCHIVE PAYLOAD...</div>;

      const lines = docContent.split('\n');
      return lines.map((line, idx) => {
          // Check for highlighting
          const relevantEvent = linkedEvents.find(e => e.sourceCitation && line.includes(e.sourceCitation));
          const isTarget = targetCitation && relevantEvent?.sourceCitation === targetCitation;

          if (relevantEvent && relevantEvent.sourceCitation) {
              const parts = line.split(relevantEvent.sourceCitation);
              return (
                  <div key={idx} className={`font-mono text-sm mb-1 leading-relaxed ${isTarget ? 'bg-cyan-950/50 border-l-2 border-cyan-400 pl-2' : ''}`}>
                      <span className="text-gray-400">{parts[0]}</span>
                      <span 
                        ref={isTarget ? scrollTargetRef : null}
                        className={`cursor-pointer transition-all duration-300 rounded px-1 ${
                            isTarget 
                            ? 'bg-cyan-500 text-black font-bold shadow-[0_0_15px_cyan]' 
                            : 'bg-cyan-900/40 text-cyan-300 hover:bg-cyan-800'
                        }`}
                        onClick={() => onNavigateToEvent && onNavigateToEvent(relevantEvent.id)}
                        title={`Linked Event: ${relevantEvent.title}`}
                      >
                          {relevantEvent.sourceCitation}
                      </span>
                      <span className="text-gray-400">{parts[1]}</span>
                  </div>
              );
          }

          // Default line rendering with key-value detection
          const keyVal = line.match(/^([A-Z][a-zA-Z\s]+):(.*)/);
          if (keyVal) {
              return (
                  <div key={idx} className="font-mono text-sm mb-1">
                      <span className="text-cyan-600 font-bold uppercase tracking-wider text-[10px] mr-2">{keyVal[1]}:</span>
                      <span className="text-gray-300">{keyVal[2]}</span>
                  </div>
              );
          }

          return <div key={idx} className="font-mono text-sm text-gray-400 mb-1 min-h-[1em] whitespace-pre-wrap">{line}</div>;
      });
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-0 border border-slate-800 bg-slate-950 rounded-lg overflow-hidden animate-fade-in shadow-2xl">
        
        {/* LEFT PANE: CONTROLLER */}
        <aside className="w-80 bg-slate-900/50 border-r border-slate-800 flex flex-col z-10 backdrop-blur-sm">
            {/* Control Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900">
                <h2 className="text-sm font-hud text-cyan-500 tracking-widest uppercase mb-4 flex items-center gap-2">
                    <FingerprintIcon className="w-4 h-4" />
                    Evidence Locker
                </h2>
                
                {/* Search */}
                <div className="relative mb-3 group">
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="SEARCH BATES / TITLE..."
                        className="w-full bg-black border border-slate-700 text-cyan-100 text-xs font-mono p-2 pl-8 rounded-sm focus:border-cyan-500 outline-none transition-colors"
                    />
                    <SearchIcon className="absolute left-2 top-2 w-4 h-4 text-slate-600 group-focus-within:text-cyan-500" />
                </div>

                {/* Filters */}
                <div className="flex gap-1 bg-black p-1 rounded-sm border border-slate-800">
                    {['ALL', 'TEXT', 'MEDIA'].map(type => (
                        <button
                            key={type}
                            onClick={() => setTypeFilter(type as any)}
                            className={`flex-1 py-1 text-[10px] font-bold font-mono text-center rounded-sm transition-all ${
                                typeFilter === type 
                                ? 'bg-cyan-900 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                                : 'text-slate-600 hover:text-slate-400'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {/* Document List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredDocuments.map(doc => (
                    <button
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={`w-full text-left p-3 border-b border-slate-800/50 transition-all hover:bg-slate-800/50 group relative ${
                            selectedDoc?.id === doc.id ? 'bg-cyan-950/20 border-l-2 border-l-cyan-500' : 'border-l-2 border-l-transparent'
                        }`}
                    >
                        {selectedDoc?.id === doc.id && (
                            <div className="absolute inset-0 bg-gradient-to-r from-cyan-900/10 to-transparent pointer-events-none"></div>
                        )}
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-[10px] font-mono border px-1 rounded-sm ${
                                selectedDoc?.id === doc.id ? 'border-cyan-600 text-cyan-400' : 'border-slate-700 text-slate-500'
                            }`}>
                                {doc.batesNumber || 'NO-ID'}
                            </span>
                            <div className="text-[9px] font-bold">
                                {getTypeIcon(doc.mediaType)}
                            </div>
                        </div>
                        <div className={`text-xs font-bold truncate mb-1 ${
                            selectedDoc?.id === doc.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                        }`}>
                            {doc.title}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono">
                            <span>{doc.date || 'DATE UNKNOWN'}</span>
                            {doc.reliabilityScore && doc.reliabilityScore < 100 && (
                                <span className="text-amber-600">⚠ FLAGS</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>
            
            <div className="p-2 border-t border-slate-800 bg-slate-900 text-center">
                <span className="text-[10px] text-slate-500 font-mono tracking-widest">
                    {filteredDocuments.length} RECORDS SECURED
                </span>
            </div>
        </aside>

        {/* RIGHT PANE: VIEWER */}
        <main className="flex-1 flex flex-col bg-black/50 relative">
            {selectedDoc ? (
                <>
                    {/* GOD'S EYE HEADER */}
                    <header className="bg-slate-950 border-b border-cyan-900/30 p-4 shadow-lg z-20">
                        <div className="flex justify-between items-start">
                            <div>
                                <h1 className="text-xl font-hud font-bold text-white tracking-wide mb-1 flex items-center gap-3">
                                    {selectedDoc.title}
                                    {(selectedDoc.mediaType === 'audio' || selectedDoc.mediaType === 'video') && (
                                        <span className="px-2 py-0.5 bg-red-950 border border-red-600 text-red-500 text-[10px] animate-pulse">
                                            LIVE EVIDENCE
                                        </span>
                                    )}
                                </h1>
                                <div className="flex gap-4 text-[10px] font-mono text-cyan-600">
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                                        SHA-256: {selectedDoc.hash ? selectedDoc.hash.substring(0, 16) + '...' : 'CALCULATING...'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></span>
                                        CHAIN OF CUSTODY: VALID
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                        RELIABILITY: {selectedDoc.reliabilityScore}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-hud text-cyan-500 font-black tracking-tighter opacity-80">
                                    {selectedDoc.batesNumber || 'UNINDEXED'}
                                </div>
                                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">
                                    Official Record ID
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* NEURAL LINK BAR */}
                    {linkedEvents.length > 0 && (
                        <div className="bg-cyan-950/20 border-b border-cyan-900/30 px-4 py-2 flex items-center gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
                            <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-widest flex items-center gap-2">
                                <LinkIcon className="w-3 h-3" /> Linked Events:
                            </span>
                            {linkedEvents.map(ev => (
                                <button
                                    key={ev.id}
                                    onClick={() => onNavigateToEvent && onNavigateToEvent(ev.id)}
                                    className="px-3 py-1 bg-black border border-cyan-800 rounded-full text-[10px] text-cyan-400 hover:bg-cyan-900 hover:text-white transition-colors flex items-center gap-2 group"
                                >
                                    <span className="w-1 h-1 bg-cyan-500 rounded-full group-hover:animate-ping"></span>
                                    {ev.date}: {ev.title}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* SENTIENT MEDIA PLAYER */}
                    {(selectedDoc.mediaType === 'audio' || selectedDoc.mediaType === 'video') && docMediaData && (
                        <div className="bg-black border-b border-slate-800 relative group">
                            {selectedDoc.mediaType === 'video' ? (
                                <div className="relative aspect-video max-h-64 mx-auto bg-black flex items-center justify-center">
                                    <video 
                                        ref={mediaRef as React.RefObject<HTMLVideoElement>} 
                                        controls 
                                        className="h-full w-full object-contain" 
                                        src={docMediaData}
                                    />
                                </div>
                            ) : (
                                <div className="p-6">
                                    <AudioWaveform active={true} />
                                    <audio 
                                        ref={mediaRef} 
                                        controls 
                                        className="w-full mt-4 h-8 opacity-50 hover:opacity-100 transition-opacity" 
                                        src={docMediaData} 
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* CONTENT VIEWER */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-950 relative">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
                        
                        <div className="max-w-4xl mx-auto bg-slate-900/50 p-8 border border-slate-800 shadow-2xl min-h-full">
                            {renderContent()}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600 gap-4">
                    <div className="w-20 h-20 rounded-full border-2 border-slate-800 flex items-center justify-center animate-pulse">
                        <FingerprintIcon className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-hud text-slate-500 tracking-widest">SECURE VAULT LOCKED</h3>
                        <p className="text-xs font-mono mt-2">Select an evidence item to decrypt.</p>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};

export default DocumentViewer;
