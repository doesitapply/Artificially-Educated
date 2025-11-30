
import React, { useState, useRef } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { TimelineEvent, Document } from '../types';

interface EvidenceInputProps {
  onAddEvents: (events: TimelineEvent[]) => void;
  onAddDocument: (doc: Document) => void;
  documents: Document[];
}

interface DocIdentity {
    title: string;
    date: string;
    type: string;
    isDuplicate: boolean;
    duplicateOf?: string;
    summary: string;
}

const EvidenceInput: React.FC<EvidenceInputProps> = ({ onAddEvents, onAddDocument, documents }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [parsedDrafts, setParsedDrafts] = useState<TimelineEvent[]>([]);
  const [mode, setMode] = useState<'input' | 'review'>('input');
  
  // State for duplicate summary instead of blocking modal
  const [duplicateSummary, setDuplicateSummary] = useState<Array<{filename: string, match: string}>>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Gemini
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // SHA-256 Hash for Chain of Custody
  const computeHash = async (base64: string): Promise<string> => {
      const msgBuffer = new TextEncoder().encode(base64);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
  };

  const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove Data URL prefix to get raw base64
        resolve((result.split(',')[1]));
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setDuplicateSummary([]); // Clear previous summary
    const newDrafts: TimelineEvent[] = [];
    const duplicatesFound: Array<{filename: string, match: string}> = [];
    const currentBatchHashes = new Set<number>();
    const currentBatchTitles = new Set<string>();

    // Process files sequentially to maintain order and update UI
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setStatusMessage(`Forensics: Analyzing file ${i + 1} of ${files.length}: ${file.name}...`);
        
        try {
            const base64Data = await readFileAsBase64(file);
            const newDocHash = simpleHash(base64Data);
            const sha256 = await computeHash(base64Data);

            // 1. Strict Hash Check (Global & Batch)
            const globalExactMatch = documents.find(d => simpleHash(d.content) === newDocHash);
            const batchExactMatch = currentBatchHashes.has(newDocHash);

            if (globalExactMatch || batchExactMatch) {
                duplicatesFound.push({
                    filename: file.name,
                    match: globalExactMatch?.title || "Duplicate in current batch"
                });
                continue; // Skip processing
            }

            // 2. AI Identity Check (Semantic)
            // We pass existing docs + titles found in this current batch to avoid adding same thing twice in one go
            const identity = await analyzeDocumentIdentity(base64Data, file.type, currentBatchTitles);
            
            if (identity.isDuplicate) {
                 duplicatesFound.push({
                    filename: file.name,
                    match: identity.duplicateOf || "Existing Record"
                });
                continue;
            }

            // Generate a stable ID for the document *before* processing events
            const docId = `doc-${Date.now()}-${i}`;

            // 3. Valid New Document - Process it
            // CRITICAL: We pass the docId so the generated events link to this ID, not just the name.
            const events = await processEvidenceWithAI(base64Data, file.type, docId);
            newDrafts.push(...events);

            // Add Document immediately to store
            onAddDocument({
                id: docId,
                title: identity.title || file.name,
                content: `[Processed Content] ${identity.summary || 'Content processed by AI'}`,
                date: identity.date,
                type: file.type.includes('pdf') ? 'pdf' : 'text',
                hash: sha256,
                addedAt: new Date().toISOString()
            });

            // Track for next iteration
            currentBatchHashes.add(newDocHash);
            if (identity.title) currentBatchTitles.add(identity.title);

        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            // Optionally add to an error summary, for now just log
        }
    }

    setParsedDrafts(prev => [...prev, ...newDrafts]);
    if (duplicatesFound.length > 0) {
        setDuplicateSummary(duplicatesFound);
    }

    setIsProcessing(false);
    setStatusMessage('');
    setMode('review');
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeDocumentIdentity = async (data: string, mimeType: string, batchTitles: Set<string>): Promise<DocIdentity> => {
    // Combine existing docs and current batch titles for checking
    const existingDocList = documents.map(d => `Title: "${d.title}", Date: ${d.date || 'Unknown'}`).join('\n');
    const batchList = Array.from(batchTitles).map(t => `Title: "${t}" (Processing)`).join('\n');

    const prompt = `
        Analyze this document. 
        1. Determine its official Title (e.g., "Arrest Report", "Motion to Dismiss").
        2. Extract the Document Date (YYYY-MM-DD).
        3. Summarize it in one sentence.
        4. Compare it against this list of existing documents:
        ---
        ${existingDocList}
        ${batchList}
        ---
        If this document seems to be the same as one in the list (even if the filename is different), set isDuplicate to true and 'duplicateOf' to the existing title.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: data } }
                ]
            }
        ],
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING },
                    type: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    isDuplicate: { type: Type.BOOLEAN },
                    duplicateOf: { type: Type.STRING }
                }
            }
        }
    });

    return JSON.parse(response.text || '{}');
  };

  const processEvidenceWithAI = async (data: string, mimeType: string, sourceId: string): Promise<TimelineEvent[]> => {
    // Removed setStatusMessage here to allow loop to control message
    try {
      const model = ai.models;
      
      const prompt = `
        You are a forensic legal analyst for the case State v. Church (CR23-0657).
        Your job is to extract a strictly chronological timeline of events from the provided evidence.
        
        CRITICAL RULES:
        1. Extract specific dates for every event. If a date is ambiguous (e.g., "last Tuesday"), mark 'needsClarification' as true and write a 'clarificationQuestion' asking the user to specify the date.
        2. Identify the 'Cause' (State action/omission) and 'Effect' (Injury to defendant).
        3. Identify specific Constitutional or Statutory violations (Claims).
        4. Identify the Relief sought or available remedies.
        5. EXTRACT LEGAL SIGNIFICANCE: Why does this event matter for a § 1983 or Habeas claim?
        6. EXTRACT CITATIONS: If the document cites specific statutes (NRS), case law, or constitutional amendments, list them.
        7. EXTRACT SOURCE CITATION: Identify the exact phrase or sentence in the text that proves this event occurred. This will be used for highlighting.
        
        Return a JSON array of event objects.
      `;

      const response = await model.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mimeType, data: data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD or empty if unknown" },
                title: { type: Type.STRING },
                cause: { type: Type.STRING },
                effect: { type: Type.STRING },
                claim: { type: Type.STRING },
                relief: { type: Type.STRING },
                legalSignificance: { type: Type.STRING, description: "Analysis of why this event is actionable"},
                citations: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of statutes or case law cited" },
                sourceCitation: { type: Type.STRING, description: "Direct quote or reference from text" },
                needsClarification: { type: Type.BOOLEAN },
                clarificationQuestion: { type: Type.STRING },
              },
              required: ["title", "cause", "effect", "claim"]
            }
          }
        }
      });

      const events = JSON.parse(response.text || '[]');
      
      // Add IDs and Source refs
      const enrichedEvents = events.map((ev: any, idx: number) => ({
        ...ev,
        id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceId: sourceId, // Link to the Document ID
        confidence: 'high'
      }));

      return enrichedEvents;

    } catch (err) {
      console.error("AI Processing Error:", err);
      // Return empty array on error to allow other files to proceed
      return [];
    }
  };

  const handleTextAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setStatusMessage('Analyzing Text...');
    setDuplicateSummary([]);

    const base64 = btoa(inputText); 
    
    // For manual text, we skip complex dup check for now
    const events = await processEvidenceWithAI(base64, 'text/plain', 'manual-text-entry');
    
    setParsedDrafts(prev => [...prev, ...events]);
    setIsProcessing(false);
    setStatusMessage('');
    setMode('review');
  };

  const handleUpdateDraft = (index: number, field: keyof TimelineEvent, value: any) => {
    const updated = [...parsedDrafts];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-resolve clarification if date is fixed
    if (field === 'date' && value.match(/\d{4}-\d{2}-\d{2}/)) {
        updated[index].needsClarification = false;
        updated[index].clarificationQuestion = undefined;
    }

    setParsedDrafts(updated);
  };

  const handleCommit = () => {
    const validEvents = parsedDrafts.filter(d => !d.needsClarification && d.date);
    if (validEvents.length !== parsedDrafts.length) {
      alert("Please answer all clarification questions before committing.");
      return;
    }
    onAddEvents(validEvents);
    setParsedDrafts([]);
    setInputText('');
    setDuplicateSummary([]);
    setMode('input');
  };

  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in relative">
      <div className="mb-6 border-b border-gray-600 pb-4 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold font-serif text-gray-100 flex items-center">
            Evidence Command Center
            {isProcessing && <span className="ml-4 text-sm font-sans text-yellow-400 animate-pulse flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {statusMessage || 'Processing...'}
            </span>}
            </h2>
            <p className="text-gray-400 mt-2">
            Upload multiple PDF filings, transcripts, or paste text. The AI will forensically extract timeline events and flag ambiguities.
            </p>
        </div>
        <div className="text-right">
            <span className="block text-2xl font-bold text-white">{documents.length}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Total Items in Locker</span>
        </div>
      </div>

      {mode === 'input' ? (
        <div className="space-y-6">
          
          {/* Quick List of Existing Documents */}
          <div className="bg-gray-900/50 rounded-lg p-4 max-h-32 overflow-y-auto border border-gray-700">
             <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 sticky top-0 bg-gray-900/90 backdrop-blur-sm py-1">Items currently on record:</h4>
             <div className="flex flex-wrap gap-2">
                 {documents.map(d => (
                     <span key={d.id} className="text-xs px-2 py-1 bg-gray-800 border border-gray-600 rounded text-gray-300">
                         {d.title}
                     </span>
                 ))}
             </div>
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-yellow-500 transition-colors bg-gray-900/50">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept=".pdf,.txt,image/*"
              multiple // Allow bulk upload
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-yellow-500/10 text-yellow-400 font-bold py-2 px-6 rounded-full hover:bg-yellow-500/20 mb-2"
            >
              Upload Files (Bulk Supported)
            </button>
            <p className="text-xs text-gray-500">Supported: PDF, JPG, PNG, TXT</p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-500">Or paste text</span>
            </div>
          </div>

          <textarea
            className="w-full h-48 bg-gray-900 border border-gray-700 rounded-md p-4 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
            placeholder="Paste raw text here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          
          <div className="flex justify-end">
             <button
              onClick={handleTextAnalyze}
              disabled={!inputText.trim() || isProcessing}
              className="bg-gray-700 text-white px-6 py-2 rounded-md font-bold hover:bg-gray-600 disabled:opacity-50 transition-colors"
            >
              Process Text
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-yellow-400">Forensic Review</h3>
            <button 
              onClick={() => {
                setMode('input');
                setParsedDrafts([]);
                setDuplicateSummary([]);
              }}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Discard & Cancel
            </button>
          </div>

          {/* Duplicate Summary Report */}
          {duplicateSummary.length > 0 && (
             <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 mb-4 animate-fade-in">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                        <h4 className="text-yellow-400 font-bold text-sm">Duplicates Skipped ({duplicateSummary.length})</h4>
                        <p className="text-gray-400 text-xs mb-2">The following files were identified as duplicates and were not processed:</p>
                        <ul className="text-xs space-y-1">
                            {duplicateSummary.map((d, i) => (
                                <li key={i} className="flex gap-2">
                                    <span className="text-gray-300 font-mono">{d.filename}</span>
                                    <span className="text-gray-500">→ matches {d.match}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
             </div>
          )}

          {parsedDrafts.length === 0 && duplicateSummary.length === 0 ? (
            <p className="text-gray-400 italic">No valid events found to import.</p>
          ) : (
            <div className="space-y-4">
            {parsedDrafts.map((draft, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${draft.needsClarification ? 'border-red-500 bg-red-900/10' : 'border-green-500/30 bg-gray-800'}`}>
                
                {draft.needsClarification && (
                  <div className="mb-4 bg-red-900/20 p-3 rounded border border-red-500/50 flex flex-col md:flex-row md:items-center gap-3">
                    <span className="text-red-400 font-bold whitespace-nowrap">Clarification Needed:</span>
                    <span className="text-red-200 text-sm flex-1">{draft.clarificationQuestion || "Please verify the date for this event."}</span>
                  </div>
                )}

                {/* Source Badge */}
                <div className="mb-2">
                    <span className="text-[10px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded border border-gray-600">
                        Source ID: {draft.sourceId}
                    </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Date</label>
                    <input 
                      type="text" 
                      value={draft.date} 
                      onChange={(e) => handleUpdateDraft(idx, 'date', e.target.value)}
                      className={`w-full bg-gray-900 border ${draft.needsClarification && !draft.date ? 'border-red-500' : 'border-gray-700'} rounded px-3 py-2 text-sm text-white font-mono`}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div className="md:col-span-9">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Event Title</label>
                    <input 
                      type="text" 
                      value={draft.title} 
                      onChange={(e) => handleUpdateDraft(idx, 'title', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-white font-bold"
                    />
                  </div>
                  
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Cause (State Action)</label>
                    <textarea 
                      value={draft.cause} 
                      rows={2}
                      onChange={(e) => handleUpdateDraft(idx, 'cause', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                    />
                  </div>
                  <div className="md:col-span-6">
                     <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Effect (Injury)</label>
                    <textarea 
                      value={draft.effect} 
                      rows={2}
                      onChange={(e) => handleUpdateDraft(idx, 'effect', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-300"
                    />
                  </div>

                   <div className="md:col-span-12">
                     <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Legal Significance (AI Extracted)</label>
                    <textarea 
                      value={draft.legalSignificance || ''} 
                      rows={2}
                      onChange={(e) => handleUpdateDraft(idx, 'legalSignificance', e.target.value)}
                      className="w-full bg-indigo-900/20 border border-indigo-500/30 rounded px-3 py-2 text-sm text-indigo-200"
                      placeholder="Why this matters..."
                    />
                  </div>

                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Legal Claim</label>
                    <input 
                      type="text" 
                      value={draft.claim} 
                      onChange={(e) => handleUpdateDraft(idx, 'claim', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-yellow-500 font-mono"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Source Citation (Snippet)</label>
                    <input 
                      type="text" 
                      value={draft.sourceCitation || ''} 
                      onChange={(e) => handleUpdateDraft(idx, 'sourceCitation', e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-xs text-gray-400 italic"
                    />
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-900/90 p-4 backdrop-blur-sm -mx-6 -mb-6 rounded-b-lg">
            <button
              onClick={handleCommit}
              disabled={parsedDrafts.length === 0}
              className="bg-yellow-500 text-gray-900 px-8 py-3 rounded-md font-bold hover:bg-yellow-400 shadow-lg transition-all flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Commit to Timeline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceInput;
