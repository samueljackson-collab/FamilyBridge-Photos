
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { PhotoMetadata } from '../utils/fileUtils';
import { LocationPickerModal } from './LocationPickerModal';

interface PhotoDetailScreenProps {
  file: File;
  metadata?: PhotoMetadata;
  onBack: () => void;
  onShare: (files: File[]) => void;
  onShowOnMap: (file: File) => void;
  onLocationUpdate: (file: File, location: { latitude: number; longitude: number }) => void;
  customTags: string[];
  onUpdateTags: (file: File, tags: string[]) => void;
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const DetailItem: React.FC<{ label: string; value: string | undefined; icon: string }> = ({ label, value, icon }) => {
    if (!value) return null;
    return (
        <div className="flex items-start">
            <i className={`fas ${icon} text-slate-400 w-8 text-2xl text-center mr-4 mt-1`}></i>
            <div>
                <h4 className="font-bold text-slate-400 text-xl sm:text-2xl">{label}</h4>
                <p className="text-slate-200 text-2xl sm:text-3xl">{value}</p>
            </div>
        </div>
    );
};

const CustomVideoPlayer: React.FC<{ src: string }> = ({ src }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const controlsTimeoutRef = useRef<number | null>(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [areControlsVisible, setAreControlsVisible] = useState(true);

    const showControls = () => {
        setAreControlsVisible(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
    };
    
    const hideControlsWithDelay = () => {
        if (isPlaying && document.activeElement !== progressRef.current) {
            controlsTimeoutRef.current = window.setTimeout(() => {
                setAreControlsVisible(false);
            }, 2500);
        }
    };
    
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const updateTime = () => setCurrentTime(video.currentTime);
        const updateDuration = () => setDuration(video.duration);
        const onPlay = () => setIsPlaying(true);
        const onPause = () => {
            setIsPlaying(false);
            showControls(); // Keep controls visible when paused
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
        
        video.addEventListener('timeupdate', updateTime);
        video.addEventListener('loadedmetadata', updateDuration);
        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);

        showControls();
        hideControlsWithDelay();

        return () => {
            video.removeEventListener('timeupdate', updateTime);
            video.removeEventListener('loadedmetadata', updateDuration);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (isPlaying) {
            hideControlsWithDelay();
        } else {
            showControls();
        }
    }, [isPlaying]);


    const togglePlay = () => {
        if (videoRef.current) {
            videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
        }
    };
    
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
            videoRef.current.muted = newVolume === 0;
            setVolume(newVolume);
            setIsMuted(newVolume === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
            if (!videoRef.current.muted && videoRef.current.volume === 0) {
              videoRef.current.volume = 0.5;
              setVolume(0.5);
            }
        }
    };
    
    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (videoRef.current && progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * duration;
        }
    };

    const handleProgressKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (!videoRef.current) return;
        const seekAmount = 5; // Seek 5 seconds
        let newTime = videoRef.current.currentTime;

        switch (e.key) {
            case 'ArrowRight':
                newTime = Math.min(duration, newTime + seekAmount);
                break;
            case 'ArrowLeft':
                newTime = Math.max(0, newTime - seekAmount);
                break;
            case 'Home':
                newTime = 0;
                break;
            case 'End':
                newTime = duration;
                break;
            default:
                return;
        }

        e.preventDefault();
        videoRef.current.currentTime = newTime;
    };


    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (!document.fullscreenElement) {
                containerRef.current.requestFullscreen().catch(err => {
                    alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                });
            } else {
                document.exitFullscreen();
            }
        }
    };

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-full bg-black flex items-center justify-center rounded-lg overflow-hidden group/player"
            onMouseMove={showControls}
            onMouseLeave={hideControlsWithDelay}
            onFocus={showControls}
            onBlur={hideControlsWithDelay}
        >
            <video
                ref={videoRef}
                src={src}
                autoPlay
                muted
                onClick={togglePlay}
                className="max-w-full max-h-[80vh] object-contain cursor-pointer"
            >
                Your browser does not support the video tag.
            </video>

            {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                        onClick={togglePlay}
                        aria-label="Play video"
                        className="pointer-events-auto text-white bg-black/50 w-24 h-24 sm:w-32 sm:h-32 rounded-full flex items-center justify-center text-5xl sm:text-6xl hover:bg-black/70 transition-colors"
                    >
                        <i className="fas fa-play"></i>
                    </button>
                </div>
            )}
            
            <div className={`absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${areControlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div 
                    ref={progressRef}
                    onClick={handleSeek}
                    onKeyDown={handleProgressKeyDown}
                    tabIndex={0}
                    className="w-full h-2 bg-white/30 rounded-full cursor-pointer group mb-3 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
                    role="slider"
                    aria-label="Video progress"
                    aria-valuemin={0}
                    aria-valuemax={duration}
                    aria-valuenow={currentTime}
                    aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
                >
                    <div 
                        className="h-full bg-blue-500 rounded-full relative group-hover:h-3 transition-all" 
                        style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transform scale-0 group-hover:scale-100 transition-all duration-200"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-white text-lg sm:text-xl">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
                            <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-2xl sm:text-3xl w-8 text-center`}></i>
                        </button>
                        <div className="flex items-center gap-1 sm:gap-3 group">
                            <button onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                                <i className={`fas ${isMuted || volume === 0 ? 'fa-volume-mute' : volume > 0.5 ? 'fa-volume-up' : 'fa-volume-down'} text-2xl sm:text-3xl w-8 text-center`}></i>
                            </button>
                            <input 
                                type="range"
                                min="0" max="1" step="0.05"
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-0 group-hover:w-16 sm:group-hover:w-24 transition-all duration-300 h-2 accent-blue-500 cursor-pointer"
                                aria-label="Volume control"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <span aria-label={`Current time ${formatTime(currentTime)}, total duration ${formatTime(duration)}`}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                        <button onClick={toggleFullscreen} aria-label="Toggle fullscreen">
                            <i className="fas fa-expand text-2xl sm:text-3xl w-8 text-center"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const PhotoDetailScreen: React.FC<PhotoDetailScreenProps> = ({ file, metadata, onBack, onShare, onShowOnMap, onLocationUpdate, customTags, onUpdateTags }) => {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  const url = React.useMemo(() => (isImage || isVideo) ? URL.createObjectURL(file) : null, [file, isImage, isVideo]);
  const backButtonRef = useRef<HTMLButtonElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newTag, setNewTag] = useState('');

  const allTags = useMemo(() => {
    const combined = new Set([...(metadata?.keywords || []), ...customTags]);
    return Array.from(combined);
  }, [metadata, customTags]);

  useEffect(() => {
    backButtonRef.current?.focus();
    
    const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            if (!document.fullscreenElement) {
                onBack();
            }
        }
    };
    
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      if (url) {
        URL.revokeObjectURL(url);
      }
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [url, onBack]);
  
  const handleLocationSave = (location: { latitude: number; longitude: number }) => {
    onLocationUpdate(file, location);
    setIsLocationPickerOpen(false);
  };

  const handleDownload = () => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = () => {
    onShare([file]);
  };
  
  const handleToggleFullscreen = () => {
    if (!mediaContainerRef.current) return;
    if (!document.fullscreenElement) {
        mediaContainerRef.current.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tagToAdd = newTag.trim();
    if (tagToAdd && !allTags.includes(tagToAdd)) {
        // We only add to customTags, as EXIF keywords are read-only
        const updatedCustomTags = [...customTags, tagToAdd];
        onUpdateTags(file, updatedCustomTags);
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    // We can only remove from customTags, not from original EXIF data
    const updatedCustomTags = customTags.filter(t => t !== tagToRemove);
    onUpdateTags(file, updatedCustomTags);
  };


  return (
    <>
    <div role="dialog" aria-modal="true" aria-labelledby="photo-detail-title" className="w-full animate-fade-in text-slate-200">
      <div className="mb-8">
        <button
          ref={backButtonRef}
          onClick={onBack}
          className="text-2xl md:text-3xl py-3 px-6 md:py-4 md:px-8 bg-slate-800 text-slate-200 font-semibold rounded-2xl hover:bg-slate-700 transition-colors flex items-center gap-3"
        >
          <i className="fas fa-arrow-left"></i>
          <span>Back to Gallery</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div ref={mediaContainerRef} className="relative flex-grow lg:w-2/3 flex items-center justify-center bg-slate-900 rounded-2xl p-2 sm:p-4 min-h-[50vh] lg:min-h-[60vh] fullscreen:bg-black fullscreen:p-0">
          {isImage && url ? (
            <img
              src={url}
              alt={`Full view of ${file.name}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg fullscreen:max-h-screen"
            />
          ) : isVideo && url ? (
            <CustomVideoPlayer src={url} />
          ) : (
             <div className="text-center text-slate-500">
                <i className="fas fa-file text-9xl"></i>
                <p className="mt-4 text-3xl">No preview available</p>
            </div>
          )}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
            {metadata?.gps && (
              <button
                onClick={() => onShowOnMap(file)}
                className="text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-5 bg-slate-800/70 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-slate-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 border border-slate-600 animate-fade-in"
                aria-label={`Show ${file.name} on map`}
              >
                <i className="fas fa-map-marked-alt"></i>
                <span className="hidden sm:inline">View on Map</span>
              </button>
            )}
            {isImage && (
              <button
                onClick={handleToggleFullscreen}
                className="text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-5 bg-slate-800/70 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-slate-700 transition-all transform hover:scale-105 flex items-center justify-center gap-3 border border-slate-600 animate-fade-in"
                aria-label={isFullscreen ? 'Exit full-screen' : 'Enter full-screen'}
                title={isFullscreen ? 'Exit full-screen' : 'Enter full-screen'}
              >
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
              </button>
            )}
          </div>
        </div>
        <div className="flex-shrink-0 lg:w-1/3 bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col">
            <h2 id="photo-detail-title" className="text-3xl sm:text-4xl lg:text-5xl font-bold break-words mb-8 text-slate-100">{file.name}</h2>
            <div className="space-y-6 text-2xl sm:text-3xl">
                <DetailItem label="File Size" value={formatBytes(file.size)} icon="fa-balance-scale-right" />
                <DetailItem label="Date Added" value={new Date(file.lastModified).toLocaleString()} icon="fa-calendar-plus" />
                <DetailItem label="File Type" value={file.type || 'Unknown'} icon="fa-file-alt" />
            </div>

            {isImage && (
              <>
                <hr className="border-slate-700 my-8" />
                <h3 className="text-3xl sm:text-4xl font-bold text-slate-100 mb-6">Camera Details</h3>
                { (metadata && Object.keys(metadata).length > 0) ? (
                  <div className="space-y-6">
                    <DetailItem label="Date Taken" value={metadata?.dateTaken?.toLocaleString()} icon="fa-calendar-alt" />
                    <DetailItem label="Make" value={metadata?.cameraMake} icon="fa-industry" />
                    <DetailItem label="Model" value={metadata?.cameraModel} icon="fa-camera" />
                    <DetailItem label="Lens" value={metadata?.lensModel} icon="fa-camera-retro" />
                    <DetailItem label="Dimensions" value={metadata?.dimensions ? `${metadata.dimensions.width} x ${metadata.dimensions.height} px` : undefined} icon="fa-expand-arrows-alt" />
                    {(metadata.iso || metadata.exposureTime || metadata.fNumber) && (
                        <details className="pt-2">
                            <summary className="text-xl sm:text-2xl font-semibold text-slate-400 cursor-pointer hover:text-slate-200">
                                Advanced Settings
                            </summary>
                            <div className="mt-4 space-y-6 pl-4 border-l-2 border-slate-700">
                                <DetailItem label="ISO" value={metadata?.iso} icon="fa-bullseye" />
                                <DetailItem label="Exposure" value={metadata?.exposureTime} icon="fa-stopwatch" />
                                <DetailItem label="F-number" value={metadata?.fNumber} icon="fa-dot-circle" />
                            </div>
                        </details>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400 text-xl sm:text-2xl">No camera data available.</p>
                )}
              </>
            )}

            <hr className="border-slate-700 my-8" />
            <h3 id="tags-heading" className="text-3xl sm:text-4xl font-bold text-slate-100 mb-6">Tags</h3>
            <ul className="flex flex-wrap gap-3 mb-4" role="list" aria-labelledby="tags-heading">
                {allTags.map(tag => {
                    const isRemovable = customTags.includes(tag);
                    return (
                        <li 
                            key={tag}
                            className="flex items-center bg-slate-700 rounded-full px-4 py-2 text-lg sm:text-xl font-semibold"
                            title={!isRemovable ? "This tag is from the photo's metadata and cannot be removed." : undefined}
                        >
                            <span>{tag}</span>
                            {isRemovable ? (
                               <button 
                                   onClick={() => handleRemoveTag(tag)} 
                                   className="ml-2 text-slate-400 hover:text-white transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-blue-500" 
                                   aria-label={`Remove tag ${tag}`}
                               >
                                   <i className="fas fa-times-circle"></i>
                               </button>
                            ) : (
                                <i className="fas fa-lock ml-3 text-slate-500" aria-hidden="true"></i>
                            )}
                        </li>
                    );
                })}
            </ul>
            {allTags.length === 0 && <p className="text-slate-400 text-xl sm:text-2xl">No tags yet.</p>}
            <form onSubmit={handleAddTag} className="flex gap-2">
                <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    placeholder="Add a new tag..."
                    className="flex-grow p-3 text-xl sm:text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition"
                    aria-label="Add a new tag"
                />
                <button type="submit" className="text-xl sm:text-2xl py-3 px-5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors" aria-label="Add tag">Add</button>
            </form>
            
            <div className="mt-auto pt-8 flex flex-col gap-4">
                {isImage && !metadata?.gps && (
                    <button
                        onClick={() => setIsLocationPickerOpen(true)}
                        className="w-full text-2xl py-5 px-6 bg-teal-600 text-white font-bold rounded-xl hover:bg-teal-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
                        aria-label={`Add location for ${file.name}`}
                    >
                        <i className="fas fa-map-pin"></i>
                        <span>Add Location</span>
                    </button>
                )}
                {metadata?.gps && !isFullscreen && (
                    <button
                        onClick={() => onShowOnMap(file)}
                        className="w-full text-2xl py-5 px-6 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
                        aria-label={`Show ${file.name} on map`}
                    >
                        <i className="fas fa-map-marked-alt"></i>
                        <span>Show on Map</span>
                    </button>
                )}
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleShare}
                        className="flex-1 text-2xl py-5 px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
                        aria-label={`Share ${file.name}`}
                    >
                        <i className="fas fa-share-square"></i>
                        <span>Share</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 text-2xl py-5 px-6 bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-600 transition-transform transform hover:scale-105 flex items-center justify-center gap-3"
                        aria-label={`Download ${file.name}`}
                    >
                        <i className="fas fa-download"></i>
                        <span>Download</span>
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
    <LocationPickerModal
      isOpen={isLocationPickerOpen}
      onClose={() => setIsLocationPickerOpen(false)}
      onLocationSave={handleLocationSave}
    />
    </>
  );
};
