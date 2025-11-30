
import React from 'react';
import type { TimelineMonth, ReportSection, Document } from '../types';
import Timeline from './Timeline';
import ViolationsChart from './ViolationsChart';

interface PrintableReportProps {
  sections: ReportSection[];
  timelineData: TimelineMonth[];
  documents: Document[];
}

const PrintableReport: React.FC<PrintableReportProps> = ({ sections, timelineData, documents }) => {
  
  const renderOcrContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      return <span key={index} className="block">{line}</span>;
    });
  };
  
  return (
    <div className="printable-report bg-white text-black p-8 font-serif" style={{ display: 'none' }}>
      <header className="text-center border-b-2 border-black pb-4 mb-8">
        <h1 className="text-4xl font-bold">Judicial Timeline Report</h1>
        <p className="text-lg mt-2">Case No. 3:24-cv-00579-ART-CSD</p>
        <p className="text-sm mt-1 italic">Generated via Manus AI</p>
      </header>

      <main>
        {sections.map(section => {
          if (section.id === 'timeline' || section.id === 'documents' || section.id === 'analysis') {
            return null; // Handle these separately below
          }
          return (
            <section key={section.id} className="mb-8" style={{ pageBreakAfter: 'always' }}>
              <h2 className="text-3xl font-bold border-b border-gray-400 pb-2 mb-4">{section.title}</h2>
              <div className="text-base space-y-4 prose max-w-none">
                {typeof section.content === 'string' ? (
                  section.content.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))
                ) : (
                  section.content
                )}
              </div>
            </section>
          );
        })}

        {/* Timeline Section */}
        <section className="mb-8" style={{ pageBreakAfter: 'always' }}>
          <h2 className="text-3xl font-bold border-b border-gray-400 pb-2 mb-4">Chronological Timeline</h2>
          <Timeline data={timelineData} isPrinting={true} />
        </section>
        
        {/* Analysis Section */}
        <section className="mb-8" style={{ pageBreakAfter: 'always' }}>
           <h2 className="text-3xl font-bold border-b border-gray-400 pb-2 mb-4">Violations Analysis</h2>
           <ViolationsChart data={timelineData} isPrinting={true} />
        </section>

        {/* Documents Section */}
        <section>
          <h2 className="text-3xl font-bold border-b border-gray-400 pb-2 mb-4">Source Documents</h2>
          {documents.map(doc => (
            <div key={doc.id} className="mb-8" style={{ breakInside: 'avoid' }}>
              <div className="flex justify-between items-end border-b border-gray-300 pb-1 mb-2">
                <h3 className="text-xl font-bold">{doc.title}</h3>
                <span className="font-mono text-sm font-bold border border-black px-2 py-0.5">{doc.batesNumber || 'NO ID'}</span>
              </div>
              <div className="bg-gray-100 p-4 border border-gray-300 text-xs font-mono">
                <pre className="whitespace-pre-wrap">
                  <code>{renderOcrContent(doc.content)}</code>
                </pre>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="text-center text-gray-600 text-xs pt-8 mt-8 border-t border-black">
         <p>&copy; {new Date().getFullYear()} Manus AI. All rights reserved.</p>
         <p className="mt-1">This report is prepared for judicial review of Case No. 3:24-cv-00579-ART-CSD. Information presented is based on alleged events and claims.</p>
      </footer>
    </div>
  );
};

export default PrintableReport;
