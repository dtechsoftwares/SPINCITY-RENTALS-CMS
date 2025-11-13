import React, { useState, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface AdminKeyConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  adminKey: string;
  showNotification: (message: string) => void;
}

const AdminKeyConfirmationModal: React.FC<AdminKeyConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, adminKey, showNotification }) => {
  const [enteredKey, setEnteredKey] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state every time the modal opens
      setEnteredKey('');
      setIsVerified(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = () => {
    if (enteredKey === adminKey) {
      setIsVerified(true);
      showNotification('Admin key verified successfully.');
    } else {
      showNotification('Incorrect Admin Key.');
      setEnteredKey('');
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleClose = () => {
      onClose();
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 animate-fade-in-down">
      <div className="bg-white text-brand-text w-full max-w-lg rounded-xl shadow-2xl border border-gray-200">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-red-600 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {title}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-brand-text">
            <CloseIcon />
          </button>
        </div>
        
        {!isVerified ? (
          <>
            {/* Verification Step */}
            <div className="p-6 space-y-4">
                <p className="text-gray-600">{message}</p>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Please enter the Admin Key to proceed:</label>
                  <input 
                    type="password"
                    value={enteredKey}
                    onChange={(e) => setEnteredKey(e.target.value)}
                    className="w-full bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <p className="text-sm text-gray-500">This action requires verification.</p>
            </div>
            <div className="flex justify-end space-x-4 p-6 bg-gray-50 rounded-b-xl">
                <button onClick={handleClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                </button>
                <button onClick={handleVerify} className="bg-yellow-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-600 transition-colors">
                    Verify Key
                </button>
            </div>
          </>
        ) : (
          <>
            {/* Confirmation Step */}
            <div className="p-6 space-y-4 text-center">
                <div className="text-5xl text-green-500 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-green-600">You have been verified!</h3>
                <p className="text-gray-600">
                    Are you absolutely sure you want to delete this item? This action is irreversible.
                </p>
            </div>
            <div className="flex justify-end space-x-4 p-6 bg-gray-50 rounded-b-xl">
                <button onClick={handleClose} className="bg-gray-200 text-gray-700 font-bold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                    Cancel
                </button>
                <button onClick={handleConfirm} className="bg-red-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-700 transition-colors">
                    Confirm Delete
                </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminKeyConfirmationModal;
