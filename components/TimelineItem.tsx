
import React, { useState, useEffect, useRef } from 'react';
import type { TimelineEvent } from '../types';

const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ScaleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
        <path d="M7 21h10"/>
        <path d="M12 3v18"/>
        <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
);

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
  isPrinting?: boolean;
  onViewDocument?: (docId: string, citation?: string) => void;
  highlighted?: boolean;
}

const DetailRow: React.FC<{ label: string; content: string }> = ({ label, content }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-3 border-b border-gray-700/50">
    <dt className="font-semibold text-sm text-yellow-400">{label}:</dt>
    <dd className="md:col-span-3 text-sm text-gray-300">{content}</dd>
  </div>
);

const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast, isPrinting = false, onViewDocument, highlighted = false }) => {
  const [isExpanded, setIsExpanded] = useState(isPrinting);
  const itemRef = useRef<HTMLDivElement>(null);

  // Auto-scroll and glow effect when highlighted
  useEffect(() => {
    if (highlighted && itemRef.current) {
        setIsExpanded(true);
        itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlighted]);

  return (
    <div className="relative mb-8" style={{ breakInside: 'avoid' }} ref={itemRef}>
      <div className={`absolute -left-[34px] top-1 h-6 w-6 rounded-full flex items-center justify-center ring-8 ring-gray-900 transition-colors duration-500 ${highlighted ? 'bg-indigo-500 animate-pulse' : 'bg-yellow-400'}`}>
        <div className="h-3 w-3 bg-gray-900 rounded-full"></div>
      </div>
      
      <div className={`ml-4 bg-gray-800 border rounded-lg shadow-lg overflow-hidden transition-all duration-500 ${highlighted ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-gray-700'}`}>
        <div 
          className="p-4" 
          onClick={() => !isPrinting && setIsExpanded(!isExpanded)}
          style={{ cursor: isPrinting ? 'default' : 'pointer' }}
          aria-expanded={isExpanded}
        >
          <div className="flex justify-between items-start">
            <div>
              <time className="mb-1 text-sm font-normal leading-none text-gray-400 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {event.date}
              </time>
              <h3 className="text-lg font-semibold text-gray-100">{event.title}</h3>
              {/* Source Badge Link */}
              {event.sourceId && (
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onViewDocument) onViewDocument(event.sourceId || '', event.sourceCitation);
                    }}
                    className="mt-2 inline-flex items-center gap-1 text-[10px] bg-gray-700 hover:bg-gray-600 hover:text-white text-gray-300 px-2 py-0.5 rounded border border-gray-600 transition-colors z-10 relative"
                  >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                      View Source {event.sourceCitation && "(Jump to Text)"}
                  </button>
              )}
            </div>
            {!isPrinting && <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />}
          </div>
        </div>

        {isExpanded && (
          <div className="bg-gray-800/50 p-4 border-t border-gray-700">
            {event.legalSignificance && (
                 <div className="mb-4 bg-indigo-900/20 p-3 rounded border border-indigo-500/30">
                     <div className="flex items-center gap-2 mb-1">
                         <ScaleIcon className="w-4 h-4 text-indigo-400" />
                         <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Legal Significance</span>
                     </div>
                     <p className="text-sm text-indigo-100 leading-relaxed">{event.legalSignificance}</p>
                 </div>
            )}
            
            <dl>
              <DetailRow label="Cause" content={event.cause} />
              <DetailRow label="Effect" content={event.effect} />
              <DetailRow label="§ 1983 Claim" content={event.claim} />
              
              {event.citations && event.citations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-3 border-b border-gray-700/50">
                    <dt className="font-semibold text-sm text-yellow-400">Authorities:</dt>
                    <dd className="md:col-span-3 text-sm text-gray-300">
                        <ul className="list-disc ml-4 space-y-1">
                            {event.citations.map((cite, i) => (
                                <li key={i}>{cite}</li>
                            ))}
                        </ul>
                    </dd>
                </div>
              )}
              
              {event.sourceCitation && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-3 border-b border-gray-700/50 bg-gray-900/30 -mx-4 px-4">
                    <dt className="font-semibold text-sm text-gray-500 uppercase tracking-wider">Evidentiary Proof:</dt>
                    <dd className="md:col-span-3 text-xs text-gray-400 italic font-serif">"{event.sourceCitation}"</dd>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-3">
                <dt className="font-semibold text-sm text-yellow-400">Relief Sought:</dt>
                <dd className="md:col-span-3 text-sm text-gray-300">{event.relief}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineItem;
