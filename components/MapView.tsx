
import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import L from 'leaflet';
import { UploadIndicator } from './UploadIndicator';
import { PhotoMetadata } from '../utils/fileUtils';

export interface PhotoPoint {
  file: File;
  position: [number, number];
  exif: {
    dateTaken?: Date;
    cameraModel?: string;
    cameraMake?: string;
    lensModel?: string;
    gpsDate?: Date;
  };
}

interface MapViewProps {
  photoPoints: PhotoPoint[];
  centerOn: PhotoPoint | null;
  onShowInGallery: (file: File) => void;
  onViewDetails: (file: File) => void;
  isUploading: boolean;
  isOnline: boolean;
  metadataCache: Map<File, PhotoMetadata>;
  onSelectInGallery: (files: File[]) => void;
  isHeatmapMode: boolean;
  onHeatmapToggle: (isHeatmap: boolean) => void;
}

const FocusPopupOnOpen: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const handlePopupOpen = (e: L.PopupEvent) => {
      const popupElement = e.popup.getElement();
      if (popupElement) {
        // Find the first interactive element within the popup to focus
        const focusable = popupElement.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable) {
            focusable.focus();
        } else {
            // If no interactive elements, focus the popup container itself
            popupElement.setAttribute('tabindex', '-1');
            popupElement.focus();
        }
      }
    };
    map.on('popupopen', handlePopupOpen);
    return () => {
      map.off('popupopen', handlePopupOpen);
    };
  }, [map]);
  return null;
};

const ClusterViewerModal: React.FC<{ 
  files: File[], 
  onClose: () => void, 
  onViewDetails: (file: File) => void,
  metadataCache: Map<File, PhotoMetadata>,
  onSelectInGallery: (files: File[]) => void,
}> = ({ files, onClose, onViewDetails, metadataCache, onSelectInGallery }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [selectedInCluster, setSelectedInCluster] = useState<Set<File>>(new Set());

  useEffect(() => {
    const modalNode = modalRef.current;
    if (!modalNode) return;

    const focusableElements = modalNode.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
        if (e.key === 'Tab') {
            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement?.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement?.focus();
                    e.preventDefault();
                }
            }
        }
    };

    firstElement?.focus();
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const urls = useMemo(() => {
    const urlMap = new Map<string, string>();
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        urlMap.set(`${file.name}-${file.lastModified}`, URL.createObjectURL(file));
      }
    });
    return urlMap;
  }, [files]);

  useEffect(() => {
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [urls]);

  const dateRange = useMemo(() => {
    const dates = files
        .map(f => metadataCache.get(f)?.dateTaken)
        .filter((d): d is Date => !!d);

    if (dates.length === 0) return null;

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };

    if (minDate.toDateString() === maxDate.toDateString()) {
        return `Taken on ${minDate.toLocaleDateString(undefined, options)}`;
    }
    return `Taken between ${minDate.toLocaleDateString(undefined, options)} and ${maxDate.toLocaleDateString(undefined, options)}`;
  }, [files, metadataCache]);
  
  const handleToggleSelection = (file: File) => {
    setSelectedInCluster(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(file)) {
            newSelection.delete(file);
        } else {
            newSelection.add(file);
        }
        return newSelection;
    });
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadSelected = () => {
    if (selectedInCluster.size === 0) return;
    if (window.confirm(`Are you sure you want to download the ${selectedInCluster.size} selected photos?`)) {
        selectedInCluster.forEach(downloadFile);
    }
  };

  const handleDownloadAll = () => {
    if (window.confirm(`Are you sure you want to download all ${files.length} photos in this area?`)) {
      files.forEach(downloadFile);
    }
  };

  const handleSelect = () => {
    onSelectInGallery(files);
    onClose();
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in" onClick={onClose} aria-modal="true" role="dialog">
      <div ref={modalRef} className="bg-slate-900 w-full h-full p-4 sm:rounded-3xl sm:border sm:border-slate-700 sm:max-w-4xl sm:h-[85vh] sm:p-8 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-6 flex-shrink-0 flex-wrap gap-4">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold text-slate-100">{files.length} Photos in this Area</h2>
            {dateRange && <p className="text-lg sm:text-2xl text-slate-400 mt-2">{dateRange}</p>}
          </div>
           <div className="flex items-center gap-2 sm:gap-4">
            {selectedInCluster.size > 0 && (
                <button
                    onClick={handleDownloadSelected}
                    className="text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center gap-2"
                    title={`Download ${selectedInCluster.size} selected photos`}
                >
                    <i className="fas fa-download"></i>
                    <span className="hidden sm:inline">Download ({selectedInCluster.size})</span>
                </button>
            )}
             <button
                onClick={handleDownloadAll}
                className="text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-transform transform hover:scale-105 flex items-center gap-2"
                title={`Download all ${files.length} photos`}
              >
                <i className="fas fa-cloud-download-alt"></i>
                <span className="hidden sm:inline">Download All</span>
            </button>
            <button
                onClick={handleSelect}
                className="text-lg sm:text-xl py-2 px-4 sm:py-3 sm:px-6 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center gap-2"
                title="Select these photos in the main gallery"
            >
                <i className="fas fa-check-double"></i>
                <span className="hidden sm:inline">Select</span>
            </button>
            <button onClick={onClose} className="text-4xl sm:text-5xl text-slate-400 hover:text-white transition-colors" aria-label="Close photo preview">
              &times;
            </button>
          </div>
        </div>
        <div className="overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4 pr-2">
          {files.map(file => (
            <div
              key={`${file.name}-${file.lastModified}`}
              className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group shadow-lg border-2 transition-all ${selectedInCluster.has(file) ? 'border-blue-500' : 'border-transparent hover:border-blue-500'}`}
              onClick={() => onViewDetails(file)}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onViewDetails(file)}
              tabIndex={0}
              aria-label={`View details for ${file.name}`}
            >
              <div
                role="checkbox"
                aria-checked={selectedInCluster.has(file)}
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); handleToggleSelection(file); }}
                onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); handleToggleSelection(file); }}}
                className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 cursor-pointer ${selectedInCluster.has(file) ? 'bg-blue-600 border-blue-400' : 'bg-slate-900/60 border-white/60 group-hover:opacity-100 opacity-0'}`}
                aria-label={`Select ${file.name}`}
              >
                  {selectedInCluster.has(file) && <i className="fas fa-check text-white"></i>}
              </div>
              <img src={urls.get(`${file.name}-${file.lastModified}`)} alt={`Preview of ${file.name}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                <p className="text-white text-sm font-bold truncate">{file.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

const MarkerPopupContent: React.FC<{
    file: File;
    exif: PhotoPoint['exif'];
    onShowInGallery: (file: File) => void;
    onViewDetails: (file: File) => void;
    handleDownloadFile: (file: File) => void;
}> = ({ file, exif, onShowInGallery, onViewDetails, handleDownloadFile }) => {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    useEffect(() => {
        return () => URL.revokeObjectURL(url);
    }, [url]);

    return (
        <div className="bg-slate-800 text-slate-100 rounded-lg overflow-hidden shadow-xl border border-slate-700 max-w-[90vw] w-[500px]">
            <img src={url} alt={file.name} className="w-full h-[200px] sm:h-[350px] object-cover" />
            <div className="p-4 sm:p-6 md:p-10">
                <h3 className="font-bold text-2xl sm:text-4xl truncate mb-4 sm:mb-8" title={file.name}>{file.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-10 gap-y-4 sm:gap-y-8">
                    {exif.dateTaken && (
                        <div className="flex items-start gap-3 sm:gap-4">
                            <i className="fas fa-calendar-alt w-6 sm:w-8 text-center text-blue-300 text-2xl sm:text-3xl pt-1"></i>
                            <div>
                                <h4 className="font-bold text-slate-400 text-lg sm:text-2xl">Date Taken</h4>
                                <p className="text-slate-100 text-xl sm:text-3xl">{exif.dateTaken.toLocaleString()}</p>
                            </div>
                        </div>
                    )}
                    {exif.cameraModel && (
                        <div className="flex items-start gap-3 sm:gap-4">
                            <i className="fas fa-camera w-6 sm:w-8 text-center text-blue-300 text-2xl sm:text-3xl pt-1"></i>
                            <div>
                                <h4 className="font-bold text-slate-400 text-lg sm:text-2xl">Model</h4>
                                <p className="text-slate-100 text-xl sm:text-3xl">{exif.cameraModel}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div className="p-2 sm:p-4 bg-slate-900/50 flex gap-2 sm:gap-4">
                <button
                    onClick={() => onShowInGallery(file)}
                    className="flex-1 py-3 px-2 sm:py-4 sm:px-4 bg-slate-600 text-white font-bold text-lg sm:text-2xl rounded-lg hover:bg-slate-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    aria-label={`Find ${file.name} in gallery`}
                ><i className="fas fa-th-large"></i><span className="hidden sm:inline">Find</span></button>
                <button 
                    onClick={() => onViewDetails(file)}
                    className="flex-1 py-3 px-2 sm:py-4 sm:px-4 bg-blue-600 text-white font-bold text-lg sm:text-2xl rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                    aria-label={`View details for ${file.name}`}
                ><i className="fas fa-info-circle"></i><span className="hidden sm:inline">Details</span></button>
                <button
                  onClick={() => handleDownloadFile(file)}
                  className="flex-1 py-3 px-2 sm:py-4 sm:px-4 bg-green-600 text-white font-bold text-lg sm:text-2xl rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  aria-label={`Download ${file.name}`}
                ><i className="fas fa-download"></i><span className="hidden sm:inline">Download</span></button>
            </div>
        </div>
    );
};

const SearchControl: React.FC = () => {
    const map = useMap();
    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new (GeoSearchControl as any)({ 
            provider, 
            style: 'bar', 
            showMarker: true, 
            marker: { icon: new L.Icon.Default(), draggable: false }, 
            autoClose: true, 
            keepResult: true,
            searchLabel: 'Find a place or address...',
            label: 'Search for a location',
        });
        map.addControl(searchControl);
        return () => {
            map.removeControl(searchControl);
        };
    }, [map]);
    return null;
};

const OfflineMapLayer: React.FC = () => {
    const map = useMap();

    useEffect(() => {
        // leaflet.offline is loaded from a script tag, so it might not be ready immediately.
        if (!map || typeof (L as any).tileLayer.offline === 'undefined') {
            return;
        }

        const tileLayer = (L as any).tileLayer.offline(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
            {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
                subdomains: 'abcd',
                minZoom: 0,
                maxZoom: 18,
            }
        );
        tileLayer.addTo(map);

        const saveTilesControl = new (L.Control as any).SaveTiles(tileLayer, {
            zoomlevels: [10, 11, 12, 13, 14, 15, 16], // Download a reasonable range for offline use
            confirm(layer: any, successCallback: any) {
                if (window.confirm('Save map tiles for the current view? This can take a moment and use storage space.')) {
                    successCallback();
                }
            },
            confirmRemoval(layer: any, successCallback: any) {
                if (window.confirm('Delete all saved map tiles?')) {
                    successCallback();
                }
            },
            saveText: '<i class="fas fa-download" title="Save map for offline use"></i>',
            rmText: '<i class="fas fa-trash" title="Delete offline map data"></i>',
        });
        saveTilesControl.addTo(map);

        return () => {
            if (map.hasLayer(tileLayer)) {
                map.removeLayer(tileLayer);
            }
            map.removeControl(saveTilesControl);
        };
    }, [map]);

    return null;
};

export const MapView: React.FC<MapViewProps> = ({ photoPoints, centerOn, onShowInGallery, onViewDetails, isUploading, isOnline, metadataCache, onSelectInGallery, isHeatmapMode, onHeatmapToggle }) => {
  const [clusterPreview, setClusterPreview] = useState<File[] | null>(null);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (centerOn && mapRef.current) {
        mapRef.current.flyTo(centerOn.position, 16, { animate: true, duration: 1.5 });
    }
  }, [centerOn]);
  
  // Accessibility enhancement: make markers and clusters keyboard-focusable
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Activate with Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
        (e.target as HTMLElement).click();
      }
    };

    const makeMarkersAccessible = () => {
      const markers = map.getContainer().querySelectorAll<HTMLElement>('.leaflet-marker-icon, .marker-cluster');
      markers.forEach(marker => {
        // Only add attributes if they haven't been added before
        if (marker.getAttribute('tabindex') !== '0') {
          marker.setAttribute('tabindex', '0');
          marker.setAttribute('role', 'button');
          marker.addEventListener('keydown', handleKeyDown);
        }
      });
    };

    // Run whenever the map finishes moving or zooming
    map.on('moveend', makeMarkersAccessible);
    map.on('zoomend', makeMarkersAccessible);
    
    // Initial run after a short delay to allow markers to render
    const timer = setTimeout(makeMarkersAccessible, 500);

    return () => {
      clearTimeout(timer);
      map.off('moveend', makeMarkersAccessible);
      map.off('zoomend', makeMarkersAccessible);
      
      // Clean up event listeners from markers that might be removed
      const markers = map.getContainer().querySelectorAll<HTMLElement>('.leaflet-marker-icon, .marker-cluster');
      markers.forEach(marker => {
        marker.removeEventListener('keydown', handleKeyDown);
      });
    };
  }, [mapRef.current]);

  const handleDownloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClusterClick = (cluster: any) => {
    const map = cluster._map;
    if (map) {
      map.flyToBounds(cluster.getBounds(), { padding: [60, 60], duration: 1 });
    }
    setTimeout(() => {
        setClusterPreview(cluster.getAllChildMarkers().map((m: any) => m.options.file));
    }, 500); // Delay preview to allow zoom animation to start
  };

  const createHeatmapClusterIcon = (cluster: any) => {
    const markers = cluster.getAllChildMarkers();
    const photoCount = markers.length;

    const uniqueDates = new Set(
      markers.map((m: any) => m.options.exif.dateTaken?.toISOString().split('T')[0]).filter(Boolean)
    );
    // If there are no dates, we can't calculate density. Default to 1 to avoid division by zero and treat it as a single event.
    const uniqueDateCount = uniqueDates.size || 1; 

    // Density is the average number of photos per day. Higher is "busier".
    const density = photoCount / uniqueDateCount;

    // "t" is a value from 0 to 1 that represents the "hotness" of the cluster's activity.
    // We use a logarithmic scale to better represent a wide range of densities.
    // A density of 25 photos/day is considered "maximum hot".
    const t = Math.min(1, Math.log10(Math.max(1, density)) / Math.log10(25));
    
    // Hue goes from 240 (blue, cool) to 0 (red, hot).
    const hue = 240 * (1 - t);
    const colorOpaque = `hsla(${hue}, 100%, 50%, 0.9)`;
    const colorTransparent = `hsla(${hue}, 100%, 50%, 0)`;
    
    // Size is logarithmic based on the total number of photos.
    const size = 30 + Math.log2(photoCount) * 10;
    
    const dayOrDays = uniqueDateCount === 1 ? 'day' : 'days';
    
    // A more explicit tooltip explaining the metrics.
    const tooltipText = `
        <b>${photoCount} photos</b> over <strong>${uniqueDateCount} ${dayOrDays}</strong><br>
        <i>Avg. ${density.toFixed(1)} photos per day</i><br><br>
        <div style="text-align: left; font-size: 0.9rem; line-height: 1.4;">
            &bull; <strong>Size</strong> reflects total photo count<br>
            &bull; <strong>Color</strong> reflects photo density (hotter is more)
        </div><br>
        Click to zoom and preview.
    `;
    
    cluster.bindTooltip(tooltipText, { direction: 'top', offset: [0, -size/2], className: 'cluster-tooltip' });
    cluster.off('click').on('click', () => handleClusterClick(cluster));

    const html = `<div style="width:100%;height:100%;border-radius:50%;background:radial-gradient(circle, ${colorOpaque} 20%, ${colorTransparent} 70%);display:flex;align-items:center;justify-content:center;"><span style="color:white;font-weight:700;font-size:${size/2.5}px;text-shadow:0 0 4px #000;">${photoCount}</span></div>`;
    return new L.DivIcon({ html, className: `marker-cluster`, iconSize: [size, size] });
  };

  const createStandardClusterIcon = (cluster: any) => {
    const childCount = cluster.getChildCount();
    const size = 30 + Math.log2(childCount) * 10;
  
    cluster.bindTooltip(`${childCount} photos. Click to zoom and preview.`, { direction: 'top', offset: [0, -size / 2], className: 'cluster-tooltip' });
    cluster.off('click').on('click', () => handleClusterClick(cluster));

    const html = `<div style="width:100%;height:100%;border-radius:50%;background:radial-gradient(circle, #3b82f6 30%, #2563eb 100%);border:3px solid #60a5fa;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,0.5);"><span style="color:white;font-weight:700;font-size:${size/2.5}px;text-shadow:0 0 6px #000;">${childCount}</span></div>`;
    return new L.DivIcon({ html, className: `marker-cluster`, iconSize: [size, size] });
  };
  
  const bounds = useMemo(() => {
    if (photoPoints.length === 0) return null;
    const lats = photoPoints.map(p => p.position[0]);
    const lngs = photoPoints.map(p => p.position[1]);
    return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]] as L.LatLngBoundsExpression;
  }, [photoPoints]);

  const handleFitBounds = () => {
    if (bounds && mapRef.current) {
        mapRef.current.flyToBounds(bounds, { padding: [50, 50] });
    }
  };

  if (photoPoints.length === 0 && !isUploading) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border-2 border-slate-800">
            <i className="fas fa-map-marked-alt text-9xl text-slate-600 mb-8"></i>
            <h2 className="text-5xl font-bold text-slate-200">See Your Photos on a Map</h2>
            <p className="text-2xl sm:text-3xl mt-6 max-w-3xl text-slate-400">
                This view is for photos that have location (GPS) data.
            </p>
            <p className="text-xl sm:text-2xl mt-4 max-w-3xl text-slate-500">
                To see your memories plotted here, add photos from a smartphone or camera with location services turned on. Most modern phones do this automatically!
            </p>
        </div>
    );
  }

  return (
    <div className="relative w-full h-full">
        {clusterPreview && <ClusterViewerModal 
            files={clusterPreview} 
            onClose={() => setClusterPreview(null)} 
            onViewDetails={onViewDetails}
            metadataCache={metadataCache}
            onSelectInGallery={onSelectInGallery}
        />}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            {bounds && (
              <button
                  onClick={handleFitBounds}
                  className="py-3 px-4 bg-slate-800/80 backdrop-blur-md text-slate-100 text-xl font-bold rounded-xl shadow-lg border border-slate-700 hover:bg-slate-700 transition-colors"
                  title="Fit all photos to view"
                  aria-label="Fit all photos to view"
              >
                  <i className="fas fa-expand-arrows-alt"></i>
              </button>
            )}
        </div>

        <MapContainer ref={mapRef} center={centerOn?.position || [20, 0]} zoom={centerOn ? 16 : 2} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <FocusPopupOnOpen />
            <SearchControl />
            <OfflineMapLayer />
            {photoPoints.length > 0 && (
                <MarkerClusterGroup 
                    iconCreateFunction={isHeatmapMode ? createHeatmapClusterIcon : createStandardClusterIcon}
                    spiderfyOnMaxZoom={false}
                    zoomToBoundsOnClick={false} // Disable default zoom to handle it manually
                >
                    {photoPoints.map(({ file, position, exif }) => (
                    <Marker position={position} key={file.name + file.lastModified} {...{file, exif} as any}>
                        <Popup>
                            <MarkerPopupContent 
                                file={file}
                                exif={exif}
                                onShowInGallery={onShowInGallery}
                                onViewDetails={onViewDetails}
                                handleDownloadFile={handleDownloadFile}
                            />
                        </Popup>
                    </Marker>
                    ))}
                </MarkerClusterGroup>
            )}
        </MapContainer>
        {isUploading && (
            <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm rounded-3xl">
                <div className="w-11/12 max-w-lg"><UploadIndicator /></div>
            </div>
        )}
    </div>
  );
};
