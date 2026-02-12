
import React from 'react';

export const UploadIndicator = () => {
    return (
        <div 
            className="mb-8 p-8 bg-slate-900 rounded-3xl border-2 border-slate-800 text-center shadow-2xl" 
            role="status"
            aria-live="assertive"
            style={{ animation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
        >
            <i className="fas fa-cloud-upload-alt text-8xl text-blue-400 mb-6" style={{ animation: 'spin 3s linear infinite' }}></i>
            <h3 className="text-4xl font-bold text-slate-100 mb-4">Processing Your Memories...</h3>
            <p className="text-2xl text-slate-400 mb-8">This will just take a moment.</p>
            <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                <div 
                    className="bg-blue-500 h-4 rounded-full"
                    style={{
                        width: '100%',
                        animation: 'progress-indeterminate 1.5s infinite ease-in-out'
                    }}
                ></div>
            </div>
            <style>
                {`
                    @keyframes progress-indeterminate {
                        0% { transform: translateX(-100%) scaleX(0.5); }
                        50% { transform: translateX(0) scaleX(1); }
                        100% { transform: translateX(100%) scaleX(0.5); }
                    }
                    @keyframes pulse {
                        50% {
                            opacity: .85;
                        }
                    }
                    @keyframes spin {
                        from {
                            transform: rotate(0deg);
                        }
                        to {
                            transform: rotate(360deg);
                        }
                    }
                `}
            </style>
        </div>
    );
};
