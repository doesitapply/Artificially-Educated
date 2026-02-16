
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { MASTER_SYSTEM_PROMPT } from '../ai-config';
import type { TimelineMonth, Document } from '../types';

interface ChatAssistantProps {
  timelineData: TimelineMonth[];
  documents: Document[];
  onNavigate: (sectionId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ timelineData, documents, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'init', role: 'model', text: 'Tactical Support Unit online. I have access to the full case chronology and evidence locker. Awaiting directives.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // 1. Prepare Context
      const flatEvents = timelineData.flatMap(m => m.events);
      const caseContext = `
        CURRENT CASE STATE:
        - Total Events: ${flatEvents.length}
        - Documents: ${documents.length}
        - Key Actors: Judge Breslow, DA Kandaras, PD Hutt, PD Carrico.
        
        DATA SNIPPET (Last 5 events):
        ${JSON.stringify(flatEvents.slice(-5).map(e => `${e.date}: ${e.title}`))}
      `;

      // 2. Define Tools (Navigation)
      const tools = [{
        functionDeclarations: [{
          name: "navigate_app",
          description: "Switch the main application view to a specific section.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              sectionId: {
                type: Type.STRING,
                description: "Target section ID",
                enum: [
                    "timeline", "documents", "evidence-input", 
                    "pattern-analysis", "drafting-lab", "tactical-simulator", 
                    "actor-network", "conflict-analysis", "global-search"
                ]
              }
            },
            required: ["sectionId"]
          }
        }]
      }];

      // 3. Call AI using correct generateContent signature
      const isComplex = input.length > 50 || input.toLowerCase().includes('analyze') || input.toLowerCase().includes('strategy');
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            // Inject context into the user message for this turn since we are using single-turn generation with history simulation
            { role: 'user', parts: [{ text: `${MASTER_SYSTEM_PROMPT}\n\n${caseContext}\n\nYOU ARE THE 'TACTICAL SUPPORT UNIT' CHATBOT. User Query: ${userMsg.text}` }] }
        ],
        config: {
            // Thinking Budget for complex queries
            thinkingConfig: isComplex ? { thinkingBudget: 1024 } : undefined,
            tools: tools,
            // Removed explicit toolConfig mode='AUTO' as it is the default and caused type issues with string literal
        }
      });

      // 4. Handle Response & Tool Calls
      const result = response.candidates?.[0];
      const content = result?.content;
      
      let botText = "";
      let toolCalled = false;

      if (content?.parts) {
          for (const part of content.parts) {
              if (part.text) {
                  botText += part.text;
              }
              if (part.functionCall) {
                  toolCalled = true;
                  const fn = part.functionCall;
                  if (fn.name === 'navigate_app') {
                      const args = fn.args as any;
                      onNavigate(args.sectionId);
                      botText += `[EXECUTING NAVIGATION PROTOCOL: ${args.sectionId.toUpperCase()}]`;
                  }
              }
          }
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: botText || (toolCalled ? "Command executed." : "I am processing that data.") }]);

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "ERROR: NEURAL LINK SEVERED. UNABLE TO PROCESS REQUEST." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
        {/* Toggle Button */}
        <button
            onClick={() => setIsOpen(!isOpen)}
            className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all duration-300 border border-cyan-500/50 flex items-center justify-center ${
                isOpen ? 'bg-cyan-950 text-cyan-400 rotate-90' : 'bg-black text-cyan-500 hover:scale-110 hover:bg-cyan-950'
            }`}
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isOpen ? (
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                )}
            </svg>
        </button>

        {/* Chat Interface */}
        {isOpen && (
            <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-slate-950/95 backdrop-blur-md border border-cyan-800 rounded-lg shadow-2xl flex flex-col z-50 animate-fade-in overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900 p-3 border-b border-cyan-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                        <h3 className="font-hud text-sm text-cyan-400 tracking-wider">TACTICAL SUPPORT UNIT</h3>
                    </div>
                    <span className="text-[10px] font-mono text-gray-500">GEMINI-3-PRO</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-sm ${
                                msg.role === 'user' 
                                ? 'bg-cyan-900/30 border border-cyan-700/50 text-cyan-100' 
                                : 'bg-slate-900 border border-slate-700 text-gray-300'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isProcessing && (
                         <div className="flex justify-start">
                            <div className="bg-slate-900 border border-slate-700 p-3 rounded-sm text-gray-500 italic">
                                Analyzing vector space...
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 bg-slate-900 border-t border-cyan-900/30">
                    <div className="relative">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Input command or query..."
                            className="w-full bg-black border border-slate-700 text-gray-300 p-3 pr-10 rounded-sm focus:border-cyan-500 outline-none font-mono text-sm"
                            disabled={isProcessing}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isProcessing}
                            className="absolute right-2 top-2 text-cyan-600 hover:text-cyan-400 disabled:opacity-50"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                        </button>
                    </div>
                    <div className="mt-2 flex justify-between text-[9px] text-gray-600 font-mono">
                        <span>MODE: OFFENSIVE-LITIGATION</span>
                        <span>ENCRYPTION: ENABLED</span>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default ChatAssistant;
