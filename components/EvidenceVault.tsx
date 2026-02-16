import React, { useState } from 'react';
import type { TimelineMonth, Document, TimelineEvent } from '../types';
import EvidenceInput from './EvidenceInput';
import DocumentViewer from './DocumentViewer';
import ChainOfCustodyLedger from './ChainOfCustodyLedger';

interface EvidenceVaultProps {
  documents: Document[];
  timelineData: TimelineMonth[];
  onAddEvents: (events: TimelineEvent[]) => void;
  onAddDocument: (doc: Document) => void;
  onLoadContent: (docId: string) => Promise<{content?: string, mediaData?: string} | null>;
  onNavigateToEvent: (eventId: string) => void;
}

const EvidenceVault: React.FC<EvidenceVaultProps> = ({ 
    documents, 
    timelineData, 
    onAddEvents, 
    onAddDocument, 
    onLoadContent,
    onNavigateToEvent 
}) => {
    const [activeTab, setActiveTab] = useState<'view' | 'ingest' | 'ledger'>('view');
    const [targetDocId, setTargetDocId] = useState<string | undefined>(undefined);

    // Switch to view tab automatically when viewing a specific doc
    const handleViewSpecific = (docId: string) => {
        setTargetDocId(docId);
        setActiveTab('view');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Header Tabs */}
            <div className="bg-slate-950 border-b border-slate-800 px-6 pt-4 flex items-center justify-between shrink-0">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setActiveTab('view')}
                        className={`pb-3 px-2 text-sm font-bold font-mono tracking-wider transition-all border-b-2 ${
                            activeTab === 'view' ? 'text-cyan-400 border-cyan-500' : 'text-gray-500 border-transparent hover:text-white'
                        }`}
                    >
                        EVIDENCE VIEWER
                    </button>
                    <button 
                        onClick={() => setActiveTab('ingest')}
                        className={`pb-3 px-2 text-sm font-bold font-mono tracking-wider transition-all border-b-2 ${
                            activeTab === 'ingest' ? 'text-green-400 border-green-500' : 'text-gray-500 border-transparent hover:text-white'
                        }`}
                    >
                        INGEST NEW DATA
                    </button>
                    <button 
                        onClick={() => setActiveTab('ledger')}
                        className={`pb-3 px-2 text-sm font-bold font-mono tracking-wider transition-all border-b-2 ${
                            activeTab === 'ledger' ? 'text-purple-400 border-purple-500' : 'text-gray-500 border-transparent hover:text-white'
                        }`}
                    >
                        CHAIN OF CUSTODY
                    </button>
                </div>
                <div className="pb-3 text-xs font-mono text-gray-600">
                    VAULT STATUS: <span className="text-green-500">SECURE</span> | {documents.length} ITEMS
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-black relative">
                {activeTab === 'view' && (
                    <div className="h-full p-4">
                        <DocumentViewer 
                            documents={documents} 
                            targetDocId={targetDocId}
                            timelineData={timelineData}
                            onNavigateToEvent={onNavigateToEvent}
                            onLoadContent={onLoadContent}
                        />
                    </div>
                )}

                {activeTab === 'ingest' && (
                    <div className="h-full overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto">
                        <EvidenceInput 
                            onAddEvents={onAddEvents} 
                            onAddDocument={onAddDocument} 
                            documents={documents} 
                        />
                    </div>
                )}

                {activeTab === 'ledger' && (
                    <div className="h-full overflow-y-auto p-6">
                        <ChainOfCustodyLedger documents={documents} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default EvidenceVault;