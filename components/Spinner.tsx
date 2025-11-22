
import React from 'react';

const Spinner: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999] print:hidden" aria-label="Loading..." role="status">
    <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-brand-green rounded-full animate-spin"></div>
  </div>
);

export default Spinner;
