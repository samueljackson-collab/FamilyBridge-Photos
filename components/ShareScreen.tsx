
import React, { useState } from 'react';
import { formatBytes } from '../utils/fileUtils';

interface ShareScreenProps {
  files: File[];
  onSend: (details: { recipientEmail: string; senderEmail: string; message: string; }) => void;
  onCancel: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ShareScreen: React.FC<ShareScreenProps> = ({ files, onSend, onCancel }) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !senderEmail) {
      setError('Please fill out both email fields.');
      return;
    }
    if (!EMAIL_REGEX.test(recipientEmail) || !EMAIL_REGEX.test(senderEmail)) {
      setError('Please enter valid email addresses.');
      return;
    }
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onSend({ recipientEmail, senderEmail, message });
    }, 1500);
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="bg-slate-900 p-8 sm:p-12 rounded-3xl shadow-2xl w-full max-w-4xl mx-auto border border-slate-700 animate-fade-in">
        <h2 className="text-6xl font-bold mb-4 text-slate-100 text-center">Share Files</h2>
        <p className="text-xl text-center text-amber-400 mb-8">
          <i className="fas fa-info-circle mr-2"></i>
          Demo mode &mdash; sharing is saved locally only. Connect a backend to send real emails.
        </p>

        <div className="bg-slate-800 p-6 rounded-2xl mb-8 text-center">
            <p className="text-3xl text-slate-300">You are sending <strong className="text-blue-400">{files.length}</strong> file(s)</p>
            <p className="text-2xl text-slate-400 mt-2">Total size: <strong className="text-blue-400">{formatBytes(totalSize)}</strong></p>
        </div>

        <form onSubmit={handleSend} className="space-y-8">
        <div>
            <label htmlFor="recipientEmail" className="block text-3xl font-semibold text-slate-300 mb-3">
            Who are you sending to?
            </label>
            <input
            id="recipientEmail"
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            placeholder="Recipient's email address"
            required
            className="w-full p-5 text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition"
            />
        </div>
        <div>
            <label htmlFor="senderEmail" className="block text-3xl font-semibold text-slate-300 mb-3">
            What's your email?
            </label>
            <input
            id="senderEmail"
            type="email"
            value={senderEmail}
            onChange={(e) => setSenderEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full p-5 text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition"
            />
        </div>
        <div>
            <label htmlFor="message" className="block text-3xl font-semibold text-slate-300 mb-3">
            Add a message (Optional)
            </label>
            <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi, here are the photos..."
            rows={4}
            className="w-full p-5 text-2xl bg-slate-950 border-2 border-slate-700 rounded-xl focus:ring-4 focus:ring-blue-500/50 focus:border-blue-500 transition"
            />
        </div>

        {error && <p className="text-red-400 text-2xl font-semibold text-center">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-6 mt-10">
            <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-1/2 text-3xl py-6 px-8 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-transform transform hover:scale-105"
            >
            Cancel
            </button>
            <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-1/2 text-3xl py-6 px-8 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-blue-800 disabled:cursor-not-allowed flex items-center justify-center gap-4"
            >
            {isLoading ? (
                <>
                <i className="fas fa-spinner fa-spin"></i>
                Sending...
                </>
            ) : (
                'Send Files'
            )}
            </button>
        </div>
        </form>
    </div>
  );
};