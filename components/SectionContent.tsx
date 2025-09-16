
import React from 'react';
import type { ReportSection } from '../types';

interface SectionContentProps {
  section: ReportSection;
}

const SectionContent: React.FC<SectionContentProps> = ({ section }) => {
  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="text-3xl font-bold font-serif text-gray-100 mb-6 border-b border-gray-600 pb-3">{section.title}</h2>
      <div className="prose prose-invert prose-lg max-w-none text-gray-300 space-y-4">
        {typeof section.content === 'string' ? (
          section.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))
        ) : (
          section.content
        )}
      </div>
    </div>
  );
};

export default SectionContent;
