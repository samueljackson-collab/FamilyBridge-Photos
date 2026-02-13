
import React, { useState, useEffect, useMemo } from 'react';
import { getFileIcon, formatBytes } from '../utils/fileUtils';

type UploadStatus = 'uploading' | 'paused' | 'cancelled' | 'complete';

interface UploadState {
    file: File;
    progress: number;
    status: UploadStatus;
    intervalId?: number;
}

const FileUploadItem: React.FC<{
    upload: UploadState;
    onPause: () => void;
    onResume: () => void;
    onCancel: () => void;
}> = ({ upload, onPause, onResume, onCancel }) => {
    const { file, progress, status } = upload;

    const getProgressBarStyles = () => {
        switch (status) {
            case 'complete': return 'bg-green-500 progress-bar-complete';
            case 'paused': return 'bg-yellow-500';
            case 'cancelled': return 'bg-slate-600';
            default: return 'bg-blue-500 progress-bar-striped';
        }
    };
    
    const progressText = useMemo(() => {
        const uploadedBytes = (file.size * progress) / 100;
        if (status === 'uploading' || status === 'paused') {
            return `${formatBytes(uploadedBytes, 1)} / ${formatBytes(file.size, 1)}`;
        }
        return formatBytes(file.size);
    }, [file.size, progress, status]);

    const statusText: Record<UploadStatus, string> = {
        uploading: `${Math.round(progress)}%`,
        paused: 'Paused',
        cancelled: 'Cancelled',
        complete: 'Done!',
    };
    
    const statusIcon: Record<UploadStatus, string> = {
        uploading: '',
        paused: 'fas fa-pause-circle',
        cancelled: 'fas fa-times-circle text-red-400',
        complete: 'fas fa-check-circle text-green-400',
    };

    return (
        <div className={`bg-slate-800/50 p-6 rounded-2xl border border-slate-700 space-y-4 shadow-inner shadow-black/20 ${status === 'cancelled' ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-6">
                <i className={`${getFileIcon(file)} text-5xl text-slate-400 w-16 text-center pt-1`} aria-hidden="true"></i>
                <div className="flex-grow overflow-hidden">
                    <p className="text-3xl font-semibold truncate text-slate-100" title={file.name}>{file.name}</p>
                    <p className="text-2xl text-slate-400">{progressText}</p>
                </div>
                <div className="w-24 text-center flex items-center justify-center h-full" aria-live="polite">
                     {statusIcon[status] && <i className={`${statusIcon[status]} text-5xl`} aria-label={statusText[status]}></i>}
                </div>
            </div>
            
            <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden relative border-2 border-slate-600" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Upload progress for ${file.name}`}>
                <div
                    className={`h-full rounded-full transition-all duration-200 ease-linear ${getProgressBarStyles()}`}
                    style={{ width: `${progress}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-xl" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.8)'}}>
                        {status === 'uploading' ? `${Math.round(progress)}%` : statusText[status]}
                    </span>
                </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-2">
                {status === 'uploading' && (
                    <button onClick={onPause} className="text-xl py-2 px-5 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"><i className="fas fa-pause"></i><span>Pause</span></button>
                )}
                {status === 'paused' && (
                    <button onClick={onResume} className="text-xl py-2 px-5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"><i className="fas fa-play"></i><span>Resume</span></button>
                )}
                {status !== 'complete' && status !== 'cancelled' && (
                    <button onClick={onCancel} className="text-xl py-2 px-5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"><i className="fas fa-times"></i><span>Cancel</span></button>
                )}
            </div>
        </div>
    );
};

interface FileUploadScreenProps {
    filesToUpload: File[];
    onUploadComplete: (uploadedFiles: File[]) => void;
}

export const FileUploadScreen: React.FC<FileUploadScreenProps> = ({ filesToUpload, onUploadComplete }) => {
    const [uploads, setUploads] = useState<UploadState[]>([]);

    useEffect(() => {
        setUploads(filesToUpload.map(file => ({
            file,
            progress: 0,
            status: 'uploading',
        })));
    }, [filesToUpload]);
    
    useEffect(() => {
        const tick = (key: string) => {
            setUploads(prev => prev.map(u => {
                const fileKey = `${u.file.name}-${u.file.size}`;
                if (fileKey !== key || u.status !== 'uploading' || u.progress >= 100) {
                    return u;
                }
                const nextProgress = Math.min(u.progress + 5, 100);
                return { ...u, progress: nextProgress, status: nextProgress >= 100 ? 'complete' : u.status };
            }));
        };

        uploads.forEach((upload, index) => {
            if (upload.status === 'uploading' && !upload.intervalId && upload.progress < 100) {
                const key = `${upload.file.name}-${upload.file.size}`;
                
                // Realistic duration calculation based on file size
                const SIMULATED_SPEED_BPS = 3 * 1024 * 1024; // 3 MB/s
                const durationMs = Math.max(500, (upload.file.size / SIMULATED_SPEED_BPS) * 1000);
                const intervalTime = durationMs / 20; // 20 steps for 100% (5% per step)

                const intervalId = window.setInterval(() => tick(key), intervalTime);
                
                setUploads(prev => {
                    const newUploads = [...prev];
                    if(newUploads[index]) {
                        newUploads[index].intervalId = intervalId;
                    }
                    return newUploads;
                });
            }
        });
        
        return () => {
            uploads.forEach(u => {
                if (u.intervalId) clearInterval(u.intervalId);
            });
        };
    }, [uploads]);

    const handleControl = (key: string, newStatus: UploadStatus) => {
        setUploads(prev => prev.map(u => {
            const fileKey = `${u.file.name}-${u.file.size}`;
            if (fileKey === key) {
                if (u.intervalId) clearInterval(u.intervalId);
                return { ...u, status: newStatus, intervalId: undefined };
            }
            return u;
        }));
    };
    
    const handlePause = (key: string) => handleControl(key, 'paused');
    const handleResume = (key: string) => handleControl(key, 'uploading');
    const handleCancel = (key: string) => handleControl(key, 'cancelled');

    const handleClose = () => {
        const completedFiles = uploads
            .filter(u => u.status === 'complete')
            .map(u => u.file);
        onUploadComplete(completedFiles);
    };

    const { 
        completedCount, 
        activeCount, 
        cancelledCount,
        totalSize,
        totalUploaded
    } = useMemo(() => {
        let totalSize = 0;
        let totalUploaded = 0;
        const result = uploads.reduce((acc, u) => {
            if (u.status !== 'cancelled') {
                totalSize += u.file.size;
                totalUploaded += (u.file.size * u.progress) / 100;
            }

            if (u.status === 'complete') acc.completedCount++;
            if (u.status === 'uploading' || u.status === 'paused') acc.activeCount++;
            if (u.status === 'cancelled') acc.cancelledCount++;
            return acc;
        }, { completedCount: 0, activeCount: 0, cancelledCount: 0 });
        
        return { ...result, totalSize, totalUploaded };
    }, [uploads]);

    const totalFiles = filesToUpload.length;
    const totalUploadable = totalFiles - cancelledCount;
    const isFinished = activeCount === 0 && totalFiles > 0;
    const overallProgress = totalSize > 0 ? (totalUploaded / totalSize) * 100 : 0;

    return (
        <div className="w-full max-w-5xl mx-auto animate-fade-in">
             <style>
                {`
                    @keyframes progress-stripes {
                        from { background-position: 40px 0; }
                        to { background-position: 0 0; }
                    }
                    .progress-bar-striped {
                        background-image: linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent);
                        background-size: 40px 40px;
                        animation: progress-stripes 1s linear infinite;
                    }
                    @keyframes complete-glow {
                        0%, 100% { box-shadow: 0 0 4px #10b981, 0 0 8px #10b981; }
                        50% { box-shadow: 0 0 16px #34d399, 0 0 24px #34d399; }
                    }
                    .progress-bar-complete {
                        animation: complete-glow 2.5s ease-in-out infinite;
                    }
                `}
            </style>
            <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl border border-slate-700 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800/50 to-slate-900">
                <div className="text-center mb-10">
                    <h2 className="text-6xl font-bold text-slate-100">{isFinished ? 'Uploads Finished' : 'Adding Your Files...'}</h2>
                    <p className="text-3xl mt-4 text-slate-400" aria-live="polite">
                        {isFinished 
                            ? `Completed ${completedCount} of ${totalUploadable} file(s).` 
                            : `Uploading ${completedCount} of ${totalUploadable} files...`
                        }
                    </p>
                    
                    {!isFinished && (
                        <div className="mt-6 space-y-3 max-w-2xl mx-auto">
                            <div className="w-full bg-slate-700 rounded-full h-8 overflow-hidden border-2 border-slate-600 shadow-inner" title={`Overall Progress: ${Math.round(overallProgress)}%`}>
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-200 ease-linear flex items-center justify-center text-white font-bold"
                                    style={{ width: `${overallProgress}%` }}
                                >
                                    
                                </div>
                            </div>
                             <p className="text-2xl text-slate-300 font-semibold">
                                {formatBytes(totalUploaded)} / {formatBytes(totalSize)}
                                <span className="ml-4 text-slate-400">({Math.round(overallProgress)}%)</span>
                            </p>
                        </div>
                    )}
                </div>
                
                <div className="space-y-6 max-h-[50vh] overflow-y-auto p-2 -mr-2">
                    {uploads.map(upload => {
                        const key = `${upload.file.name}-${upload.file.size}`;
                        return (
                           <FileUploadItem
                                key={key}
                                upload={upload}
                                onPause={() => handlePause(key)}
                                onResume={() => handleResume(key)}
                                onCancel={() => handleCancel(key)}
                            />
                        );
                    })}
                </div>
                {isFinished && (
                    <div className="text-center mt-10">
                        <button
                            onClick={handleClose}
                            className="text-4xl py-6 px-12 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
