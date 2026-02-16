import React, { useState, useEffect, useRef } from 'react';
import type { TimelineEvent } from '../types';

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="M7 21h10"/>
        <path d="M12 3v18"/>
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
);

const TargetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="22" y1="12" x2="18" y2="12"></line>
      <line x1="6" y1="12" x2="2" y2="12"></line>
      <line x1="12" y1="6" x2="12" y2="2"></line>
      <line x1="12" y1="22" x2="12" y2="18"></line>
    </svg>
);

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
  isPrinting?: boolean;
  onViewDocument?: (docId: string, citation?: string, anchor?: string) => void;
  highlighted?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (eventId: string) => void;
}

const DetailRow: React.FC<{ label: string; content: string; color?: string }> = ({ label, content, color = "text-cyan-600" }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2 border-b border-slate-800/50 last:border-0">
    <dt className={`font-mono text-xs ${color} uppercase tracking-wider`}>{label}:</dt>
    <dd className="md:col-span-3 text-sm text-gray-300 font-mono">{content}</dd>
  </div>
);

const TimelineItem: React.FC<TimelineItemProps> = ({ 
    event, 
    isLast, 
    isPrinting = false, 
    onViewDocument, 
    highlighted = false,
    isSelected = false,
    onToggleSelection
}) => {
  const [isExpanded, setIsExpanded] = useState(isPrinting);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted && itemRef.current) {
        setIsExpanded(true);
        itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  const isMediaEvent = /^\d{1,2}:\d{2}/.test(event.sourceCitation || '');

  return (
    <div className="relative mb-6" style={{ breakInside: 'avoid' }} ref={itemRef}>
      {/* Connector Line */}
      {!isLast && !isPrinting && (
        <div className="absolute left-[-29px] top-6 bottom-[-24px] w-px bg-slate-800"></div>
      )}

      {/* Node Marker */}
      <div className={`absolute -left-[33px] top-1.5 h-2.5 w-2.5 rotate-45 border transition-all duration-500 z-10 ${
          isSelected ? 'bg-red-500 border-red-400 shadow-[0_0_15px_red] scale-125' :
          highlighted ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 
          isMediaEvent ? 'bg-black border-red-500' : 
          'bg-black border-cyan-700'
      }`}></div>
      
      {/* Event Card */}
      <div className={`ml-4 glass-panel rounded-sm overflow-hidden transition-all duration-300 ${
          isSelected ? 'border-l-4 border-l-red-500 bg-red-950/10 shadow-[0_0_20px_rgba(220,38,38,0.1)]' :
          highlighted ? 'border-l-4 border-l-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 
          'border-l-2 border-l-slate-700 hover:border-l-cyan-600'
      }`}>
        <div 
          className="p-3 cursor-pointer group"
          onClick={() => !isPrinting && setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                  <span className="font-mono text-xs text-cyan-500 flex items-center bg-cyan-950/30 px-2 py-0.5 rounded-sm border border-cyan-900/50">
                    <CalendarIcon className="w-3 h-3 mr-2" />
                    {event.date}
                  </span>
                  {event.caseReference && (
                    <span className="font-mono text-[10px] text-gray-500 border border-slate-700 px-1 rounded-sm">
                        {event.caseReference}
                    </span>
                  )}
                  {event.actor && (
                    <span className="font-mono text-[9px] text-orange-400 uppercase tracking-tighter border border-orange-900 bg-orange-950/20 px-1 rounded-sm">
                        {event.actor}
                    </span>
                  )}
              </div>
              <h3 className={`text-base font-bold font-hud transition-colors ${isSelected ? 'text-red-400' : 'text-gray-100 group-hover:text-cyan-300'}`}>
                {event.title}
              </h3>
              
              <div className="flex items-center gap-4 mt-2">
                 {/* Targeting Button */}
                 {!isPrinting && onToggleSelection && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleSelection(event.id);
                        }}
                        className={`text-[10px] font-mono uppercase font-bold flex items-center gap-1 transition-all ${
                            isSelected ? 'text-red-400 animate-pulse' : 'text-gray-600 hover:text-red-400'
                        }`}
                    >
                        <TargetIcon className="w-3 h-3" />
                        <span>{isSelected ? 'TARGET LOCKED' : 'TARGET'}</span>
                    </button>
                 )}

                 {/* Source Link */}
                 {event.sourceId && (
                      <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onViewDocument) onViewDocument(event.sourceId || '', event.sourceCitation, event.snippetAnchor);
                        }}
                        className="text-[10px] font-mono uppercase text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                      >
                          <span>[ VIEW SOURCE ]</span>
                      </button>
                 )}
              </div>
            </div>
            
            {/* Expansion Indicator */}
             <div className={`text-cyan-900 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-cyan-500' : ''}`}>
                 ▼
             </div>
          </div>
        </div>

        {isExpanded && (
          <div className="bg-black/40 p-4 border-t border-slate-800">
            {event.legalSignificance && (
                 <div className="mb-4 bg-slate-900/80 p-3 rounded-sm border-l-2 border-indigo-500">
                     <div className="flex items-center gap-2 mb-1">
                         <ScaleIcon className="w-3 h-3 text-indigo-400" />
                         <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">Legal Significance</span>
                     </div>
                     <p className="text-xs text-indigo-100 font-mono leading-relaxed">{event.legalSignificance}</p>
                 </div>
            )}
            
            <dl className="space-y-1">
              {event.actor && <DetailRow label="ACTOR" content={event.actor} color="text-orange-500" />}
              <DetailRow label="CAUSE" content={event.cause} />
              <DetailRow label="EFFECT" content={event.effect} />
              <DetailRow label="CLAIM" content={event.claim} />
              
              {event.citations && event.citations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2 border-b border-slate-800/50">
                    <dt className="font-mono text-xs text-cyan-600 uppercase tracking-wider">Auth:</dt>
                    <dd className="md:col-span-3 text-sm text-gray-300">
                        <ul className="list-disc ml-4 space-y-1 text-xs font-mono text-yellow-500">
                            {event.citations.map((cite, i) => (
                                <li key={i}>{cite}</li>
                            ))}
                        </ul>
                    </dd>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-2">
                <dt className="font-mono text-xs text-cyan-600 uppercase tracking-wider">Relief:</dt>
                <dd className="md:col-span-3 text-xs text-gray-400 font-mono">{event.relief}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineItem;