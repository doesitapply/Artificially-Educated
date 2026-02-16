
import React, { useState, useMemo } from 'react';
import type { TimelineMonth, Document } from '../types';

interface GlobalSearchProps {
  timelineData: TimelineMonth[];
  documents: Document[];
  onNavigateToEvent: (eventId: string) => void;
  onViewDocument: (docId: string) => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ timelineData, documents, onNavigateToEvent, onViewDocument }) => {
    const [query, setQuery] = useState('');

    const results = useMemo(() => {
        if (!query.trim() || query.length < 2) return { events: [], docs: [] };
        
        const q = query.toLowerCase();

        // Search Events with safe access
        const events = timelineData.flatMap(m => m.events).filter(e => 
            (e.title || '').toLowerCase().includes(q) || 
            (e.cause || '').toLowerCase().includes(q) || 
            (e.effect || '').toLowerCase().includes(q) ||
            (e.claim || '').toLowerCase().includes(q)
        );

        // Search Docs with safe access
        const docs = documents.filter(d => 
            (d.title || '').toLowerCase().includes(q) || 
            (d.content && d.content.toLowerCase().includes(q)) ||
            (d.batesNumber || '').toLowerCase().includes(q)
        );

        return { events, docs };
    }, [query, timelineData, documents]);

    return (
        <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)] flex flex-col">
             <div className="mb-6 border-b border-gray-600 pb-4">
                 <h2 className="text-3xl font-bold font-serif text-gray-100">Global Search</h2>
                 <p className="text-gray-400 mt-2">Deep search across Timeline, Documents, and Legal Claims.</p>
            </div>

            <div className="relative mb-8">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search keywords (e.g. 'competency', 'Breslow', 'motion')..."
                    className="w-full bg-gray-900 border border-gray-600 text-white p-4 pl-12 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg"
                    autoFocus
                />
                <svg className="w-6 h-6 text-gray-500 absolute left-4 top-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div>
                    <h3 className="text-yellow-400 font-bold mb-4 flex justify-between">
                        Timeline Events 
                        <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded">{results.events.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {results.events.map(ev => (
                            <div 
                                key={ev.id} 
                                onClick={() => onNavigateToEvent(ev.id)}
                                className="bg-gray-900 border border-gray-700 p-3 rounded cursor-pointer hover:border-yellow-500 transition-colors"
                            >
                                <div className="text-xs text-gray-500 mb-1">{ev.date}</div>
                                <div className="font-bold text-gray-200 text-sm mb-1">{ev.title}</div>
                                <div className="text-xs text-gray-400 line-clamp-2">{ev.cause}</div>
                            </div>
                        ))}
                        {results.events.length === 0 && query && <p className="text-gray-500 text-sm italic">No matching events.</p>}
                    </div>
                </div>

                <div>
                    <h3 className="text-blue-400 font-bold mb-4 flex justify-between">
                        Documents 
                        <span className="text-xs bg-gray-700 text-white px-2 py-1 rounded">{results.docs.length}</span>
                    </h3>
                    <div className="space-y-3">
                         {results.docs.map(doc => (
                            <div 
                                key={doc.id} 
                                onClick={() => onViewDocument(doc.id)}
                                className="bg-gray-900 border border-gray-700 p-3 rounded cursor-pointer hover:border-blue-500 transition-colors"
                            >
                                <div className="flex justify-between mb-1">
                                     <div className="font-bold text-gray-200 text-sm">{doc.title}</div>
                                     <div className="text-[10px] font-mono bg-black px-1 rounded text-gray-400 border border-gray-800">{doc.batesNumber}</div>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">{(doc.mediaType || 'TEXT').toUpperCase()}</div>
                                <div className="text-xs text-gray-400 italic bg-gray-800 p-2 rounded">
                                    "...{doc.content ? (doc.content.toLowerCase().split(query.toLowerCase())[1]?.slice(0, 80) || doc.content.slice(0, 80)) : 'Content not loaded'}..."
                                </div>
                            </div>
                        ))}
                         {results.docs.length === 0 && query && <p className="text-gray-500 text-sm italic">No matching documents.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearch;
