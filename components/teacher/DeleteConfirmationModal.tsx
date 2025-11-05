
import React from 'react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-gradient-to-b from-red-800 via-red-900 to-brand-deep-purple rounded-2xl p-6 flex flex-col items-center backdrop-blur-md border border-red-500/50 text-white text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mb-4 flex items-center justify-center rounded-full bg-red-500/30 border-2 border-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </div>
        <h2 className="text-xl font-bold font-orbitron">{title}</h2>
        <p className="text-sm text-gray-300 my-4">{message}</p>
        <div className="w-full flex space-x-4 mt-4">
          <button
            onClick={onClose}
            className="w-full bg-gray-500/50 text-white font-semibold py-2 rounded-lg transition-colors hover:bg-gray-400/50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="w-full bg-red-600 text-white font-semibold py-2 rounded-lg transition-all duration-300 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/30"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
