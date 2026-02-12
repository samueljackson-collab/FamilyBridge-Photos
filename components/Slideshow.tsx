
import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { getFileIcon } from '../utils/fileUtils';

interface SlideshowProps {
  files: File[];
  onClose: () => void;
}

const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const Slideshow: React.FC<SlideshowProps> = ({ files, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(5000); // 5 seconds
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const timerRef = useRef<number | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const validFiles = useMemo(() => files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')), [files]);
  const currentFile = validFiles[currentIndex];
  const isVideo = currentFile?.type.startsWith('video/');

  const advance = (direction: 'next' | 'prev') => {
    const nextIndex = direction === 'next' 
        ? (currentIndex + 1) % validFiles.length 
        : (currentIndex - 1 + validFiles.length) % validFiles.length;
    setCurrentIndex(nextIndex);
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isPlaying && !isVideo) {
      timerRef.current = window.setTimeout(() => advance('next'), speed);
    }
  };

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, isPlaying, speed, isVideo]);

  const showControls = () => {
    setIsControlsVisible(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => setIsControlsVisible(false), 3000);
  };

  useEffect(() => {
    showControls();
    const handleKeyDown = (e: KeyboardEvent) => {
      showControls();
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') advance('next');
      if (e.key === 'ArrowLeft') advance('prev');
      if (e.key === ' ') { e.preventDefault(); setIsPlaying(p => !p); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', showControls);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', showControls);
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);
  
  const handleVideoEnded = () => {
    if (isPlaying) advance('next');
  };

  const url = useMemo(() => {
    if (currentFile) return URL.createObjectURL(currentFile);
    return null;
  }, [currentFile]);
  
  useEffect(() => {
    return () => { if (url) URL.revokeObjectURL(url); }
  }, [url]);

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[4000] bg-black flex items-center justify-center animate-fade-in" role="dialog" aria-modal="true">
      {currentFile ? (
        <div className="relative w-full h-full flex items-center justify-center">
            {validFiles.map((file, index) => (
                <div key={`${file.name}-${file.lastModified}`} className={`absolute inset-0 transition-opacity duration-700 ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}>
                    {index === currentIndex && (
                        file.type.startsWith('image/') && url ? (
                             <img src={url} alt={file.name} className="w-full h-full object-contain" />
                        ) : file.type.startsWith('video/') && url ? (
                            <video
                                ref={videoRef}
                                src={url}
                                autoPlay={isPlaying}
                                onEnded={handleVideoEnded}
                                controls={false}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                                <i className={`${getFileIcon(file)} text-9xl`}></i>
                            </div>
                        )
                    )}
                </div>
            ))}
        </div>
      ) : (
        <p className="text-white text-3xl">No viewable files in slideshow.</p>
      )}

      <div className={`absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex justify-between items-center">
          <p className="text-3xl text-white font-bold">{currentFile?.name || 'Slideshow'} ({currentIndex + 1} / {validFiles.length})</p>
          <button onClick={onClose} className="text-5xl text-white hover:text-slate-300 transition-colors" aria-label="Close slideshow">&times;</button>
        </div>
      </div>

      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${isControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center gap-8">
          <button onClick={() => advance('prev')} className="text-5xl text-white hover:text-slate-300 transition-colors" aria-label="Previous slide"><i className="fas fa-step-backward"></i></button>
          <button onClick={() => setIsPlaying(!isPlaying)} className="text-7xl text-white hover:text-slate-300 transition-colors" aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}>
            <i className={`fas ${isPlaying ? 'fa-pause-circle' : 'fa-play-circle'}`}></i>
          </button>
          <button onClick={() => advance('next')} className="text-5xl text-white hover:text-slate-300 transition-colors" aria-label="Next slide"><i className="fas fa-step-forward"></i></button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-6">
            <label htmlFor="speed-select" className="text-xl text-white">Speed:</label>
            <select
                id="speed-select"
                value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                className="px-3 py-1 text-xl bg-slate-800 text-white border border-slate-600 rounded-lg"
            >
                <option value={2000}>2s</option>
                <option value={5000}>5s</option>
                <option value={10000}>10s</option>
            </select>
        </div>
      </div>
    </div>,
    document.body
  );
};
