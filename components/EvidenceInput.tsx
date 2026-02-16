import React, { useState, useRef } from 'react';
import { Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineEvent, Document } from '../types';
import { aiClient } from '../ai-client';
import { safeParseJSON } from '../utils';

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

interface ExtractionResult {
    events: TimelineEvent[];
    fullText: string;
}

interface BatchReport {
    processed: number;
    added: number;
    skippedExact: number;
    skippedSemantic: number;
    failed: number;
}

const EvidenceInput: React.FC<EvidenceInputProps> = ({ onAddEvents, onAddDocument, documents }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [parsedDrafts, setParsedDrafts] = useState<TimelineEvent[]>([]);
  const [mode, setMode] = useState<'input' | 'review'>('input');
  
  // Resolution State
  const [resolutionInputs, setResolutionInputs] = useState<{[key: number]: string}>({});
  const [resolvingIndex, setResolvingIndex] = useState<number | null>(null);

  const [duplicateSummary, setDuplicateSummary] = useState<Array<{filename: string, match: string, type: 'Exact' | 'Semantic'}>>([]);
  const [batchReport, setBatchReport] = useState<BatchReport | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Helpers ---

  const computeHash = async (base64: string): Promise<string> => {
      const msgBuffer = new TextEncoder().encode(base64.slice(0, 1000000)); // Hash first 1MB for speed on large AV files
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const encodeBase64 = (str: string) => {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
        function toSolidBytes(match, p1) {
            return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  // --- Handlers ---

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setDuplicateSummary([]);
    setBatchReport(null);

    const newDrafts: TimelineEvent[] = [];
    const duplicatesFound: Array<{filename: string, match: string, type: 'Exact' | 'Semantic'}> = [];
    
    const currentBatchHashes = new Set<string>();
    const currentBatchTitles = new Set<string>();
    
    let skippedExact = 0;
    let skippedSemantic = 0;
    let addedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 20 * 1024 * 1024) {
             console.warn(`File ${file.name} is too large (>20MB). Skipping.`);
             failedCount++;
             continue;
        }

        setStatusMessage(`Analyzing file ${i + 1} of ${files.length}: ${file.name}...`);
        
        try {
            const base64Data = await readFileAsBase64(file);
            const sha256 = await computeHash(base64Data);

            const globalExactMatch = documents.find(d => d.hash === sha256);
            if (globalExactMatch) {
                duplicatesFound.push({ filename: file.name, match: globalExactMatch.title, type: 'Exact' });
                skippedExact++;
                continue;
            }

            const isMedia = file.type.startsWith('audio/') || file.type.startsWith('video/');
            const mediaType = file.type.startsWith('audio/') ? 'audio' : file.type.startsWith('video/') ? 'video' : file.type.includes('pdf') ? 'pdf' : 'text';

            let identity: DocIdentity;
            let events: TimelineEvent[] = [];
            let content = '';
            const docId = `doc-${Date.now()}-${i}`;

            if (isMedia) {
                setStatusMessage(`Transcribing & Profiling Media: ${file.name}...`);
                const result = await processMediaWithAI(base64Data, file.type, docId, currentBatchTitles);
                identity = result.identity;
                
                if (identity.isDuplicate) {
                     duplicatesFound.push({ filename: file.name, match: identity.duplicateOf || "Existing Record", type: 'Semantic' });
                     skippedSemantic++;
                     continue;
                }
                events = result.events;
                content = result.transcript;
            } else {
                identity = await analyzeDocumentIdentity(base64Data, file.type, currentBatchTitles);
                
                if (identity.isDuplicate) {
                     duplicatesFound.push({ filename: file.name, match: identity.duplicateOf || "Existing Record", type: 'Semantic' });
                     skippedSemantic++;
                     continue;
                }
                
                setStatusMessage(`Extracting Events & OCR: ${identity.title || file.name}...`);
                const result = await processEvidenceWithAI(base64Data, file.type, docId);
                events = result.events;
                content = result.fullText || identity.summary || 'Content processed by AI';
            }

            newDrafts.push(...events);

            onAddDocument({
                id: docId,
                title: identity.title || file.name,
                content: content,
                mediaType: mediaType as any,
                mediaData: isMedia ? `data:${file.type};base64,${base64Data}` : undefined,
                date: identity.date,
                hash: sha256,
                addedAt: new Date().toISOString(),
                reliabilityScore: 100
            });

            currentBatchHashes.add(sha256);
            if (identity.title) currentBatchTitles.add(identity.title);
            addedCount++;

        } catch (error) {
            console.error(`Error processing ${file.name}:`, error);
            failedCount++;
        }
    }

    setParsedDrafts(prev => [...prev, ...newDrafts]);
    if (duplicatesFound.length > 0) setDuplicateSummary(duplicatesFound);
    
    setBatchReport({
        processed: files.length,
        added: addedCount,
        skippedExact,
        skippedSemantic,
        failed: failedCount
    });

    setIsProcessing(false);
    setStatusMessage('');
    setMode('review');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const analyzeDocumentIdentity = async (data: string, mimeType: string, batchTitles: Set<string>): Promise<DocIdentity> => {
    const existingDocList = documents.map(d => `Title: "${d.title}", Date: ${d.date || 'Unknown'}`).join('\n');
    const batchList = Array.from(batchTitles).map(t => `Title: "${t}" (Processing)`).join('\n');

    const prompt = `
        Analyze this document. 
        1. Determine its official Title (e.g., "Arrest Report").
        2. Extract the Document Date (YYYY-MM-DD).
        3. Summarize it in one sentence.
        4. Compare it against this list of existing documents:
        ---
        ${existingDocList}
        ${batchList}
        ---
        If this document seems to be the same as one in the list (even if the filename is different), set isDuplicate to true.
        
        DATA CONTEXT:
        MimeType: ${mimeType}
        Content (Base64 Truncated): ${data.substring(0, 200)}...
    `;

    return await aiClient.generateJSON({
        systemPrompt: MASTER_SYSTEM_PROMPT,
        userPrompt: prompt,
        jsonMode: true,
        schema: {
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
    });
  };

  const processMediaWithAI = async (data: string, mimeType: string, sourceId: string, batchTitles: Set<string>): Promise<{identity: DocIdentity, events: TimelineEvent[], transcript: string}> => {
     try {
        const existingDocList = documents.map(d => `Title: "${d.title}", Date: ${d.date || 'Unknown'}`).join('\n');
        const batchList = Array.from(batchTitles).map(t => `Title: "${t}" (Processing)`).join('\n');

        // Note: For media files, we stick to Gemini exclusively as it handles multimodal.
        // The unified client will use Gemini if data is media, or throw error if forced to OpenAI (which doesn't support direct audio/video bytes easily in this setup)
        // Since we are sending base64, we bypass the UnifiedClient for this specific call to ensure we use the correct Gemini method that accepts InlineData.
        
        // However, UnifiedClient abstracts text generation. We need to instantiate Gemini manually for media upload
        // OR we just use the UnifiedClient's internal logic if updated. 
        // For SAFETY in this "stress test" update, let's keep media handling direct to GoogleGenAI but use the key management.
        // Wait, UnifiedClient doesn't support inlineData yet. Let's fix that in ai-client or just use direct here.
        // Direct approach for Media is safer for now.

        const prompt = `
            You are a Forensic Audio/Video Analyst.
            TASK 1: Generate a verbatim TRANSCRIPT.
            TASK 2: Extract Timeline Events.
            TASK 3: Create Metadata.
            EXISTING DOCS: ${existingDocList} ${batchList}
        `;
        
        // DIRECT GEMINI CALL FOR MEDIA (Unified Client doesn't support multimodal base64 yet)
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: data } }] }],
            config: {
                systemInstruction: MASTER_SYSTEM_PROMPT,
                responseMimeType: "application/json"
            }
        });

        const result = safeParseJSON(response.text || '{}');
        
        const enrichedEvents = (result.events || []).map((ev: any) => ({
            ...ev,
            id: `media-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceId: sourceId,
            snippetAnchor: ev.sourceCitation, // Use timestamp as anchor
            needsClarification: !ev.date
        }));

        return {
            identity: result.identity,
            events: enrichedEvents,
            transcript: result.transcript
        };

     } catch (err) {
        console.error("AI Media Processing Error:", err);
        throw err;
     }
  };

  const processEvidenceWithAI = async (data: string, mimeType: string, sourceId: string): Promise<ExtractionResult> => {
    try {
      const prompt = `
        You are a Forensic Evidence Parser.
        Convert raw documents into structured timeline events for Case No. 3:24-cv-00579.
        
        DOC CONTENT (${mimeType}):
        ${data.substring(0, 1000)}... (Content truncated for prompt log, full content used in processing)
      `;

      // For Text/PDF, we can use the Unified Client if we pass text. 
      // But we are passing base64. 
      // Similar to media, let's use direct Gemini for the base64 handling capability, 
      // BUT if we were using OpenAI, we'd need to extract text first.
      // For this "Foolproof" version, we assume Gemini is best for PDF ingestion.
      
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: mimeType, data: data } }] }],
        config: {
          systemInstruction: MASTER_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              events: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    title: { type: Type.STRING },
                    actor: { type: Type.STRING },
                    cause: { type: Type.STRING },
                    effect: { type: Type.STRING },
                    claim: { type: Type.STRING },
                    legalSignificance: { type: Type.STRING },
                    caseReference: { type: Type.STRING },
                    sourceCitation: { type: Type.STRING },
                    clarificationQuestion: { type: Type.STRING },
                    needsClarification: { type: Type.BOOLEAN },
                  },
                  required: ["title", "actor", "cause", "effect", "sourceCitation"]
                }
              },
              fullText: { type: Type.STRING }
            }
          }
        }
      });

      const result = safeParseJSON(response.text || '{}');
      const events = (result.events || []).map((ev: any) => ({
        ...ev,
        id: `extracted-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceId: sourceId,
        snippetAnchor: ev.sourceCitation ? simpleHash(ev.sourceCitation).toString() : undefined,
        needsClarification: !!ev.clarificationQuestion || !ev.date
      }));

      return {
          events,
          fullText: result.fullText || ""
      };

    } catch (err) {
      console.error("AI Processing Error:", err);
      return { events: [], fullText: "Error processing document text." };
    }
  };

  const handleTextAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsProcessing(true);
    setStatusMessage('Analyzing Text...');
    
    const virtualDocId = `manual-text-${Date.now()}`;
    
    try {
        // Use Unified Client for pure text analysis (Reliable & Switchable)
        const prompt = `
            Analyze this legal text. Extract timeline events.
            TEXT:
            ${inputText}
            
            OUTPUT SCHEMA: { events: [ ... ], fullText: "..." }
        `;
        
        const result = await aiClient.generateJSON({
            systemPrompt: MASTER_SYSTEM_PROMPT,
            userPrompt: prompt,
            jsonMode: true,
            schema: {
                type: Type.OBJECT,
                properties: {
                  events: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        date: { type: Type.STRING },
                        title: { type: Type.STRING },
                        actor: { type: Type.STRING },
                        cause: { type: Type.STRING },
                        effect: { type: Type.STRING },
                        claim: { type: Type.STRING },
                        legalSignificance: { type: Type.STRING },
                        caseReference: { type: Type.STRING },
                        sourceCitation: { type: Type.STRING },
                        clarificationQuestion: { type: Type.STRING },
                        needsClarification: { type: Type.BOOLEAN },
                      }
                    }
                  },
                  fullText: { type: Type.STRING }
                }
            }
        });

        // Add the manual text as a document so it appears in the Vault
        const base64 = encodeBase64(inputText);
        onAddDocument({
            id: virtualDocId,
            title: "Manual Text Entry",
            content: inputText,
            mediaType: 'text',
            date: new Date().toISOString().split('T')[0],
            hash: await computeHash(base64),
            addedAt: new Date().toISOString(),
            reliabilityScore: 100
        });

        const events = (result.events || []).map((ev: any) => ({
            ...ev,
            id: `text-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sourceId: virtualDocId,
            needsClarification: !!ev.clarificationQuestion || !ev.date
        }));

        setParsedDrafts(prev => [...prev, ...events]);
        setMode('review');
    } catch (e) {
        console.error(e);
        setStatusMessage('Analysis failed. Try again.');
    } finally {
        setIsProcessing(false);
    }
  };

  const resolveClarification = async (index: number) => {
      const input = resolutionInputs[index];
      if (!input) return;

      setResolvingIndex(index);
      
      try {
          const draft = parsedDrafts[index];
          const prompt = `
            FLAGGED EVENT: ${JSON.stringify(draft)}
            USER CLARIFICATION: "${input}"
            TASK: Fix the event JSON based on user input. Remove 'needsClarification'.
          `;

          const corrected = await aiClient.generateJSON({
              systemPrompt: MASTER_SYSTEM_PROMPT,
              userPrompt: prompt,
              jsonMode: true,
              schema: {
                  type: Type.OBJECT,
                  properties: {
                        date: { type: Type.STRING },
                        title: { type: Type.STRING },
                        actor: { type: Type.STRING },
                        cause: { type: Type.STRING },
                        effect: { type: Type.STRING },
                        claim: { type: Type.STRING },
                        legalSignificance: { type: Type.STRING },
                        caseReference: { type: Type.STRING },
                        sourceCitation: { type: Type.STRING },
                        clarificationQuestion: { type: Type.STRING },
                        needsClarification: { type: Type.BOOLEAN },
                  }
              }
          });
          
          if (corrected.title === "DELETED_EVENT") {
             const updated = [...parsedDrafts];
             updated.splice(index, 1);
             setParsedDrafts(updated);
          } else {
             const updated = [...parsedDrafts];
             updated[index] = { ...draft, ...corrected, id: draft.id };
             setParsedDrafts(updated);
          }
          
          setResolutionInputs(prev => {
              const next = {...prev};
              delete next[index];
              return next;
          });

      } catch (e) {
          console.error("Resolution failed", e);
          alert("Could not interpret resolution. Please edit manually.");
      } finally {
          setResolvingIndex(null);
      }
  };

  const handleUpdateDraft = (index: number, field: keyof TimelineEvent, value: any) => {
    const updated = [...parsedDrafts];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'date' && value.match(/\d{4}-\d{2}-\d{2}/)) {
        updated[index].needsClarification = false;
        updated[index].clarificationQuestion = undefined;
    }
    setParsedDrafts(updated);
  };

  const handleCommit = () => {
    onAddEvents(parsedDrafts.filter(d => !d.needsClarification));
    setParsedDrafts([]);
    setInputText('');
    setDuplicateSummary([]);
    setBatchReport(null);
    setMode('input');
  };

  const hasPendingClarifications = parsedDrafts.some(d => d.needsClarification);

  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in relative">
      <div className="mb-6 border-b border-gray-600 pb-4 flex justify-between items-end">
        <div>
            <h2 className="text-3xl font-bold font-serif text-gray-100 flex items-center">
            Evidence Command Center
            {isProcessing && <span className="ml-4 text-sm font-sans text-yellow-400 animate-pulse flex items-center">
                {statusMessage}
            </span>}
            </h2>
            <p className="text-gray-400 mt-2">Upload filings, transcripts, or <strong className="text-white">Audio/Video Recordings</strong>. AI extracts forensic timeline events.</p>
        </div>
        <div className="text-right">
            <span className="block text-2xl font-bold text-white">{documents.length}</span>
            <span className="text-xs text-gray-500 uppercase tracking-wider">Locker Items</span>
        </div>
      </div>

      {mode === 'input' ? (
        <div className="space-y-6">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-gray-900/50 hover:bg-gray-800 transition-colors">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden" 
              accept=".pdf,.txt,image/*,audio/*,video/*"
              multiple 
            />
            <div className="flex flex-col items-center gap-2">
                <svg className="w-12 h-12 text-gray-500 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-yellow-500 text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-yellow-400 shadow-lg transition-transform hover:scale-105"
                >
                Upload Evidence (Batch)
                </button>
                <p className="text-xs text-gray-500 mt-2">Supports: PDF, IMG, MP3, WAV, MP4 (Max 20MB per file)</p>
            </div>
          </div>
          <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-2 bg-gray-900 text-gray-500 text-sm">OR PASTE TEXT</span>
              </div>
          </div>
          <div className="relative">
            <textarea
                className="w-full h-32 bg-gray-900 border border-gray-700 rounded-md p-4 text-gray-300 font-mono text-sm focus:border-yellow-500 outline-none transition-colors"
                placeholder="Paste legal text, emails, or docket entries here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
            />
            <button 
                onClick={handleTextAnalyze} 
                disabled={!inputText.trim() || isProcessing} 
                className="absolute bottom-4 right-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-1 rounded text-xs font-bold transition-colors disabled:opacity-50"
            >
                Process Text
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-yellow-400">Forensic Review</h3>
            <button onClick={() => { setMode('input'); setParsedDrafts([]); }} className="text-sm text-gray-400 underline hover:text-white">Discard All</button>
          </div>

          {batchReport && (
             <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded text-sm grid grid-cols-5 gap-4 text-center">
                 <div><div className="text-2xl font-bold text-white">{batchReport.processed}</div><div className="text-gray-400 text-xs">Files Processed</div></div>
                 <div><div className="text-2xl font-bold text-green-400">{batchReport.added}</div><div className="text-gray-400 text-xs">Added</div></div>
                 <div><div className="text-2xl font-bold text-yellow-500">{batchReport.skippedExact}</div><div className="text-gray-400 text-xs">Exact Duplicates</div></div>
                 <div><div className="text-2xl font-bold text-orange-500">{batchReport.skippedSemantic}</div><div className="text-gray-400 text-xs">Semantic Duplicates</div></div>
                 <div><div className="text-2xl font-bold text-red-500">{batchReport.failed}</div><div className="text-gray-400 text-xs">Failed</div></div>
             </div>
          )}

          {parsedDrafts.length === 0 ? <p className="text-gray-400 italic">No new events found.</p> : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {parsedDrafts.map((draft, idx) => (
              <div key={idx} className={`p-4 rounded-lg border ${draft.needsClarification ? 'border-red-500 bg-red-900/10' : 'border-green-500/30 bg-gray-800'}`}>
                {draft.needsClarification && (
                  <div className="mb-4 bg-red-900/20 p-4 rounded border border-red-500/50">
                    <div className="flex items-start gap-3 mb-3">
                        <span className="text-red-400 font-bold whitespace-nowrap">Clarification Needed:</span>
                        <span className="text-red-200 text-sm italic">"{draft.clarificationQuestion || "Verify Date/Details"}"</span>
                    </div>
                    
                    {/* Resolution Console */}
                    <div className="flex gap-2">
                         <div className="relative flex-1">
                             <input 
                                type="text"
                                placeholder="Type answer to fix (e.g. 'The date is Jan 5th')..."
                                className="w-full bg-black border border-red-700 rounded p-2 text-white text-sm pl-8 focus:ring-1 focus:ring-red-500 outline-none"
                                value={resolutionInputs[idx] || ''}
                                onChange={(e) => setResolutionInputs(prev => ({...prev, [idx]: e.target.value}))}
                                onKeyDown={(e) => e.key === 'Enter' && resolveClarification(idx)}
                             />
                             <span className="absolute left-2 top-2 text-red-500">▶</span>
                         </div>
                         <button
                            onClick={() => resolveClarification(idx)}
                            disabled={resolvingIndex === idx || !resolutionInputs[idx]}
                            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded text-xs font-bold uppercase disabled:opacity-50 flex items-center gap-2"
                         >
                            {resolvingIndex === idx ? <span className="animate-spin">⟳</span> : <span>AUTO-FIX</span>}
                         </button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 flex gap-2">
                        <input type="text" value={draft.date} onChange={(e) => handleUpdateDraft(idx, 'date', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-white w-1/4" placeholder="Date (YYYY-MM-DD)" />
                        <input type="text" value={draft.actor} onChange={(e) => handleUpdateDraft(idx, 'actor', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-orange-400 w-1/4 font-mono text-xs" placeholder="Actor" />
                        <input type="text" value={draft.title} onChange={(e) => handleUpdateDraft(idx, 'title', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-white flex-1 font-bold" placeholder="Title" />
                    </div>
                  <textarea value={draft.cause} onChange={(e) => handleUpdateDraft(idx, 'cause', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-gray-300 text-sm" placeholder="Cause" rows={2} />
                  <textarea value={draft.effect} onChange={(e) => handleUpdateDraft(idx, 'effect', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-gray-300 text-sm" placeholder="Effect" rows={2} />
                  <textarea value={draft.legalSignificance} onChange={(e) => handleUpdateDraft(idx, 'legalSignificance', e.target.value)} className="md:col-span-2 bg-indigo-900/20 border border-indigo-500/30 rounded p-2 text-indigo-200 text-sm" placeholder="Legal Significance" rows={2} />
                  <input type="text" value={draft.caseReference} onChange={(e) => handleUpdateDraft(idx, 'caseReference', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-gray-300 text-sm" placeholder="Case Ref" />
                  <input type="text" value={draft.sourceCitation} onChange={(e) => handleUpdateDraft(idx, 'sourceCitation', e.target.value)} className="bg-gray-900 border border-gray-700 rounded p-2 text-gray-400 italic text-sm" placeholder="Citation / Timestamp" />
                </div>
              </div>
            ))}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-700 sticky bottom-0 bg-gray-900/90 p-4 rounded-b-lg">
            <button
              onClick={handleCommit}
              disabled={hasPendingClarifications || parsedDrafts.length === 0}
              className="bg-yellow-500 text-gray-900 px-8 py-3 rounded-md font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg transform active:scale-95"
            >
              {hasPendingClarifications ? "Resolve Clarifications to Commit" : `Commit ${parsedDrafts.length} Events`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceInput;