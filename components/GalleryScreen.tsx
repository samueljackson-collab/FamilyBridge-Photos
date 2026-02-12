
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileList as PhotoGrid } from './FileList';
import { MapView, PhotoPoint } from './MapView';
import { PhotoDetailScreen } from './PhotoDetailScreen';
import { getFileTypeCategory, FileType, extractPhotoMetadata, PhotoMetadata } from '../utils/fileUtils';
import { UploadIndicator } from './UploadIndicator';
import { OfflineIndicator } from './OfflineIndicator';
import { ConfirmationModal } from './ConfirmationModal';
import { AddToAlbumModal } from './AddToAlbumModal';
import { MemoryViewerModal } from './MemoryViewerModal';

interface GalleryScreenProps {
  files: File[];
  albumName?: string | null;
  onExitAlbumView?: () => void;
  albums: Map<string, Set<File>>;
  onCreateAlbum: (albumName: string) => boolean;
  onAddToAlbum: (albumName: string, files: File[]) => void;
  customLocations: Map<string, { latitude: number; longitude: number }>;
  onLocationUpdate: (file: File, location: { latitude: number; longitude: number }) => void;
  customTags: Map<string, string[]>;
  onUpdateTags: (file: File, tags: string[]) => void;
  onDeleteFiles: (files: File[]) => void;
  onShare: (files: File[]) => void;
  isUploading: boolean;
  onAddPhotosClick: () => void;
  onStartSlideshow: (files: File[]) => void;
}

type SortCriteria = 'date-desc' | 'date-asc' | 'size-desc' | 'size-asc' | 'name-asc' | 'name-desc' | 'datetaken-desc' | 'datetaken-asc';

const SelectionToolbar: React.FC<{
  selectedCount: number;
  onShare: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
  onAddToAlbum: () => void;
}> = ({ selectedCount, onShare, onDownload, onDelete, onClear, onAddToAlbum }) => {
  return (
    <div className="sticky top-4 z-20 w-full bg-slate-900/80 backdrop-blur-md p-2 sm:p-4 rounded-2xl shadow-lg border border-slate-700 flex justify-between items-center mb-8 transition-all animate-fade-in">
        <button onClick={onClear} className="text-xl sm:text-2xl text-slate-300 hover:text-white transition-colors flex items-center gap-2 sm:gap-3 p-2">
            <i className="fas fa-times"></i>
            <span>{selectedCount} Selected</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={onAddToAlbum} className="text-xl sm:text-2xl py-2 px-3 sm:py-3 sm:px-6 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center gap-2" aria-label={`Add ${selectedCount} selected files to an album`}>
                <i className="fas fa-plus-square"></i>
                <span className="hidden sm:inline">Add to Album</span>
            </button>
            <button onClick={onShare} className="text-xl sm:text-2xl py-2 px-3 sm:py-3 sm:px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center gap-2" aria-label={`Share ${selectedCount} selected files`}>
                <i className="fas fa-share-square"></i>
                <span className="hidden sm:inline">Share</span>
            </button>
            <button onClick={onDownload} className="text-xl sm:text-2xl py-2 px-3 sm:py-3 sm:px-6 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-transform transform hover:scale-105 flex items-center gap-2" aria-label={`Download ${selectedCount} selected files`}>
                <i className="fas fa-download"></i>
                <span className="hidden sm:inline">Download</span>
            </button>
            <button onClick={onDelete} className="text-xl sm:text-2xl py-2 px-3 sm:py-3 sm:px-6 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-transform transform hover:scale-105 flex items-center gap-2" aria-label={`Delete ${selectedCount} selected files`}>
                <i className="fas fa-trash-alt"></i>
                <span className="hidden sm:inline">Delete</span>
            </button>
        </div>
    </div>
  );
};

const FileIconLegend = () => (
  <div className="bg-slate-800/50 p-4 sm:p-6 rounded-2xl border border-slate-700 flex flex-wrap justify-center items-center gap-x-4 sm:gap-x-8 gap-y-2 sm:gap-y-4 mb-8">
    <h3 className="text-lg sm:text-2xl font-bold text-slate-300 mr-4 hidden sm:block">File Types:</h3>
    <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl text-slate-300"><i className="fas fa-file-image w-6 sm:w-8 text-center text-blue-300"></i><span>Image</span></div>
    <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl text-slate-300"><i className="fas fa-file-video w-6 sm:w-8 text-center text-purple-300"></i><span>Video</span></div>
    <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl text-slate-300"><i className="fas fa-file-pdf w-6 sm:w-8 text-center text-red-300"></i><span>PDF</span></div>
    <div className="flex items-center gap-2 sm:gap-3 text-base sm:text-xl text-slate-300"><i className="fas fa-file w-6 sm:w-8 text-center text-slate-400"></i><span>Other</span></div>
  </div>
);

const EmptyGallery: React.FC<{ onAddPhotosClick: () => void; isAlbumView: boolean }> = ({ onAddPhotosClick, isAlbumView }) => (
    <div className="text-center bg-slate-900 p-8 sm:p-12 rounded-3xl flex flex-col items-center border-2 border-dashed border-slate-700 hover:border-blue-500 transition-colors duration-300">
        <i className={`fas ${isAlbumView ? 'fa-photo-video' : 'fa-cloud-upload-alt'} text-7xl sm:text-8xl text-slate-500 mb-6`}></i>
        <h2 className="text-4xl sm:text-5xl font-bold text-slate-300">{isAlbumView ? 'This Album is Empty' : 'Your Library is Empty'}</h2>
        <p className="text-2xl sm:text-3xl mt-4 text-slate-500 max-w-2xl">
            {isAlbumView ? 'Add photos to this album from your main library.' : 'Drag and drop files anywhere to upload, or click the button below to get started.'}
        </p>
        {!isAlbumView && (
          <button
              onClick={onAddPhotosClick}
              className="mt-8 sm:mt-10 text-2xl sm:text-3xl py-4 px-8 sm:py-6 sm:px-12 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center gap-4"
          >
              <i className="fas fa-plus"></i>
              <span>Select Files</span>
          </button>
        )}
    </div>
);


export const GalleryScreen: React.FC<GalleryScreenProps> = ({ files, albumName, onExitAlbumView, albums, onCreateAlbum, onAddToAlbum, customLocations, onLocationUpdate, customTags, onUpdateTags, onDeleteFiles, onShare, isUploading, onAddPhotosClick, onStartSlideshow }) => {
  const [selectedFiles, setSelectedFiles] = useState<Set<File>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [isHeatmapMode, setIsHeatmapMode] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<FileType | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [filterByLocation, setFilterByLocation] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<SortCriteria>('datetaken-desc');
  const [detailedFile, setDetailedFile] = useState<File | null>(null);
  const [highlightedFile, setHighlightedFile] = useState<File | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDownloadConfirmOpen, setIsDownloadConfirmOpen] = useState(false);
  const [isAddToAlbumModalOpen, setIsAddToAlbumModalOpen] = useState(false);
  const [metadataCache, setMetadataCache] = useState<Map<File, PhotoMetadata>>(new Map());
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [centerOnPhotoPoint, setCenterOnPhotoPoint] = useState<PhotoPoint | null>(null);
  const [memory, setMemory] = useState<{ files: File[]; date: Date } | null>(null);
  const photoGridItemRefs = useRef(new Map<string, HTMLDivElement | null>());

  const prevIsUploadingRef = useRef(isUploading);
  const prevFilesRef = useRef(files);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  useEffect(() => {
    if (prevIsUploadingRef.current && !isUploading) {
      const prevFileKeys = new Set(prevFilesRef.current.map((f) => `${f.name}|${f.size}`));
      const newFiles = files.filter((f) => !prevFileKeys.has(`${f.name}|${f.size}`));

      if (newFiles.length > 0) {
        const newFilesSet = new Set(newFiles);
        setSelectedFiles(newFilesSet);
        
        const timer = setTimeout(() => {
          setSelectedFiles(currentSelection => {
            // FIX: Using `Array.from` ensures the `file` parameter in `.every()` is correctly typed as `File`, resolving an issue where it was inferred as `unknown`.
            const isSameSelection = currentSelection.size === newFilesSet.size && 
                                   Array.from(currentSelection).every((file: File) => newFilesSet.has(file));
            // FIX: Explicitly typing `new Set<File>()` matches the state's type `Set<File>`, preventing a type mismatch when creating an empty set.
            return isSameSelection ? new Set<File>() : currentSelection;
          });
        }, 10000);
        
        return () => clearTimeout(timer);
      }
    }
    prevIsUploadingRef.current = isUploading;
    prevFilesRef.current = files;
  }, [files, isUploading]);

  useEffect(() => {
    const loadMetadata = async () => {
      const allFiles = Array.from(new Set(files));
      if (allFiles.length === 0) {
        setMetadataCache(new Map());
        setIsLoadingMetadata(false);
        return;
      }
      setIsLoadingMetadata(true);
      const newCache = new Map<File, PhotoMetadata>();
      const promises = allFiles.map(async (file) => {
        const metadata = await extractPhotoMetadata(file);
        newCache.set(file, metadata);
      });
      await Promise.all(promises);
      setMetadataCache(newCache);
      setIsLoadingMetadata(false);
    };
    loadMetadata();
  }, [files]);

  const allAvailableTags = useMemo(() => {
    const tagCounts = new Map<string, number>();
    files.forEach(file => {
      const fileKey = `${file.name}-${file.lastModified}`;
      const meta = metadataCache.get(file);
      const fileTags = new Set([...(meta?.keywords || []), ...(customTags.get(fileKey) || [])]);
      fileTags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      });
    });
    return Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
  }, [files, metadataCache, customTags]);


  const processedFiles = useMemo(() => {
    const filtered = files.filter(file => {
      const typeMatch = fileTypeFilter === 'all' || getFileTypeCategory(file) === fileTypeFilter;
      
      const fileKey = `${file.name}-${file.lastModified}`;
      const metadata = metadataCache.get(file);
      const tags = customTags.get(fileKey) || [];
      const allKeywords = [...(metadata?.keywords || []), ...tags];
      
      const searchTermLower = searchTerm.toLowerCase();
      const searchMatch = searchTermLower === '' ||
        file.name.toLowerCase().includes(searchTermLower) ||
        (metadata?.cameraModel && metadata.cameraModel.toLowerCase().includes(searchTermLower)) ||
        (metadata?.cameraMake && metadata.cameraMake.toLowerCase().includes(searchTermLower)) ||
        (metadata?.lensModel && metadata.lensModel.toLowerCase().includes(searchTermLower)) ||
        (metadata?.description && metadata.description.toLowerCase().includes(searchTermLower)) ||
        (allKeywords.some(k => k.toLowerCase().includes(searchTermLower)));
      
      const customLocation = customLocations.get(fileKey);
      const locationMatch = !filterByLocation || !!metadata?.gps || !!customLocation;

      const dateMatch = (() => {
        if (!dateRange.start && !dateRange.end) return true;
        const fileDate = metadataCache.get(file)?.dateTaken || new Date(file.lastModified);
        if (dateRange.start) {
            const startDate = new Date(`${dateRange.start}T00:00:00`);
            if (fileDate < startDate) return false;
        }
        if (dateRange.end) {
            const endDate = new Date(`${dateRange.end}T00:00:00`);
            endDate.setDate(endDate.getDate() + 1);
            if (fileDate >= endDate) return false;
        }
        return true;
      })();

      return typeMatch && searchMatch && locationMatch && dateMatch;
    });

    const sortable: File[] = [...filtered];
    switch (sortCriteria) {
        case 'datetaken-desc': sortable.sort((a: File, b: File) => { const dateA = metadataCache.get(a)?.dateTaken?.getTime(); const dateB = metadataCache.get(b)?.dateTaken?.getTime(); if (dateA && dateB) return dateB - dateA; if (dateA && !dateB) return -1; if (!dateA && dateB) return 1; return b.lastModified - a.lastModified; }); break;
        case 'datetaken-asc': sortable.sort((a: File, b: File) => { const dateA = metadataCache.get(a)?.dateTaken?.getTime(); const dateB = metadataCache.get(b)?.dateTaken?.getTime(); if (dateA && dateB) return dateA - dateB; if (dateA && !dateB) return -1; if (!dateA && dateB) return 1; return a.lastModified - b.lastModified; }); break;
        case 'date-asc': sortable.sort((a: File, b: File) => a.lastModified - b.lastModified); break;
        case 'size-desc': sortable.sort((a: File, b: File) => b.size - a.size); break;
        case 'size-asc': sortable.sort((a: File, b: File) => a.size - b.size); break;
        case 'name-asc': sortable.sort((a: File, b: File) => a.name.localeCompare(b.name)); break;
        case 'name-desc': sortable.sort((a: File, b: File) => b.name.localeCompare(a.name)); break;
        case 'date-desc': default: sortable.sort((a: File, b: File) => b.lastModified - a.lastModified); break;
    }
    return sortable;
  }, [files, searchTerm, fileTypeFilter, sortCriteria, filterByLocation, metadataCache, customLocations, customTags, dateRange]);

  const photoPointsForMap = useMemo<PhotoPoint[]>(() => {
    return files.map((file): PhotoPoint | null => {
            const metadata = metadataCache.get(file);
            const key = `${file.name}-${file.lastModified}`;
            const customLocation = customLocations.get(key);
            const gps = customLocation || metadata?.gps;
            if (gps) {
                return { file: file, position: [gps.latitude, gps.longitude] as [number, number], exif: { dateTaken: metadata?.dateTaken, cameraModel: metadata?.cameraModel, cameraMake: metadata?.cameraMake, lensModel: metadata?.lensModel, gpsDate: metadata?.gpsDate, } };
            }
            return null;
        }).filter((p): p is PhotoPoint => p !== null);
  }, [files, metadataCache, customLocations]);
  
  useEffect(() => { setSelectedFiles(new Set()); }, [searchTerm, fileTypeFilter, filterByLocation, dateRange, albumName]);
  useEffect(() => { if (highlightedFile) { const timer = setTimeout(() => { setHighlightedFile(null); }, 3000); return () => clearTimeout(timer); } }, [highlightedFile]);

  const handleToggleSelection = (file: File) => { const newSelection = new Set(selectedFiles); if (newSelection.has(file)) newSelection.delete(file); else newSelection.add(file); setSelectedFiles(newSelection); };
  const handleViewDetails = (file: File) => { setDetailedFile(file); };
  
  const handleShowInGallery = (file: File) => {
    if (albumName && onExitAlbumView) onExitAlbumView();
    setViewMode('grid'); setDetailedFile(null); setHighlightedFile(file);
    setTimeout(() => { const key = file.name + file.lastModified; const el = photoGridItemRefs.current.get(key); if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus({ preventScroll: true }); } }, 100);
  };
  
  const handleShowOnMap = (file: File) => { const point = photoPointsForMap.find(p => p.file === file); if (point) { setCenterOnPhotoPoint(point); setViewMode('map'); setDetailedFile(null); } };
  const handleSelectInGallery = (filesToSelect: File[]) => { setViewMode('grid'); setSelectedFiles(new Set(filesToSelect)); };

  const initiateDownload = () => { Array.from(selectedFiles).forEach((file: File) => { const url = URL.createObjectURL(file); const a = document.createElement('a'); a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }); setIsDownloadConfirmOpen(false); };
  const handleDownloadSelected = () => { if (selectedFiles.size > 5) { setIsDownloadConfirmOpen(true); } else { initiateDownload(); } };
  const handleDeleteSelected = () => { if (selectedFiles.size > 0) { setIsDeleteConfirmOpen(true); } };
  const confirmDeletion = () => { const filesToDelete = Array.from(selectedFiles); onDeleteFiles(filesToDelete); setSelectedFiles(new Set()); setIsDeleteConfirmOpen(false); };
  const handleShareSelected = () => onShare(Array.from(selectedFiles));

  const handleFindMemories = () => {
    const today = new Date();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();
    const todayYear = today.getFullYear();

    const memoriesByDate = new Map<string, { files: File[], date: Date }>();

    files.forEach(file => {
        const meta = metadataCache.get(file);
        const dateTaken = meta?.dateTaken;
        if (dateTaken) {
            const fileMonth = dateTaken.getMonth();
            const fileDate = dateTaken.getDate();
            const fileYear = dateTaken.getFullYear();

            if (fileMonth === todayMonth && fileDate === todayDate && fileYear < todayYear) {
                const dateKey = dateTaken.toISOString().split('T')[0];
                if (!memoriesByDate.has(dateKey)) {
                    memoriesByDate.set(dateKey, { files: [], date: dateTaken });
                }
                memoriesByDate.get(dateKey)!.files.push(file);
            }
        }
    });

    if (memoriesByDate.size > 0) {
        // Show the most recent memory found.
        const sortedMemories = Array.from(memoriesByDate.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
        setMemory(sortedMemories[0]);
    } else {
        alert("No memories found from this day in past years.");
    }
  };

  const ViewSwitcherButton: React.FC<{ mode: 'grid' | 'map', icon: string, label: string }> = ({ mode, icon, label }) => { const isActive = viewMode === mode; return (<button onClick={() => setViewMode(mode)} className={`px-4 py-3 text-xl sm:px-6 sm:py-4 sm:text-2xl rounded-xl transition-colors flex items-center gap-3 ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}><i className={icon}></i><span className="hidden sm:inline">{label}</span></button>); };
  const FilterButton: React.FC<{ filter: FileType | 'all', children: React.ReactNode }> = ({ filter, children }) => { const isActive = fileTypeFilter === filter; return (<button onClick={() => setFileTypeFilter(filter)} className={`px-3 sm:px-5 py-2 sm:py-3 text-lg sm:text-xl rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} aria-pressed={isActive}>{children}</button>); };

  const hasGeotaggedPhotos = photoPointsForMap.length > 0;

  if (detailedFile) {
    const key = `${detailedFile.name}-${detailedFile.lastModified}`;
    const customLocation = customLocations.get(key);
    const metadata = metadataCache.get(detailedFile);
    const augmentedMetadata = customLocation && metadata ? { ...metadata, gps: customLocation } : metadata;
    return <PhotoDetailScreen file={detailedFile} metadata={augmentedMetadata} onBack={() => setDetailedFile(null)} onShare={onShare} onShowOnMap={handleShowOnMap} onLocationUpdate={onLocationUpdate} customTags={customTags.get(key) || []} onUpdateTags={onUpdateTags} />;
  }

  return (
    <div className="w-full animate-fade-in">
      <ConfirmationModal isOpen={isDownloadConfirmOpen} onClose={() => setIsDownloadConfirmOpen(false)} onConfirm={initiateDownload} title="Confirm Download" message={`You are about to download ${selectedFiles.size} files. Are you sure?`} confirmText="Download" confirmVariant="primary" />
      <ConfirmationModal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} onConfirm={confirmDeletion} title="Confirm Deletion" message={ selectedFiles.size === 1 ? 'Are you sure you want to delete this file?' : `Are you sure you want to delete these ${selectedFiles.size} files?`} />
      <AddToAlbumModal isOpen={isAddToAlbumModalOpen} onClose={() => setIsAddToAlbumModalOpen(false)} albums={albums} onCreateAlbum={onCreateAlbum} onAddToAlbum={(albumName) => { onAddToAlbum(albumName, Array.from(selectedFiles)); setIsAddToAlbumModalOpen(false); setSelectedFiles(new Set()); }} />
      {memory && (
          <MemoryViewerModal
              files={memory.files}
              memoryDate={memory.date}
              onClose={() => setMemory(null)}
              onStartSlideshow={() => {
                  onStartSlideshow(memory.files);
                  setMemory(null);
              }}
              onShare={() => {
                  onShare(memory.files);
                  setMemory(null);
              }}
          />
      )}
      
      {selectedFiles.size > 0 && ( <SelectionToolbar selectedCount={selectedFiles.size} onShare={handleShareSelected} onDownload={handleDownloadSelected} onDelete={handleDeleteSelected} onClear={() => setSelectedFiles(new Set())} onAddToAlbum={() => setIsAddToAlbumModalOpen(true)} /> )}

      {albumName && onExitAlbumView && (
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 p-4 sm:p-6 bg-slate-900 rounded-2xl border border-slate-800 gap-4">
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-100 text-center sm:text-left"><i className="fas fa-photo-video text-blue-400 mr-2 sm:mr-4"></i>Album: <span className="text-white">{albumName}</span></h2>
            <button onClick={onExitAlbumView} className="text-xl sm:text-2xl py-3 px-6 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-colors flex items-center gap-2"><i className="fas fa-arrow-left"></i><span>Back to All Photos</span></button>
        </div>
      )}

      <details className="mb-8 group">
        <summary className="text-3xl font-bold text-slate-200 cursor-pointer p-6 bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center list-none">
          <span><i className="fas fa-filter mr-4 text-slate-400"></i>Filters & Sorting</span>
          <i className="fas fa-chevron-down transition-transform duration-300 group-open:rotate-180"></i>
        </summary>
        <div className="mt-4 p-6 bg-slate-900 rounded-2xl border border-slate-800 space-y-6">
            <div className="relative"><i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 text-2xl" aria-hidden="true"></i><input type="text" placeholder="Search by name, tag, camera..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-5 pl-14 text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition" aria-label="Search files by name, tag, or camera model" /></div>
            
            {allAvailableTags.length > 0 && (
              <div className="flex items-center gap-3 flex-wrap pt-4 border-t-2 border-slate-800">
                <i className="fas fa-tags text-2xl text-slate-400"></i>
                <span className="text-xl font-semibold text-slate-400">Filter by tag:</span>
                {allAvailableTags.slice(0, 15).map(tag => (
                  <button key={tag} onClick={() => setSearchTerm(tag)} className="px-4 py-2 text-lg bg-slate-700 text-slate-200 rounded-lg hover:bg-blue-600 transition-colors">{tag}</button>
                ))}
              </div>
            )}

            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 pt-4 border-t-2 border-slate-800">
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center"><span className="text-xl font-semibold text-slate-400 mr-2">Filter by type:</span><FilterButton filter="all">All</FilterButton><FilterButton filter="image">Images</FilterButton><FilterButton filter="video">Videos</FilterButton><FilterButton filter="pdf">PDFs</FilterButton><FilterButton filter="other">Others</FilterButton><button onClick={() => setFilterByLocation(prev => !prev)} className={`px-3 sm:px-5 py-2 sm:py-3 text-lg sm:text-xl rounded-lg transition-colors flex items-center gap-2 ${filterByLocation ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} aria-pressed={filterByLocation}><i className="fas fa-map-marker-alt"></i><span>Geotagged</span></button></div>
                <div className="flex items-center gap-4 sm:gap-6">
                    <div className="flex items-center gap-2"><label htmlFor="sort-criteria" className="text-xl font-semibold text-slate-400 flex items-center gap-2">{isLoadingMetadata ? (<i className="fas fa-spinner fa-spin"></i>) : (<i className="fas fa-sort-amount-down"></i>)}<span className="hidden sm:inline">{isLoadingMetadata ? 'Details...' : 'Sort by:'}</span></label><select id="sort-criteria" value={sortCriteria} onChange={e => setSortCriteria(e.target.value as SortCriteria)} disabled={isLoadingMetadata} className="px-4 py-3 text-xl bg-slate-700 text-slate-300 border border-transparent rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors hover:bg-slate-600 disabled:opacity-50" aria-label="Sort files"><option value="datetaken-desc">Date Taken (Newest)</option><option value="datetaken-asc">Date Taken (Oldest)</option><option value="date-desc">Date Added (Newest)</option><option value="date-asc">Date Added (Oldest)</option><option value="size-desc">Size (Largest)</option><option value="size-asc">Size (Smallest)</option><option value="name-asc">Name (A-Z)</option><option value="name-desc">Name (Z-A)</option></select></div>
                    <OfflineIndicator isOnline={isOnline} />
                </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap justify-center pt-4 border-t-2 border-slate-800" role="group" aria-labelledby="date-filter-label"><i className="fas fa-calendar-alt text-2xl text-slate-400"></i><span id="date-filter-label" className="text-xl font-semibold text-slate-400">Filter by date:</span><input type="date" aria-label="Start date" value={dateRange.start} onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))} className="px-3 sm:px-4 py-2 text-lg sm:text-xl rounded-lg bg-slate-950 border-2 border-slate-700 text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" style={{ colorScheme: 'dark' }} /><span className="text-xl text-slate-400">-</span><input type="date" aria-label="End date" value={dateRange.end} min={dateRange.start || undefined} onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))} className="px-3 sm:px-4 py-2 text-lg sm:text-xl rounded-lg bg-slate-950 border-2 border-slate-700 text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors" style={{ colorScheme: 'dark' }} />{(dateRange.start || dateRange.end) && (<button onClick={() => setDateRange({ start: '', end: '' })} className="px-4 py-3 text-xl rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors" aria-label="Clear date filter"><i className="fas fa-times"></i></button>)}</div>
            <div className="sr-only" aria-live="polite" role="status">{processedFiles.length} {processedFiles.length === 1 ? 'item' : 'items'} found.</div>
        </div>
      </details>
      
      {isUploading && <UploadIndicator />}

      {files.length > 0 ? (
        <>
            <FileIconLegend />

            <div className="flex justify-center items-center gap-4 mb-8">
                <ViewSwitcherButton mode="grid" icon="fas fa-th-large" label="Grid" />
                <div className="relative" title={!hasGeotaggedPhotos ? "No photos with location data found" : "View photos on map"}><button onClick={() => hasGeotaggedPhotos && setViewMode('map')} disabled={!hasGeotaggedPhotos || isLoadingMetadata} className={`px-4 py-3 text-xl sm:px-6 sm:py-4 sm:text-2xl rounded-xl transition-colors flex items-center gap-3 ${viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'} ${(!hasGeotaggedPhotos || isLoadingMetadata) ? 'opacity-50 cursor-not-allowed' : ''}`}><i className="fas fa-map-marked-alt"></i><span className="hidden sm:inline">Map</span></button></div>
                {hasGeotaggedPhotos && viewMode === 'map' && (
                    <button
                        onClick={() => setIsHeatmapMode(prev => !prev)}
                        className={`px-4 py-3 text-xl sm:px-6 sm:py-4 sm:text-2xl rounded-xl transition-colors flex items-center gap-3 ${isHeatmapMode ? 'bg-orange-600 text-white' : 'bg-sky-600 text-white'} hover:opacity-90 disabled:opacity-50`}
                        disabled={isLoadingMetadata}
                        title={isHeatmapMode ? "Map mode: Heatmap. Click to switch to Standard clusters." : "Map mode: Standard. Click to switch to Heatmap."}
                        aria-label={isHeatmapMode ? "Switch map to standard cluster view" : "Switch map to density heatmap view"}
                    >
                        <i className={`fas ${isHeatmapMode ? 'fa-fire' : 'fa-layer-group'}`}></i>
                        <span className="hidden sm:inline">{isHeatmapMode ? 'Heatmap' : 'Standard'}</span>
                    </button>
                )}
                <button onClick={handleFindMemories} disabled={isLoadingMetadata || files.length === 0} className="px-4 py-3 text-xl sm:px-6 sm:py-4 sm:text-2xl rounded-xl transition-colors flex items-center gap-3 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <i className="fas fa-magic"></i>
                    <span className="hidden sm:inline">Memories</span>
                </button>
                <button onClick={() => processedFiles.length > 0 && onStartSlideshow(processedFiles)} disabled={processedFiles.length === 0} className="px-4 py-3 text-xl sm:px-6 sm:py-4 sm:text-2xl rounded-xl transition-colors flex items-center gap-3 bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"><i className="fas fa-play-circle"></i><span className="hidden sm:inline">Slideshow</span></button>
            </div>

            {viewMode === 'grid' ? ( <PhotoGrid files={processedFiles} selectedFiles={selectedFiles} onToggleSelection={handleToggleSelection} onViewDetails={handleViewDetails} highlightedFile={highlightedFile} refsMap={photoGridItemRefs} /> ) : ( <div className="w-full h-[70vh] bg-slate-900 rounded-3xl p-2"><MapView photoPoints={photoPointsForMap} centerOn={centerOnPhotoPoint} onShowInGallery={handleShowInGallery} onViewDetails={handleViewDetails} isUploading={isUploading} isOnline={isOnline} metadataCache={metadataCache} onSelectInGallery={handleSelectInGallery} isHeatmapMode={isHeatmapMode} onHeatmapToggle={setIsHeatmapMode} /></div> )}
        </>
      ) : (
         !isUploading && <EmptyGallery onAddPhotosClick={onAddPhotosClick} isAlbumView={!!albumName} />
      )}
    </div>
  );
};
