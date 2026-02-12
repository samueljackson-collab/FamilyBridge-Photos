
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { getFileIcon } from '../utils/fileUtils';

interface PhotoGridProps {
  files: File[];
  selectedFiles: Set<File>;
  onToggleSelection: (file: File) => void;
  onViewDetails: (file: File) => void;
  highlightedFile: File | null;
  refsMap: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
}

const ImagePreview: React.FC<{ 
  url: string; 
  position: { x: number; y: number }; 
  scale: number;
  panPosition: { x: number; y: number };
}> = ({ url, position, scale, panPosition }) => {
  const [showHint, setShowHint] = useState(false);
  const hasShownHintBefore = useRef(sessionStorage.getItem('zoomHintShown') === 'true');

  useEffect(() => {
    if (!hasShownHintBefore.current) {
        setShowHint(true);
        const timer = setTimeout(() => {
            setShowHint(false);
            sessionStorage.setItem('zoomHintShown', 'true');
            hasShownHintBefore.current = true;
        }, 2500);
        return () => clearTimeout(timer);
    }
  }, []);

  const PREVIEW_SIZE = 300;
  const overflow = PREVIEW_SIZE * (scale - 1);
  const translateX = -overflow * (panPosition.x - 0.5);
  const translateY = -overflow * (panPosition.y - 0.5);

  return ReactDOM.createPortal(
    <div
      className="fixed z-50 pointer-events-none rounded-lg shadow-2xl overflow-hidden border-4 border-slate-500 transition-opacity duration-200 animate-fade-in"
      style={{
        top: position.y + 20,
        left: position.x + 20,
        width: `${PREVIEW_SIZE}px`,
        height: `${PREVIEW_SIZE}px`,
      }}
    >
      <img
        src={url}
        alt="Preview"
        className="w-full h-full object-cover max-w-none"
        style={{
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transition: 'transform 0.1s linear',
        }}
      />
      {showHint && scale === 1 && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none animate-fade-in">
            <div className="bg-slate-900/80 text-white text-lg px-4 py-2 rounded-lg flex items-center gap-3 border border-slate-600">
                <i className="fas fa-search-plus"></i>
                <span>Scroll to Zoom</span>
            </div>
        </div>
      )}
    </div>,
    document.body
  );
};

const PhotoGridItem: React.FC<{
  file: File;
  isSelected: boolean;
  isHighlighted: boolean;
  onToggleSelection: () => void;
  onView: () => void;
  itemRef: (el: HTMLDivElement | null) => void;
  isFocusable: boolean;
}> = ({ file, isSelected, isHighlighted, onToggleSelection, onView, itemRef, isFocusable }) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const url = (isImage || isVideo) ? URL.createObjectURL(file) : null;
  
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ x: 0, y: 0 });
  const [previewScale, setPreviewScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0.5, y: 0.5 });
  const checkboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      return () => {
          if (url) {
              URL.revokeObjectURL(url);
          }
      }
  }, [url]);

  const handleContainerFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    // This handler is for when the parent grid focuses the container.
    // We immediately delegate focus to the interactive checkbox inside.
    if (e.target === e.currentTarget && checkboxRef.current) {
      checkboxRef.current.focus();
    }
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleSelection();
  };
  const handleCheckboxKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        onToggleSelection();
    } else if (e.key === 'Enter') {
        e.stopPropagation();
        onView();
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setPreviewPosition({ x: e.clientX, y: e.clientY });
    if (previewScale > 1) {
        const item = e.currentTarget as HTMLDivElement;
        const rect = item.getBoundingClientRect();
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        setPanPosition({ x, y });
    }
  };

  const handleMouseLeave = () => {
    setIsPreviewVisible(false);
    setPreviewScale(1);
    setPanPosition({ x: 0.5, y: 0.5 });
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (isPreviewVisible) {
      e.preventDefault();
      e.stopPropagation();
      const newScale = previewScale - e.deltaY * 0.002;
      setPreviewScale(Math.min(Math.max(newScale, 1), 5));
    }
  };

  return (
    <>
      <div
        ref={itemRef}
        onClick={onView}
        onMouseEnter={() => isImage && setIsPreviewVisible(true)}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        className={`relative group aspect-square rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform cursor-pointer border border-slate-800 ${isSelected ? 'ring-8 ring-blue-500 scale-95' : 'hover:border-slate-600'} ${isHighlighted ? 'ring-8 ring-yellow-400 animate-pulse' : ''} focus:outline-none`}
        tabIndex={-1}
        onFocus={handleContainerFocus}
        role="gridcell"
        aria-selected={isSelected}
      >
        {isImage && url ? (
          <img 
            src={url} 
            alt={`Preview of ${file.name}`} 
            className={`w-full h-full object-cover transition-transform duration-300 ${!isSelected ? 'group-hover:scale-110' : ''}`}
          />
        ) : isVideo && url ? (
          <div className="w-full h-full bg-black flex items-center justify-center">
            <video
              src={url}
              muted
              loop
              playsInline
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              onMouseEnter={e => e.currentTarget.play().catch(() => { /* Silently fail */ })}
              onMouseLeave={e => e.currentTarget.pause()}
            />
            <div className="absolute inset-0 flex items-center justify-center text-white text-6xl pointer-events-none opacity-80 group-hover:opacity-0 transition-opacity duration-300">
                <i className="fas fa-play-circle"></i>
            </div>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center p-4 gap-3 text-center border-4 border-slate-700 rounded-2xl">
            <i className={`${getFileIcon(file)} text-7xl text-slate-400`} aria-hidden="true"></i>
            <p className="text-lg font-semibold text-slate-200 break-all px-1" title={file.name}>{file.name}</p>
          </div>
        )}
        
        <div className={`absolute inset-0 bg-black transition-opacity duration-300 pointer-events-none ${isSelected ? 'opacity-40' : 'opacity-0 group-hover:opacity-20'}`}></div>

        <div
          ref={checkboxRef}
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`Select file ${file.name}`}
          tabIndex={isFocusable ? 0 : -1}
          onClick={handleCheckboxClick}
          onKeyDown={handleCheckboxKeyDown}
          className={`absolute top-3 left-3 w-10 h-10 rounded-full flex items-center justify-center text-2xl border-2 transition-all duration-300 bg-slate-900/60 backdrop-blur-sm cursor-pointer
            ${isSelected ? 'bg-blue-600 border-blue-400' : 'border-white/60'} focus:outline-none focus:ring-8 focus:ring-yellow-400`}
        >
          {isSelected && <i className="fas fa-check text-white pointer-events-none"></i>}
        </div>
      </div>
      {isImage && url && isPreviewVisible && <ImagePreview url={url} position={previewPosition} scale={previewScale} panPosition={panPosition} />}
    </>
  );
};


export const FileList: React.FC<PhotoGridProps> = ({ files, selectedFiles, onToggleSelection, onViewDetails, highlightedFile, refsMap }) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setFocusedIndex(0);
  }, [files]);

  useEffect(() => {
    if (gridRef.current && gridRef.current.contains(document.activeElement)) {
        const file = files[focusedIndex];
        if (file) {
            const key = file.name + file.lastModified;
            refsMap.current.get(key)?.focus();
        }
    }
  }, [focusedIndex, files]);
  
  const getNumColumns = () => {
    if (!gridRef.current) return 6; // Default fallback
    const gridStyle = window.getComputedStyle(gridRef.current);
    return gridStyle.getPropertyValue("grid-template-columns").split(" ").length;
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let newIndex = focusedIndex;
    const numFiles = files.length;
    if (numFiles === 0) return;
    const numCols = getNumColumns();

    switch (e.key) {
        case 'ArrowRight':
            newIndex = (focusedIndex + 1) % numFiles;
            break;
        case 'ArrowLeft':
            newIndex = (focusedIndex - 1 + numFiles) % numFiles;
            break;
        case 'ArrowDown':
            newIndex = Math.min(focusedIndex + numCols, numFiles - 1);
            break;
        case 'ArrowUp':
            newIndex = Math.max(focusedIndex - numCols, 0);
            break;
        default:
            return;
    }
    
    if (newIndex !== focusedIndex) {
      e.preventDefault();
      setFocusedIndex(newIndex);
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center bg-slate-900 p-12 rounded-3xl flex flex-col items-center border-2 border-slate-800">
        <i className="fas fa-inbox text-8xl text-slate-600 mb-6"></i>
        <h2 className="text-5xl font-bold text-slate-300">No Files Found</h2>
        <p className="text-3xl mt-4 text-slate-500">Try adjusting your search or filters, or add new files.</p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      onKeyDown={handleKeyDown}
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8"
      role="grid"
      aria-label="Photo gallery"
    >
      {files.map((file, index) => {
          const key = file.name + file.lastModified;
          return (
            <PhotoGridItem 
              key={key} 
              file={file}
              isSelected={selectedFiles.has(file)}
              isHighlighted={file === highlightedFile}
              onToggleSelection={() => onToggleSelection(file)}
              onView={() => onViewDetails(file)}
              itemRef={el => refsMap.current.set(key, el)}
              isFocusable={index === focusedIndex}
            />
          );
      })}
    </div>
  );
};
