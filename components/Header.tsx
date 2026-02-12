
import React from 'react';

interface HeaderProps {
    onAddPhotosClick: () => void;
    onAddFromCameraClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onAddPhotosClick, onAddFromCameraClick }) => {
  const showHelp = () => {
    alert(
      'Welcome to FamilyBridge Photos!\n\n' +
      'How to Use:\n' +
      '1. Click "Add Photos" to upload your files.\n' +
      '2. Use the "Photos" and "Sharing" tabs to navigate.\n' +
      '3. In the gallery, hover over an item and use the checkbox to select it.\n' +
      '4. Use the toolbar at the top to Share, Download, or Delete selected files.\n' +
      '5. Switch between Grid and Map views to see your photos in different ways!'
    );
  };

  return (
    <header className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-6">
        <div className="text-left">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-100">
            FamilyBridge Photos
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-slate-400 mt-2">
            Your memories, beautifully organized.
          </p>
        </div>
        <div className="flex flex-col items-stretch sm:flex-row sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
           <button
            onClick={onAddPhotosClick}
            className="w-full sm:w-auto text-xl sm:text-2xl py-3 px-4 sm:py-4 sm:px-6 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <i className="fas fa-plus"></i>
            <span>Add Files</span>
          </button>
          <button
            onClick={onAddFromCameraClick}
            className="w-full sm:w-auto text-xl sm:text-2xl py-3 px-4 sm:py-4 sm:px-6 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
          >
            <i className="fas fa-camera"></i>
            <span>Use Camera</span>
          </button>
          <button
            onClick={showHelp}
            className="w-full sm:w-auto text-xl sm:text-2xl py-3 px-4 sm:py-4 sm:px-6 bg-slate-800 text-slate-200 font-semibold rounded-2xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-3"
            aria-label="Show help instructions"
          >
            <i className="fas fa-question-circle"></i>
            <span>Help</span>
          </button>
        </div>
      </div>
    </header>
  );
};
