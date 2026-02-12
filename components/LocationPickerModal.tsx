
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for Leaflet's default icon path issues with module bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSave: (location: { latitude: number; longitude: number }) => void;
}

const MapEvents: React.FC<{ onMapClick: (latlng: L.LatLng) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
};

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ isOpen, onClose, onLocationSave }) => {
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    if (isOpen) {
      // Reset position when modal opens
      setPosition(null);
      // Invalidate map size after modal animation to ensure it renders correctly
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 300);

      // Focus trap logic
      const modalNode = modalRef.current;
      if (!modalNode) return;
      
      const focusableElements = modalNode.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              onClose();
          }
          if (e.key === 'Tab') {
              if (e.shiftKey) { 
                  if (document.activeElement === firstElement) {
                      lastElement?.focus();
                      e.preventDefault();
                  }
              } else {
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
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (position) {
      onLocationSave({ latitude: position.lat, longitude: position.lng });
    }
  };

  return ReactDOM.createPortal(
    <div 
        className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title"
    >
      <div 
        ref={modalRef}
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-3xl p-8 sm:p-12"
        onClick={e => e.stopPropagation()}
      >
        <h2 id="location-picker-title" className="text-5xl font-bold text-slate-100 text-center">Select a Location</h2>
        <p className="text-2xl text-slate-400 mt-4 text-center">Click on the map to place a pin where the photo was taken.</p>
        
        <div className="w-full h-96 my-6 rounded-2xl overflow-hidden border-2 border-slate-700">
          <MapContainer ref={mapRef} center={[20, 0]} zoom={2} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapEvents onMapClick={(latlng) => setPosition(latlng)} />
            {position && <Marker position={position}></Marker>}
          </MapContainer>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 mt-8">
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 text-3xl py-6 px-8 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-transform transform hover:scale-105"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!position}
            className="w-full sm:w-1/2 text-3xl py-6 px-8 bg-blue-600 text-white font-bold rounded-2xl transition-transform transform hover:scale-105 disabled:bg-slate-600 disabled:cursor-not-allowed disabled:transform-none"
          >
            Save Location
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
