
import React, { useMemo, useEffect } from 'react';
import type { SharedDetails } from '../types';

interface SuccessScreenProps {
  details: SharedDetails | null;
  onSendMore: () => void;
}

const Thumbnail: React.FC<{ file: File }> = ({ file }) => {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    useEffect(() => {
        return () => URL.revokeObjectURL(url);
    }, [url]);

    return (
        <div className="flex-shrink-0 w-40 h-40 rounded-xl overflow-hidden shadow-lg">
            <img 
                src={url} 
                alt={`Preview of ${file.name}`}
                className="w-full h-full object-cover"
            />
        </div>
    );
};

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ details, onSendMore }) => {
  const imageFiles = useMemo(() => {
    return details?.files.filter(file => file.type.startsWith('image/')) || [];
  }, [details]);

  if (!details) {
    return (
      <div className="text-center bg-slate-900 p-12 rounded-3xl shadow-2xl border border-slate-700">
        <h2 className="text-5xl font-bold text-red-400">Something went wrong.</h2>
        <p className="text-3xl mt-4 text-slate-300">Please try sharing your files again.</p>
        <button
          onClick={onSendMore}
          className="mt-10 text-3xl py-6 px-12 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105"
        >
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="text-center bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto animate-fade-in border border-slate-700">
      <div className="mx-auto w-32 h-32 flex items-center justify-center bg-green-500/20 rounded-full border-4 border-green-500">
        <i className="fas fa-check text-7xl text-green-400"></i>
      </div>
      <h2 className="text-7xl font-bold text-slate-100 mt-8">All done!</h2>
      <p className="text-4xl text-slate-300 mt-4">Your files have been sent successfully.</p>
      
      <div className="text-left bg-slate-800 p-8 rounded-2xl mt-12 space-y-4 border border-slate-700">
        <h3 className="text-4xl font-bold mb-6 text-slate-200 text-center">Summary</h3>
        <p className="text-3xl"><strong className="font-semibold text-slate-400">Sent to:</strong> {details.recipientEmail}</p>
        <p className="text-3xl"><strong className="font-semibold text-slate-400">Total Files Sent:</strong> {details.files.length}</p>
      </div>

      {imageFiles.length > 0 && (
          <div className="mt-12 text-left">
              <h3 className="text-4xl font-bold text-slate-200 mb-6 text-center">Shared Photos</h3>
              <div className="flex overflow-x-auto space-x-4 pb-4">
                  {imageFiles.map(file => (
                      <Thumbnail key={`${file.name}-${file.lastModified}`} file={file} />
                  ))}
              </div>
          </div>
      )}

      <button
        onClick={onSendMore}
        className="mt-12 text-4xl py-6 px-12 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105"
      >
        Done
      </button>
    </div>
  );
};
