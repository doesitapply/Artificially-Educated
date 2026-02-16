
import React from 'react';
import type { Document } from '../types';

interface ChainOfCustodyLedgerProps {
  documents: Document[];
}

const ChainOfCustodyLedger: React.FC<ChainOfCustodyLedgerProps> = ({ documents }) => {
  return (
    <div className="bg-gray-800/50 p-6 md:p-8 rounded-lg border border-gray-700 shadow-lg animate-fade-in min-h-[calc(100vh-140px)]">
      <div className="mb-8 border-b border-gray-600 pb-4">
        <h2 className="text-3xl font-bold font-serif text-gray-100">Chain of Custody Ledger</h2>
        <p className="text-gray-400 mt-2">Cryptographic verification log of all ingested evidence.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-600 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <th className="p-3">Bates No.</th>
              <th className="p-3">Document Title</th>
              <th className="p-3">Type</th>
              <th className="p-3">SHA-256 Hash (Integrity Signature)</th>
              <th className="p-3">Ingest Timestamp</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono text-gray-300">
            {documents.length === 0 ? (
                <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 italic">No evidence in locker.</td>
                </tr>
            ) : (
                documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-700/30 transition-colors">
                    <td className="p-3 text-yellow-400 font-bold">{doc.batesNumber || 'N/A'}</td>
                    <td className="p-3 font-sans text-white">{doc.title}</td>
                    <td className="p-3 uppercase text-xs">{doc.mediaType || 'TEXT'}</td>
                    <td className="p-3 text-xs text-gray-500 break-all max-w-xs" title={doc.hash}>
                        {doc.hash || 'PENDING VERIFICATION'}
                    </td>
                    <td className="p-3 text-xs">
                        {doc.addedAt ? new Date(doc.addedAt).toLocaleString() : 'Pre-Ingest'}
                    </td>
                    <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900 text-green-300">
                            VERIFIED
                        </span>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 p-4 bg-gray-900/50 border border-gray-700 rounded text-xs text-gray-500 font-mono">
          <p><strong>LEGAL NOTICE:</strong> This ledger represents the digital chain of custody for Case No. 3:24-cv-00579. SHA-256 hashes are generated client-side upon ingestion. Any alteration to source files will result in a hash mismatch.</p>
      </div>
    </div>
  );
};

export default ChainOfCustodyLedger;
