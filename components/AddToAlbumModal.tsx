
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface AddToAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  albums: Map<string, Set<File>>;
  onCreateAlbum: (albumName: string) => boolean;
  onAddToAlbum: (albumName: string) => void;
}

export const AddToAlbumModal: React.FC<AddToAlbumModalProps> = ({ isOpen, onClose, albums, onCreateAlbum, onAddToAlbum }) => {
  const [newAlbumName, setNewAlbumName] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        setNewAlbumName('');
        setError('');

        const modalNode = modalRef.current;
        if (!modalNode) return;
        
        const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlbumName.trim()) {
      setError('Album name cannot be empty.');
      return;
    }
    const success = onCreateAlbum(newAlbumName.trim());
    if (success) {
      onAddToAlbum(newAlbumName.trim());
    } else {
      setError('An album with this name already exists.');
    }
  };

  const sortedAlbumNames = Array.from(albums.keys()).sort((a: string, b: string) => a.localeCompare(b));

  return ReactDOM.createPortal(
    <div 
        className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
        onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="add-to-album-title"
    >
      <div 
        ref={modalRef}
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl p-8 sm:p-12"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h2 id="add-to-album-title" className="text-5xl font-bold text-slate-100">Add to Album</h2>
          <button onClick={onClose} className="text-5xl text-slate-400 hover:text-white transition-colors" aria-label="Close">&times;</button>
        </div>

        <div className="my-8 p-6 bg-slate-800 rounded-xl border border-slate-700">
            <h3 className="text-3xl font-bold text-slate-200 mb-4">Create a new album</h3>
            <form onSubmit={handleCreate} className="flex items-center gap-4">
                <input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => { setNewAlbumName(e.target.value); setError(''); }}
                    placeholder="New album name..."
                    className="flex-grow w-full p-4 text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    aria-label="New album name"
                />
                <button type="submit" className="text-2xl py-4 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">Create & Add</button>
            </form>
            {error && <p className="text-red-400 text-xl mt-3">{error}</p>}
        </div>
        
        {sortedAlbumNames.length > 0 && (
            <div>
                <h3 className="text-3xl font-bold text-slate-200 mb-4">Or add to existing</h3>
                <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                    {sortedAlbumNames.map(name => (
                        <button 
                            key={name}
                            onClick={() => onAddToAlbum(name)}
                            className="w-full text-left p-4 text-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg transition-colors"
                        >
                            {name} <span className="text-slate-400">({albums.get(name)?.size || 0})</span>
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>,
    document.body
  );
};
