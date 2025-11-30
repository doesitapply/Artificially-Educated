import React from 'react';
import type { ReportSection } from '../types';

interface SectionContentProps {
  section: ReportSection;
}

const SectionContent: React.FC<SectionContentProps> = ({ section }) => {
  // Simple markdown-ish parser for paragraphs and bold text
  const renderContent = (content: string | React.ReactNode) => {
    if (typeof content !== 'string') return content;

    return content.split('\n').map((line, index) => {
        if (!line.trim()) return <br key={index} />;
        
        // Headers
        if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-bold text-yellow-400 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-bold text-yellow-400 mt-6 mb-3">{line.replace('## ', '')}</h2>;
        
        // Lists
        if (line.trim().startsWith('- ')) return <li key={index} className="ml-4 list-disc text-gray-300 mb-1">{line.replace('- ', '')}</li>;
        
        // Bold formatting
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
            <p key={index} className="mb-4 text-gray-300 leading-relaxed">
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="text-gray-100">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </p>
        );
    });
  };

  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in">
      <div className="flex justify-between items-start border-b border-gray-600 pb-3 mb-6">
          <h2 className="text-3xl font-bold font-serif text-gray-100">{section.title}</h2>
          {section.isAiGenerated && (
            <span className="px-2 py-1 bg-indigo-900/50 border border-indigo-500/50 text-indigo-300 text-xs rounded uppercase tracking-wide">
                AI Generated
            </span>
          )}
      </div>
      
      <div className="prose prose-invert prose-lg max-w-none">
        {renderContent(section.content)}
      </div>
    </div>
  );
};

export default SectionContent;
