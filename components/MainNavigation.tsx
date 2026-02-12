
import React from 'react';

export type MainView = 'PHOTOS' | 'SHARING' | 'ALBUMS';

interface MainNavigationProps {
  activeView: MainView;
  setActiveView: (view: MainView) => void;
}

const NavButton: React.FC<{
    label: string;
    icon: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
    return (
        <button 
            onClick={onClick}
            className={`flex-1 md:flex-none flex flex-col items-center justify-center gap-1 md:gap-2 py-2 md:py-4 text-base md:text-3xl font-bold transition-colors duration-300 md:px-12
                ${isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200'}
                border-t-4 md:border-t-0 md:border-b-8
                ${isActive ? 'border-blue-400' : 'border-transparent md:hover:border-slate-700'}`}
            aria-current={isActive ? 'page' : undefined}
        >
            <i className={`fas ${icon} text-2xl md:text-3xl`}></i>
            <span>{label}</span>
        </button>
    );
}

export const MainNavigation: React.FC<MainNavigationProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around md:relative md:max-w-4xl md:mx-auto md:mt-8 md:justify-center bg-slate-900/90 backdrop-blur-sm border-t border-slate-700 md:border md:border-slate-800 md:rounded-2xl shadow-lg">
      <NavButton
        label="Photos"
        icon="fa-images"
        isActive={activeView === 'PHOTOS'}
        onClick={() => setActiveView('PHOTOS')}
      />
       <NavButton
        label="Albums"
        icon="fa-photo-video"
        isActive={activeView === 'ALBUMS'}
        onClick={() => setActiveView('ALBUMS')}
      />
      <NavButton
        label="Sharing"
        icon="fa-share-alt"
        isActive={activeView === 'SHARING'}
        onClick={() => setActiveView('SHARING')}
      />
    </nav>
  );
};
