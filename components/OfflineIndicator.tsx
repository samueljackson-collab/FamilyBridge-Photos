
import React from 'react';

interface OfflineIndicatorProps {
  isOnline: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline }) => {
  return (
    <div aria-live="polite">
        {isOnline ? (
          <div className="flex items-center gap-2 text-green-300 text-lg font-semibold" title="You are currently online.">
            <i className="fas fa-wifi"></i>
            <span>Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-yellow-400 text-lg font-semibold" title="You are currently offline. Some features may not be available.">
            <i className="fas fa-triangle-exclamation"></i>
            <span>Offline</span>
          </div>
        )}
    </div>
  );
};
