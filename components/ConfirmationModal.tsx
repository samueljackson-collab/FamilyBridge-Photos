
import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message,
    confirmText,
    cancelText = 'Cancel',
    confirmVariant = 'danger'
}) => {
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
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'fa-exclamation-triangle',
      iconContainerClasses: 'bg-red-500/20 border-red-500',
      iconClasses: 'text-red-400',
      buttonClasses: 'bg-red-600 hover:bg-red-700',
      defaultConfirmText: 'Delete',
    },
    primary: {
      icon: 'fa-question-circle',
      iconContainerClasses: 'bg-blue-500/20 border-blue-500',
      iconClasses: 'text-blue-400',
      buttonClasses: 'bg-blue-600 hover:bg-blue-700',
      defaultConfirmText: 'Confirm',
    }
  };

  const styles = variantStyles[confirmVariant];
  const finalConfirmText = confirmText || styles.defaultConfirmText;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-sm flex items-center justify-center animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirmation-title"
      aria-describedby="confirmation-message"
    >
      <div 
        ref={modalRef}
        className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-2xl p-8 sm:p-12 text-center"
        onClick={e => e.stopPropagation()}
      >
        <div className={`mx-auto w-24 h-24 flex items-center justify-center rounded-full border-4 ${styles.iconContainerClasses} mb-6`}>
            <i className={`fas ${styles.icon} text-5xl ${styles.iconClasses}`}></i>
        </div>
        <h2 id="confirmation-title" className="text-5xl font-bold text-slate-100">{title}</h2>
        <p id="confirmation-message" className="text-3xl mt-4 text-slate-400">{message}</p>
        <div className="flex flex-col sm:flex-row gap-6 mt-10">
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 text-3xl py-6 px-8 bg-slate-700 text-white font-bold rounded-2xl hover:bg-slate-600 transition-transform transform hover:scale-105"
            aria-label="Cancel action"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`w-full sm:w-1/2 text-3xl py-6 px-8 text-white font-bold rounded-2xl transition-transform transform hover:scale-105 ${styles.buttonClasses}`}
            aria-label="Confirm action"
          >
            {finalConfirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};