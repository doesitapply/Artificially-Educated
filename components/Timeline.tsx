
import React from 'react';
import type { TimelineMonth } from '../types';
import TimelineItem from './TimelineItem';

interface TimelineProps {
  data: TimelineMonth[];
  isPrinting?: boolean;
  onViewDocument?: (docId: string, citation?: string) => void;
  highlightedEventId?: string;
}

const Timeline: React.FC<TimelineProps> = ({ data, isPrinting = false, onViewDocument, highlightedEventId }) => {
  return (
    <div>
      <div className={`bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 mb-8 ${isPrinting ? 'hidden' : ''}`}>
        <h2 className="text-3xl font-bold font-serif text-gray-100">Chronological Timeline of Alleged Violations</h2>
        <p className="mt-2 text-gray-400">This section presents a chronological timeline of alleged violations, each detailing the date, the specific action or inaction by state actors (cause), the resulting constitutional or statutory injury (effect), the relevant 42 U.S.C. § 1983 claim, and the relief sought.</p>
      </div>
      <div className="relative">
        {data.map((monthData, index) => (
          <div key={monthData.month} className="mb-12" style={{ breakInside: 'avoid-page' }}>
            <h3 className={`text-2xl font-serif font-bold text-yellow-400 mb-6 py-2 z-0 ${!isPrinting && 'sticky top-24 bg-gray-900'}`}>{monthData.month}</h3>
            <div className={`relative pl-8 border-l-2 ${isPrinting ? 'border-gray-400' : 'border-gray-600'}`}>
              {monthData.events.map((event, eventIndex) => (
                <TimelineItem 
                    key={event.id} 
                    event={event} 
                    isLast={index === data.length - 1 && eventIndex === monthData.events.length - 1} 
                    isPrinting={isPrinting}
                    onViewDocument={onViewDocument}
                    highlighted={highlightedEventId === event.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Timeline;
