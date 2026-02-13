
import React, { useMemo, useEffect } from 'react';
import type { SharedDetails } from '../types';

interface SharingHistoryScreenProps {
  history: SharedDetails[];
}

const Thumbnail: React.FC<{ file: File }> = ({ file }) => {
    const url = useMemo(() => URL.createObjectURL(file), [file]);
    useEffect(() => {
        return () => URL.revokeObjectURL(url);
    }, [url]);

    return (
        <img 
            src={url}
            alt={file.name}
            className="w-32 h-32 rounded-lg object-cover"
        />
    );
};

const HistoryItem: React.FC<{ item: SharedDetails }> = ({ item }) => {
    const imageFiles = useMemo(() => item.files.filter(f => f.type.startsWith('image/')), [item.files]);

    const formattedDate = useMemo(() => {
        return item.sharedAt.toLocaleString();
    }, [item.sharedAt]);

    return (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-2xl text-slate-400">Sent to:</p>
                    <p className="text-4xl font-bold text-blue-400">{item.recipientEmail}</p>
                    <p className="text-2xl text-slate-400 mt-4">{item.files.length} file(s) sent</p>
                </div>
                <p className="text-xl text-slate-500">{formattedDate}</p>
            </div>
            {item.message && (
                <blockquote className="my-6 p-4 bg-slate-800 border-l-4 border-slate-600 text-2xl text-slate-300 italic">
                    &ldquo;{item.message}&rdquo;
                </blockquote>
            )}
            {imageFiles.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-4">
                    {imageFiles.slice(0, 5).map(file => (
                        <Thumbnail key={`${file.name}-${file.lastModified}`} file={file} />
                    ))}
                    {imageFiles.length > 5 && (
                        <div className="w-32 h-32 rounded-lg bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-400">
                            +{imageFiles.length - 5}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export const SharingHistoryScreen: React.FC<SharingHistoryScreenProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="text-center bg-slate-900 p-12 rounded-3xl flex flex-col items-center border-2 border-slate-800 animate-fade-in">
        <i className="fas fa-history text-8xl text-slate-600 mb-6"></i>
        <h2 className="text-5xl font-bold text-slate-300">No Sharing History</h2>
        <p className="text-3xl mt-4 text-slate-500">Once you share files, your history will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-5xl md:text-6xl font-bold text-slate-100 mb-8">Sharing History</h2>
      {history.map((item, index) => (
        <HistoryItem key={index} item={item} />
      ))}
    </div>
  );
};
