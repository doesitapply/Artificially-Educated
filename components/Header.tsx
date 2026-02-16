
import React, { useRef } from 'react';

const TerminalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="4 17 10 11 4 5"></polyline>
    <line x1="12" y1="19" x2="20" y2="19"></line>
  </svg>
);

const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
);

const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="17 8 12 3 7 8"></polyline>
      <line x1="12" y1="3" x2="12" y2="15"></line>
    </svg>
);

const PrintIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
    </svg>
);

interface HeaderProps {
  onExportPDF: () => void;
  onSaveCase: () => void;
  onLoadCase: (file: File) => void;
}

const Header: React.FC<HeaderProps> = ({ onExportPDF, onSaveCase, onLoadCase }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onLoadCase(e.target.files[0]);
      }
  };

  return (
    <header className="bg-slate-950/90 backdrop-blur-md sticky top-0 z-50 border-b border-cyan-900/50 shadow-[0_0_15px_rgba(8,145,178,0.1)]">
      <div className="max-w-screen-2xl mx-auto p-4 md:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950/30 border border-cyan-500/50 rounded-sm">
                <TerminalIcon className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-hud font-black text-gray-100 tracking-wider">
                PROJECT <span className="text-cyan-500">MANUS</span>
              </h1>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <p className="text-[10px] text-cyan-600 font-mono tracking-widest uppercase">Forensic Litigation Engine v2.1</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
             {/* Data Controls */}
            <div className="hidden md:flex items-center bg-slate-900/50 border border-slate-700 rounded-sm p-1 mr-4">
                <button
                    onClick={onSaveCase}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-sm text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all text-xs font-mono uppercase"
                    title="Serialize Data"
                >
                    <SaveIcon className="h-4 w-4" />
                    <span>Save State</span>
                </button>
                <div className="w-px h-4 bg-slate-700 mx-1"></div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept=".json" 
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-sm text-gray-400 hover:text-cyan-300 hover:bg-cyan-950/30 transition-all text-xs font-mono uppercase"
                    title="Hydrate Data"
                >
                    <UploadIcon className="h-4 w-4" />
                    <span>Load State</span>
                </button>
            </div>

            <button
                onClick={onExportPDF}
                className="flex items-center space-x-2 px-4 py-2 rounded-sm bg-cyan-600/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all duration-200 group"
                aria-label="Generate Report"
            >
                <PrintIcon className="h-4 w-4 group-hover:animate-pulse" />
                <span className="text-xs font-bold font-mono tracking-wider">EXPORT DOSSIER</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
