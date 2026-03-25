'use client'

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal = ({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
        aria-hidden="true" 
      />
      <div 
        className={`bg-gray-900 border border-gray-800 rounded-3xl w-full ${sizes[size]} overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 flex flex-col`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
          {showCloseButton && (
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
            >
              <X size={20} />
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalContent = ({ className = '', children }: { className?: string, children: React.ReactNode }) => (
  <div className={`p-6 ${className}`}>{children}</div>
);

export const ModalFooter = ({ className = '', children }: { className?: string, children: React.ReactNode }) => (
  <div className={`p-6 border-t border-gray-800 flex items-center justify-end gap-3 bg-white/[0.02] ${className}`}>
    {children}
  </div>
);
