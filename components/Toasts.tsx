
import React, { useEffect } from 'react';
import { CloseIcon } from './Icons';

export interface ToastMessage {
  id: number;
  title: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);
  
  const typeClasses = {
      success: {
          bg: 'bg-lime-50',
          border: 'border-brand-green',
          iconColor: 'text-brand-green',
          icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
      },
      info: {
          bg: 'bg-slate-100',
          border: 'border-slate-400',
          iconColor: 'text-slate-600',
          icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
      },
      error: {
          bg: 'bg-red-50',
          border: 'border-red-400',
          iconColor: 'text-red-500',
          icon: <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
      }
  };
  
  const classes = typeClasses[toast.type];

  return (
    <div className={`max-w-sm w-full ${classes.bg} shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden animate-fade-in-down border-l-4 ${classes.border}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className={`flex-shrink-0 ${classes.iconColor}`}>
            {classes.icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className="text-sm font-bold text-gray-900">{toast.title}</p>
            <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button onClick={() => onClose(toast.id)} className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-green">
              <span className="sr-only">Close</span>
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div aria-live="assertive" className="fixed inset-0 flex items-start px-4 py-6 pointer-events-none sm:p-6 z-[10000] print:hidden">
            <div className="w-full flex flex-col items-end space-y-4">
                {toasts.map(toast => (
                    <Toast key={toast.id} toast={toast} onClose={removeToast} />
                ))}
            </div>
        </div>
    );
};

export default ToastContainer;
