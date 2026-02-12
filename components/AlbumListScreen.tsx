
import React, { useState, useMemo, useEffect } from 'react';

interface AlbumListScreenProps {
    albums: Map<string, Set<File>>;
    onCreateAlbum: (albumName: string) => boolean;
    onViewAlbum: (albumName: string) => void;
}

const AlbumCover: React.FC<{ albumFiles: Set<File> }> = ({ albumFiles }) => {
    const coverFile = useMemo(() => {
        return Array.from(albumFiles).find((file: File) => file.type.startsWith('image/')) || Array.from(albumFiles)[0];
    }, [albumFiles]);

    const url = useMemo(() => {
        if (coverFile && (coverFile.type.startsWith('image/') || coverFile.type.startsWith('video/'))) {
            return URL.createObjectURL(coverFile);
        }
        return null;
    }, [coverFile]);

    useEffect(() => {
        return () => {
            if (url) URL.revokeObjectURL(url);
        };
    }, [url]);

    if (url && coverFile?.type.startsWith('image/')) {
        return <img src={url} alt="Album cover" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />;
    }
    if (url && coverFile?.type.startsWith('video/')) {
        return <video src={url} muted className="w-full h-full object-cover" />;
    }
    return (
        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
            <i className="fas fa-photo-video text-7xl text-slate-600"></i>
        </div>
    );
};

export const AlbumListScreen: React.FC<AlbumListScreenProps> = ({ albums, onCreateAlbum, onViewAlbum }) => {
    const [newAlbumName, setNewAlbumName] = useState('');
    const [error, setError] = useState('');

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAlbumName.trim()) {
            setError('Album name cannot be empty.');
            return;
        }
        const success = onCreateAlbum(newAlbumName.trim());
        if (success) {
            setNewAlbumName('');
            setError('');
        } else {
            setError('An album with this name already exists.');
        }
    };

    const sortedAlbums = useMemo(() => {
        return Array.from(albums.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    }, [albums]);

    return (
        <div className="w-full animate-fade-in">
            <div className="mb-12 p-8 bg-slate-900 rounded-2xl border border-slate-800">
                <h2 className="text-5xl font-bold text-slate-100 mb-4">Create a New Album</h2>
                <form onSubmit={handleCreate} className="flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        value={newAlbumName}
                        onChange={(e) => { setNewAlbumName(e.target.value); setError(''); }}
                        placeholder="e.g., Summer Vacation 2024"
                        className="flex-grow w-full p-5 text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition"
                        aria-label="New album name"
                    />
                    <button type="submit" className="w-full sm:w-auto text-2xl py-5 px-8 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                        Create Album
                    </button>
                </form>
                {error && <p className="text-red-400 text-xl mt-3">{error}</p>}
            </div>

            {albums.size === 0 ? (
                 <div className="text-center bg-slate-900 p-12 rounded-3xl flex flex-col items-center border-2 border-slate-800">
                    <i className="fas fa-images text-8xl text-slate-600 mb-6"></i>
                    <h2 className="text-5xl font-bold text-slate-300">No Albums Yet</h2>
                    <p className="text-3xl mt-4 text-slate-500">Create your first album above to start organizing!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {sortedAlbums.map(([name, files]) => (
                        <div
                            key={name}
                            onClick={() => onViewAlbum(name)}
                            className="relative group aspect-square rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform cursor-pointer border-2 border-slate-800 hover:border-blue-500 hover:scale-105"
                            tabIndex={0}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onViewAlbum(name)}
                            aria-label={`View album: ${name}`}
                        >
                            <AlbumCover albumFiles={files} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                <h3 className="text-3xl font-bold text-white truncate">{name}</h3>
                                <p className="text-xl text-slate-300">{files.size} item(s)</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
