
import React, { useState } from 'react';
import { reportSections, timelineData } from './constants';
import { documents } from '../public/documents';
import type { ReportSection } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Timeline from './components/Timeline';
import SectionContent from './components/SectionContent';
import Footer from './components/Footer';
import DocumentViewer from './components/DocumentViewer';

const App: React.FC = () => {
  const [activeSectionId, setActiveSectionId] = useState<string>('timeline');

  const activeSection = reportSections.find(s => s.id === activeSectionId) || reportSections[0];

  const renderMainContent = () => {
    switch (activeSectionId) {
      case 'timeline':
        return <Timeline data={timelineData} />;
      case 'documents':
        return <DocumentViewer documents={documents} />;
      default:
        return <SectionContent section={activeSection} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-300">
      <Header />
      <div className="flex flex-col md:flex-row max-w-screen-2xl mx-auto p-4 md:p-8 gap-8">
        <Sidebar 
          sections={reportSections} 
          activeSectionId={activeSectionId} 
          setActiveSectionId={setActiveSectionId} 
        />
        <main className="flex-1 min-w-0">
          {renderMainContent()}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default App;
