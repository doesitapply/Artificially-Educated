
import React, { useState } from 'react';
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

interface TimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

const DetailRow: React.FC<{ label: string; content: string }> = ({ label, content }) => (
  <div className="grid grid-cols-1 md:grid-cols-4 gap-2 py-3 border-b border-gray-700/50">
    <dt className="font-semibold text-sm text-yellow-400">{label}:</dt>
    <dd className="md:col-span-3 text-sm text-gray-300">{content}</dd>
  </div>
);

const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative mb-8">
      <div className="absolute -left-[34px] top-1 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center ring-8 ring-gray-900">
        <div className="h-3 w-3 bg-gray-900 rounded-full"></div>
      </div>
      
      <div className="ml-4 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex justify-between items-start">
            <div>
              <time className="mb-1 text-sm font-normal leading-none text-gray-400 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {event.date}
              </time>
              <h3 className="text-lg font-semibold text-gray-100">{event.title}</h3>
            </div>
            <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isExpanded && (
          <div className="bg-gray-800/50 p-4 border-t border-gray-700">
            <dl>
              <DetailRow label="Cause" content={event.cause} />
              <DetailRow label="Effect" content={event.effect} />
              <DetailRow label="§ 1983 Claim" content={event.claim} />
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
