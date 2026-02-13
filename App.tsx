
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ShareScreen } from './components/ShareScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { Header } from './components/Header';
import { GalleryScreen } from './components/GalleryScreen';
import { MainNavigation, MainView } from './components/MainNavigation';
import { SharingHistoryScreen } from './components/SharingHistoryScreen';
import { DragDropOverlay } from './components/DragDropOverlay';
import { FileUploadScreen } from './components/FileUploadScreen';
import { AlbumListScreen } from './components/AlbumListScreen';
import { Slideshow } from './components/Slideshow';
import { ErrorBoundary } from './components/ErrorBoundary';
import type { SharedDetails } from './types';

const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff', 'image/heic', 'image/heif',
  'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo',
  'application/pdf',
]);
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ACCEPTED_FILE_INPUT = 'image/*,video/*,application/pdf';

export default function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [customLocations, setCustomLocations] = useState<Map<string, { latitude: number; longitude: number }>>(new Map());
  const [customTags, setCustomTags] = useState<Map<string, string[]>>(new Map());
  const [mainView, setMainView] = useState<MainView>('PHOTOS');

  // State for albums
  const [albums, setAlbums] = useState<Map<string, Set<File>>>(new Map());
  const [viewingAlbumName, setViewingAlbumName] = useState<string | null>(null);

  // State for slideshow
  const [slideshowFiles, setSlideshowFiles] = useState<File[] | null>(null);

  // State for the sharing flow
  const [isSharing, setIsSharing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [filesToShare, setFilesToShare] = useState<File[]>([]);
  const [lastSharedDetails, setLastSharedDetails] = useState<SharedDetails | null>(null);
  const [sharingHistory, setSharingHistory] = useState<SharedDetails[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Use useCallback to avoid stale closures in drag-drop handlers.
  // Uses functional state update to read current files without depending on `files`.
  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const errors: string[] = [];
    const validFiles = newFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`);
        return false;
      }
      // Allow files with empty type (some OS/browser combos don't report it)
      if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) {
        errors.push(`"${file.name}" has an unsupported file type (${file.type}).`);
        return false;
      }
      return true;
    });

    if (errors.length > 0) {
      setUploadErrors(errors);
    }

    if (validFiles.length === 0) return;

    // Functional update to access current files without stale closure
    setFiles(currentFiles => {
      const uniqueNewFiles = validFiles.filter(
        (newFile) => !currentFiles.some((existingFile) => existingFile.name === newFile.name && existingFile.size === newFile.size)
      );
      if (uniqueNewFiles.length > 0) {
        setFilesToUpload(uniqueNewFiles);
        setIsUploading(true);
      }
      return currentFiles;
    });
  }, []);

  const handleUploadComplete = (uploadedFiles: File[]) => {
    setFiles((prevFiles) => {
      const allFiles = [...uploadedFiles, ...prevFiles];
      return allFiles.sort((a, b) => b.lastModified - a.lastModified);
    });
    setFilesToUpload([]);
    setIsUploading(false);
  };

  const handleAddPhotosClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddFromCameraClick = () => {
    cameraInputRef.current?.click();
  };

  const handleDeleteFiles = (filesToDelete: File[]) => {
    const filesToDeleteSet = new Set(filesToDelete);
    setFiles(prevFiles => prevFiles.filter(file => !filesToDeleteSet.has(file)));
    setAlbums(prevAlbums => {
        const newAlbums = new Map<string, Set<File>>(prevAlbums);
        newAlbums.forEach((fileSet, albumName) => {
            const newFileSet = new Set([...fileSet].filter(file => !filesToDeleteSet.has(file)));
            newAlbums.set(albumName, newFileSet);
        });
        return newAlbums;
    });
  };

  const handleStartShare = (files: File[]) => {
    setFilesToShare(files);
    setIsSharing(true);
  };

  const handleSend = (details: Omit<SharedDetails, 'files' | 'sharedAt'>) => {
    const finalDetails: SharedDetails = { ...details, files: filesToShare, sharedAt: new Date() };
    setSharingHistory(prev => [finalDetails, ...prev]);
    setLastSharedDetails(finalDetails);
    setIsSharing(false);
    setIsSuccess(true);
  };

  const handleCloseSuccess = useCallback(() => {
    setLastSharedDetails(null);
    setFilesToShare([]);
    setIsSuccess(false);
  }, []);

  const handleCancelShare = useCallback(() => {
    setFilesToShare([]);
    setIsSharing(false);
  }, []);

  const handleSetCustomLocation = useCallback((file: File, location: { latitude: number; longitude: number }) => {
    const key = `${file.name}-${file.lastModified}`;
    setCustomLocations(prev => new Map(prev).set(key, location));
  }, []);

  const handleUpdateTags = useCallback((file: File, tags: string[]) => {
    const key = `${file.name}-${file.lastModified}`;
    setCustomTags(prev => new Map(prev).set(key, tags));
  }, []);

  const handleCreateAlbum = (albumName: string) => {
    if (albums.has(albumName) || !albumName.trim()) return false;
    setAlbums(prev => new Map(prev).set(albumName, new Set()));
    return true;
  };

  const handleAddToAlbum = (albumName: string, filesToAdd: File[]) => {
    setAlbums(prev => {
        const newAlbums = new Map<string, Set<File>>(prev);
        const existingSet = newAlbums.get(albumName) || new Set<File>();
        filesToAdd.forEach(file => existingSet.add(file));
        newAlbums.set(albumName, existingSet);
        return newAlbums;
    });
  };

  const handleViewAlbum = (albumName: string) => {
    setViewingAlbumName(albumName);
    setMainView('PHOTOS');
  };

  const handleExitAlbumView = () => {
    setViewingAlbumName(null);
  };

  const handleStartSlideshow = (filesForSlideshow: File[]) => {
    setSlideshowFiles(filesForSlideshow);
  };

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDraggingOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    dragCounter.current = 0;
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(Array.from(e.dataTransfer.files));
      e.dataTransfer.clearData();
    }
  }, [handleFilesAdded]);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]);

  const dismissUploadErrors = useCallback(() => setUploadErrors([]), []);

  const renderCurrentView = () => {
    if (isUploading) {
      return <FileUploadScreen filesToUpload={filesToUpload} onUploadComplete={handleUploadComplete} />;
    }
    if (isSuccess) {
      return <SuccessScreen details={lastSharedDetails} onSendMore={handleCloseSuccess} />;
    }
    if (isSharing) {
      return <ShareScreen files={filesToShare} onSend={handleSend} onCancel={handleCancelShare} />;
    }

    const filesForGallery = viewingAlbumName ? Array.from(albums.get(viewingAlbumName) || []) : files;

    switch (mainView) {
      case 'PHOTOS':
        return <GalleryScreen
                  files={filesForGallery}
                  albumName={viewingAlbumName}
                  onExitAlbumView={handleExitAlbumView}
                  albums={albums}
                  onCreateAlbum={handleCreateAlbum}
                  onAddToAlbum={handleAddToAlbum}
                  customLocations={customLocations}
                  onLocationUpdate={handleSetCustomLocation}
                  customTags={customTags}
                  onUpdateTags={handleUpdateTags}
                  onDeleteFiles={handleDeleteFiles}
                  onShare={handleStartShare}
                  isUploading={isUploading}
                  onAddPhotosClick={handleAddPhotosClick}
                  onStartSlideshow={handleStartSlideshow}
                />;
      case 'SHARING':
        return <SharingHistoryScreen history={sharingHistory} />;
      case 'ALBUMS':
        return <AlbumListScreen albums={albums} onCreateAlbum={handleCreateAlbum} onViewAlbum={handleViewAlbum} />;
      default:
        return <GalleryScreen
                  files={files}
                  albums={albums}
                  onCreateAlbum={handleCreateAlbum}
                  onAddToAlbum={handleAddToAlbum}
                  customLocations={customLocations}
                  onLocationUpdate={handleSetCustomLocation}
                  customTags={customTags}
                  onUpdateTags={handleUpdateTags}
                  onDeleteFiles={handleDeleteFiles}
                  onShare={handleStartShare}
                  isUploading={isUploading}
                  onAddPhotosClick={handleAddPhotosClick}
                  onStartSlideshow={handleStartSlideshow}
               />;
    }
  };

  const showNav = !isSharing && !isSuccess && !isUploading;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8 md:pb-8 pb-28">
        {isDraggingOver && <DragDropOverlay />}
        {slideshowFiles && <Slideshow files={slideshowFiles} onClose={() => setSlideshowFiles(null)} />}

        {uploadErrors.length > 0 && (
          <div className="fixed top-4 right-4 z-[5000] max-w-md bg-red-900/95 border border-red-700 p-6 rounded-2xl shadow-2xl animate-fade-in" role="alert">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-2xl font-bold text-red-200"><i className="fas fa-exclamation-triangle mr-2"></i>Upload Errors</h3>
              <button onClick={dismissUploadErrors} className="text-3xl text-red-300 hover:text-white" aria-label="Dismiss errors">&times;</button>
            </div>
            <ul className="space-y-1">
              {uploadErrors.map((err, i) => (
                <li key={i} className="text-lg text-red-200">{err}</li>
              ))}
            </ul>
          </div>
        )}

        <input
          type="file"
          multiple
          accept={ACCEPTED_FILE_INPUT}
          ref={fileInputRef}
          onChange={(e) => { handleFilesAdded(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          className="hidden"
          aria-hidden="true"
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={(e) => { handleFilesAdded(Array.from(e.target.files ?? [])); e.target.value = ''; }}
          className="hidden"
          aria-hidden="true"
        />
        <Header onAddPhotosClick={handleAddPhotosClick} onAddFromCameraClick={handleAddFromCameraClick} />

        <main className="w-full max-w-7xl mx-auto mt-8">
          {renderCurrentView()}
        </main>

        {showNav && (
          <MainNavigation activeView={mainView} setActiveView={setMainView} />
        )}
      </div>
    </ErrorBoundary>
  );
}
