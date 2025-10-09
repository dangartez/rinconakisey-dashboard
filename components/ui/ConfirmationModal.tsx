import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: 'pink' | 'red' | 'green';
  singleButton?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmButtonText = 'Confirmar',
  cancelButtonText = 'Cancelar',
  confirmButtonColor = 'pink',
  singleButton = false,
}) => {
  if (!isOpen) return null;

  const colorClasses = {
    pink: 'bg-pink-600 hover:bg-pink-700',
    red: 'bg-red-600 hover:bg-red-700',
    green: 'bg-green-600 hover:bg-green-700',
  };

  const handleConfirmAction = () => {
      onConfirm();
      onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
      onClick={onClose} 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-scaleUp text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 mb-8">{message}</p>
        </div>
        
        <div className={`bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-center items-center ${singleButton ? '' : 'space-x-4'}`}>
          {!singleButton && (
            <button 
              type="button"
              onClick={onClose} 
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors w-full"
            >
              {cancelButtonText}
            </button>
          )}
          <button 
            type="button"
            onClick={handleConfirmAction}
            className={`px-6 py-2.5 text-sm font-semibold text-white rounded-lg transition-colors ${singleButton ? 'w-1/2' : 'w-full'} ${colorClasses[confirmButtonColor]}`}
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;