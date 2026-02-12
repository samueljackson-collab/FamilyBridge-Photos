
import React, { useMemo, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface MemoryViewerModalProps {
    files: File[];
    memoryDate: Date;
    onClose: () => void;
    onStartSlideshow: () => void;
    onShare: () => void;
}

const Thumbnail: React.FC<{ file: File }> = ({ file }) => {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    useEffect(() => {
        return () => URL.revokeObjectURL(url);
    }, [url]);

    return (
        <div className="relative aspect-square rounded-xl overflow-hidden shadow-lg border-2 border-slate-700">
            <img src={url} alt={file.name} className="w-full h-full object-cover" />
        </div>
    );
};


export const MemoryViewerModal: React.FC<MemoryViewerModalProps> = ({
    files,
    memoryDate,
    onClose,
    onStartSlideshow,
    onShare,
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    const title = useMemo(() => {
        const today = new Date();
        const yearsAgo = today.getFullYear() - memoryDate.getFullYear();
        
        if (yearsAgo === 1) {
            return `On this day, 1 year ago...`;
        }
        return `On this day, ${yearsAgo} years ago...`;
    }, [memoryDate]);
    
    const subtitle = useMemo(() => {
        return memoryDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }, [memoryDate]);

    useEffect(() => {
        const modalNode = modalRef.current;
        if (!modalNode) return;

        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) { lastElement?.focus(); e.preventDefault(); }
                } else {
                    if (document.activeElement === lastElement) { firstElement?.focus(); e.preventDefault(); }
                }
            }
        };

        firstElement?.focus();
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);
    
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[2500] bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="memory-viewer-title"
        >
            <div
                ref={modalRef}
                className="bg-slate-900 w-full h-full p-4 sm:rounded-3xl sm:border sm:border-slate-700 sm:max-w-4xl sm:h-auto sm:max-h-[90vh] sm:p-8 flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="text-center mb-6 flex-shrink-0">
                    <h2 id="memory-viewer-title" className="text-4xl sm:text-6xl font-bold text-slate-100">{title}</h2>
                    <p className="text-2xl sm:text-3xl text-slate-400 mt-2">{subtitle}</p>
                </div>
                
                <div className="flex-grow overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 p-2 -mr-2">
                    {files.map(file => (
                        <Thumbnail key={`${file.name}-${file.lastModified}`} file={file} />
                    ))}
                </div>

                <div className="flex-shrink-0 pt-6 mt-4 border-t-2 border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onStartSlideshow} 
                            className="text-xl sm:text-2xl py-3 px-6 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-transform transform hover:scale-105 flex items-center gap-3"
                        >
                            <i className="fas fa-play-circle"></i>
                            <span>View as Slideshow</span>
                        </button>
                         <button 
                            onClick={onShare} 
                            className="text-xl sm:text-2xl py-3 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center gap-3"
                        >
                            <i className="fas fa-share-square"></i>
                            <span>Share All</span>
                        </button>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-xl sm:text-2xl py-3 px-6 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
