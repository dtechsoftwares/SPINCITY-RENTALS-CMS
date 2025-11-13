import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

interface NotificationProps {
  message: string;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto-close after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-5 right-5 bg-brand-green text-white py-3 px-5 rounded-lg shadow-lg flex items-center space-x-4 z-[10000] animate-fade-in-down" role="alert">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      <span>{message}</span>
      <button onClick={onClose} className="ml-auto -mr-1 p-1 rounded-full hover:bg-white/20">
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;