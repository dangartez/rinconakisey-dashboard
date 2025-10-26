import React from 'react';

interface AddNotePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const AddNotePromptModal: React.FC<AddNotePromptModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 animate-scaleUp" onClick={e => e.stopPropagation()}>
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Venta Completada</h2>
          <p className="text-gray-600 mb-6">¿Quieres añadir una nota al servicio realizado?</p>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-center items-center space-x-4">
          <button 
            onClick={onClose} 
            className="px-8 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            No
          </button>
          <button 
            onClick={onConfirm}
            className="px-8 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Sí
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNotePromptModal;
