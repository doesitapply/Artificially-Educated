
import React, { useMemo } from 'react';
import type { TimelineMonth } from '../types';
import TimelineItem from './TimelineItem';

interface TimelineProps {
  data: TimelineMonth[];
  isPrinting?: boolean;
  onViewDocument?: (docId: string, citation?: string, anchor?: string) => void;
  highlightedEventId?: string;
  caseFilter?: string;
  setCaseFilter?: (filter: string) => void;
  selectedEventIds?: Set<string>;
  onToggleEventSelection?: (eventId: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
    data, 
    isPrinting = false, 
    onViewDocument, 
    highlightedEventId, 
    caseFilter = 'All', 
    setCaseFilter,
    selectedEventIds,
    onToggleEventSelection
}) => {
    
  const filteredData = useMemo(() => {
    if (caseFilter === 'All') return data;
    return data.map(month => ({
        ...month,
        events: month.events.filter(e => {
            if (caseFilter === 'CR23-0657') return !e.caseReference || e.caseReference === 'CR23-0657';
            return e.caseReference === caseFilter;
        })
    })).filter(m => m.events.length > 0);
  }, [data, caseFilter]);

  const selectedCount = selectedEventIds ? selectedEventIds.size : 0;

  return (
    <div>
      <div className={`bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 ${isPrinting ? 'hidden' : ''}`}>
        <div>
            <h2 className="text-3xl font-bold font-serif text-gray-100">Chronological Timeline</h2>
            <p className="mt-2 text-gray-400">Forensic sequence of alleged violations. Select events to build a drafting payload.</p>
        </div>
        <div className="flex gap-4 items-end">
            {selectedCount > 0 && (
                 <div className="px-4 py-2 bg-red-900/30 border border-red-500 rounded-lg flex flex-col items-center animate-pulse">
                     <span className="text-xs font-bold text-red-400 uppercase tracking-widest">Targets Locked</span>
                     <span className="text-xl font-mono text-white font-bold">{selectedCount}</span>
                 </div>
            )}
            {setCaseFilter && (
                <div className="flex flex-col gap-1">
                     <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Case Filter</label>
                    <select 
                        value={caseFilter}
                        onChange={(e) => setCaseFilter(e.target.value)}
                        className="bg-gray-900 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-2.5 outline-none font-mono"
                    >
                        <option value="All">All Cases</option>
                        <option value="CR23-0657">State v. Church (CR23-0657)</option>
                        <option value="CR23-0914">State v. Joyce (CR23-0914)</option>
                        <option value="3:24-cv-00579">Federal (3:24-cv-00579)</option>
                    </select>
                </div>
            )}
        </div>
      </div>
      
      <div className="relative">
        {filteredData.map((monthData, index) => (
          <div key={monthData.month} className="mb-12" style={{ breakInside: 'avoid-page' }}>
            <h3 className={`text-2xl font-serif font-bold text-yellow-400 mb-6 py-2 z-0 ${!isPrinting && 'sticky top-24 bg-gray-900 shadow-md'}`}>{monthData.month}</h3>
            <div className={`relative pl-8 border-l-2 ${isPrinting ? 'border-gray-400' : 'border-gray-600'}`}>
              {monthData.events.map((event, eventIndex) => (
                <TimelineItem 
                    key={event.id} 
                    event={event} 
                    isLast={index === filteredData.length - 1 && eventIndex === monthData.events.length - 1} 
                    isPrinting={isPrinting}
                    onViewDocument={onViewDocument}
                    highlighted={highlightedEventId === event.id}
                    isSelected={selectedEventIds?.has(event.id)}
                    onToggleSelection={onToggleEventSelection}
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
