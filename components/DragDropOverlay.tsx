
import React from 'react';

export const DragDropOverlay: React.FC = () => {
  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-fade-in"
      >
        <div className="w-11/12 h-11/12 max-w-7xl border-8 border-dashed border-blue-400 rounded-3xl flex flex-col items-center justify-center text-center animate-pulse-slow">
          <i className="fas fa-upload text-9xl text-blue-300 mb-8"></i>
          <h2 className="text-6xl font-bold text-white">Drop Files to Upload</h2>
          <p className="text-3xl text-slate-300 mt-4">Let go to add your memories.</p>
        </div>
      </div>
      <style>
          {`
            .animate-pulse-slow {
                animation: pulse-border 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            @keyframes pulse-border {
                50% {
                    opacity: .8;
                    border-color: #38bdf8; /* light-blue-400 */
                }
            }
          `}
      </style>
    </>
  );
};