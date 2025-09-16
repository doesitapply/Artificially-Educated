
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-gray-700 mt-12 py-8">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8 text-center text-gray-500">
        <p className="text-sm">&copy; {new Date().getFullYear()} Manus AI. All rights reserved.</p>
        <p className="text-xs mt-2">This report is prepared for judicial review of Case No. 3:24-cv-00579-ART-CSD. Information presented is based on alleged events and claims.</p>
      </div>
    </footer>
  );
};

export default Footer;
