import React, { useState } from 'react';
import type { Document } from '../types';

interface DocumentViewerProps {
  documents: Document[];
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ documents }) => {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(documents[0] || null);

  const renderOcrContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('== START OF OCR') || trimmedLine.startsWith('== END OF OCR')) {
        return (
          <span key={index} className="block text-gray-500 italic">
            {line}
          </span>
        );
      }
      
      const parts = line.split(/:(.*)/s); // Split on the first colon
      if (parts.length > 1 && parts[0].length > 0 && parts[0].length < 50 && !parts[0].includes('http')) { 
        const key = parts[0];
        const value = parts[1];
        return (
          <span key={index} className="block">
            <span className="text-yellow-400 font-semibold">{key}:</span>
            <span>{value}</span>
          </span>
        );
      }

      return <span key={index} className="block">{line}</span>;
    });
  };


  return (
    <div className="flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-1/3 lg:w-1/4">
        <div className="sticky top-24 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-xl font-serif font-bold text-yellow-400 mb-4">Documents</h3>
          <ul className="space-y-2 max-h-[60vh] overflow-y-auto">
            {documents.map((doc) => (
              <li key={doc.id}>
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 ${
                    selectedDoc?.id === doc.id
                      ? 'bg-yellow-500/10 text-yellow-400 font-semibold'
                      : 'text-gray-400 hover:bg-gray-700/50 hover:text-gray-200'
                  }`}
                  aria-current={selectedDoc?.id === doc.id}
                >
                  {doc.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <div className="flex-1">
        {selectedDoc ? (
          <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700">
            <h2 className="text-2xl font-bold font-serif text-gray-100 mb-4" id="document-title">{selectedDoc.title}</h2>
            <div className="bg-gray-900 p-4 rounded-md text-gray-300 font-mono text-xs leading-relaxed overflow-auto max-h-[70vh]" aria-labelledby="document-title">
              <pre className="whitespace-pre-wrap">
                <code>{renderOcrContent(selectedDoc.content)}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700">
            <p>Select a document to view its content.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;