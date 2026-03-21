
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HELP_STEPS = [
  { icon: 'fa-plus', text: 'Click "Add Files" to upload photos, videos, or documents.' },
  { icon: 'fa-th', text: 'Browse your files in the Photos tab — hover to preview, scroll to zoom.' },
  { icon: 'fa-check-square', text: 'Hover over an item and use the checkbox to select it, then Share, Download, or Delete from the toolbar.' },
  { icon: 'fa-map-marked-alt', text: 'Switch to the Map view to see geotagged photos plotted on an interactive map.' },
  { icon: 'fa-photo-video', text: 'Use the Albums tab to organise your files into named collections.' },
];

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
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

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="help-modal-title"
      aria-describedby="help-modal-description"
    >
      <div
        ref={modalRef}
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl p-8 sm:p-12"
        onClick={e => e.stopPropagation()}
      >
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full border-4 bg-blue-500/20 border-blue-500 mb-6">
          <i className="fas fa-question-circle text-5xl text-blue-400" aria-hidden="true"></i>
        </div>
        <h2 id="help-modal-title" className="text-5xl font-bold text-slate-100 text-center">
          Welcome to FamilyBridge Photos!
        </h2>
        <p id="help-modal-description" className="text-2xl mt-4 text-slate-400 text-center">
          Here's how to get started:
        </p>
        <ol className="mt-8 space-y-5" aria-label="How to use FamilyBridge Photos">
          {HELP_STEPS.map((step, index) => (
            <li key={index} className="flex items-start gap-5">
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full bg-slate-700 text-blue-400 text-2xl">
                <i className={`fas ${step.icon}`} aria-hidden="true"></i>
              </div>
              <p className="text-2xl text-slate-200 leading-snug pt-2">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <button
            onClick={onClose}
            className="w-full text-3xl py-6 px-8 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-transform transform hover:scale-105"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
