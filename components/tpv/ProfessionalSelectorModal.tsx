import React from 'react';
import { Professional } from '../../types';
import { UserCircleIcon } from '../icons/Icons';

interface ProfessionalSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  professionals: Professional[];
  onProfessionalSelect: (professional: Professional) => void;
}

const ProfessionalSelectorModal: React.FC<ProfessionalSelectorModalProps> = ({ isOpen, onClose, professionals, onProfessionalSelect }) => {
  if (!isOpen) {
    return null;
  }

  const handleSelect = (professional: Professional) => {
    onProfessionalSelect(professional);
    onClose();
  };

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
        onClick={onClose}
    >
        <div 
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all duration-300 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Seleccionar Profesional</h2>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {professionals.map(pro => (
                        <button
                            key={pro.id}
                            onClick={() => handleSelect(pro)}
                            className="w-full flex items-center p-3 text-left rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <UserCircleIcon className="h-8 w-8 text-gray-400 mr-3 flex-shrink-0" />
                            <span className="font-medium text-gray-800">{pro.name}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 rounded-b-2xl text-right">
                <button 
                    onClick={onClose} 
                    className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Cancelar
                </button>
            </div>
        </div>
    </div>
  );
};

export default ProfessionalSelectorModal;
