import React from 'react';

const GavelIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="m14 13-7.5 7.5" />
    <path d="m16 11.5 6 6" />
    <path d="m3 21 6-6" />
    <path d="m15 12.5 6 6" />
    <path d="m8 8 9-9" />
    <path d="m9 7 4-4" />
    <path d="m16 15 4-4" />
  </svg>
);

const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

interface HeaderProps {
  onExport: () => void;
}

const Header: React.FC<HeaderProps> = ({ onExport }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-700">
      <div className="max-w-screen-2xl mx-auto p-4 md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <GavelIcon className="h-8 w-8 text-yellow-400" />
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-serif text-gray-100 tracking-tight">Judicial Timeline Report</h1>
              <p className="text-sm text-gray-400">Case No. 3:24-cv-00579-ART-CSD</p>
            </div>
          </div>
          <button
            onClick={onExport}
            className="flex items-center space-x-2 px-4 py-2 rounded-md bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
            aria-label="Export report to PDF"
          >
            <DownloadIcon className="h-5 w-5" />
            <span className="text-sm font-semibold hidden md:inline">Export PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;