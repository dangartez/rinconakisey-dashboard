import React from 'react';
import { Service } from '../../types';
import { XMarkIcon } from '../icons/Icons';

interface EditGroupPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditSingle: () => void;
  onEditGroup: () => void;
  groupServices: Service[];
  clickedService: Service;
}

const EditGroupPromptModal: React.FC<EditGroupPromptModalProps> = ({ 
    isOpen, 
    onClose, 
    onEditSingle, 
    onEditGroup, 
    groupServices, 
    clickedService 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
                <div className="flex justify-between items-start mb-4">
                    <h2 id="modal-title" className="text-2xl font-bold text-gray-900">Editar Reserva en Grupo</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
                        <XMarkIcon className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                
                <p className="text-gray-600 mb-4">
                    Esta cita para <span className="font-semibold">{clickedService?.name}</span> forma parte de una reserva con varios servicios.
                </p>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-700 mb-2">Servicios en esta reserva:</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                        {groupServices.map(s => <li key={s.id}>{s.name}</li>)}
                    </ul>
                </div>

                <p className="text-gray-600 mb-6 font-medium">¿Qué te gustaría modificar?</p>

                <div className="flex flex-col space-y-3">
                    <button 
                        onClick={onEditGroup} 
                        className="w-full px-6 py-3 rounded-lg font-semibold bg-pink-600 text-white hover:bg-pink-700 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
                    >
                        La reserva completa
                    </button>
                    <button 
                        onClick={onEditSingle} 
                        className="w-full px-6 py-3 rounded-lg font-semibold bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                        Solo "{clickedService?.name}"
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default EditGroupPromptModal;
