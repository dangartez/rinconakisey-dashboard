
import React, { useState, useEffect } from 'react';
import { InformationCircleIcon } from '../icons/Icons';

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
    confirmationText: string;
    isLoading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    itemName, 
    confirmationText,
    isLoading
}) => {
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (isOpen) {
            setInputValue(''); // Reset input on open
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const isConfirmationTextMatched = inputValue === confirmationText;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <InformationCircleIcon className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-gray-900">¿Estás absolutamente seguro?</h3>
                    <div className="mt-2 px-4 text-sm text-gray-600">
                        <p>Esta acción es irreversible. Se borrará permanentemente <strong>{itemName}</strong> y todos sus datos asociados.</p>
                        <p className="mt-4">Para confirmar, por favor, escribe <strong className="text-red-600">{confirmationText}</strong> en el campo de abajo.</p>
                    </div>
                    <div className="mt-6">
                        <input 
                            type="text" 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder={`Escribe ${confirmationText}`}
                        />
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={!isConfirmationTextMatched || isLoading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:w-auto sm:text-sm disabled:bg-red-300 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Borrando...' : 'Entiendo las consecuencias, borrar'}
                    </button>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmationModal;
