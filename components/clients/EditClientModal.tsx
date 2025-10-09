import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client) => void;
  client: Client | null;
}

// DD/MM/YYYY -> YYYY-MM-DD
const parseDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length !== 3) return '';
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// YYYY-MM-DD -> DD/MM/YYYY
const formatDateForStorage = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};


const EditClientModal: React.FC<EditClientModalProps> = ({ isOpen, onClose, onSave, client }) => {
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [registrationDate, setRegistrationDate] = useState('');
    const [error, setError] = useState('');
    const [initialState, setInitialState] = useState<Partial<Client>>({});

    useEffect(() => {
        if (isOpen && client) {
            const initial = {
                name: client.name,
                nickname: client.nickname,
                phone: client.phone,
                email: client.email,
                registrationDate: parseDateForInput(client.registrationDate),
            };
            setName(initial.name);
            setNickname(initial.nickname);
            setPhone(initial.phone);
            setEmail(initial.email);
            setRegistrationDate(initial.registrationDate);
            setInitialState(initial);
        } else if (!isOpen) {
            setTimeout(() => {
                setError('');
            }, 200);
        }
    }, [isOpen, client]);

    const isDirty = useMemo(() => {
        return (
            initialState.name !== name ||
            initialState.nickname !== nickname ||
            initialState.phone !== phone ||
            initialState.email !== email ||
            initialState.registrationDate !== registrationDate
        );
    }, [name, nickname, phone, email, registrationDate, initialState]);

    const handleCloseAttempt = () => {
        if (isDirty) {
            if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!client) return;
        if (!name.trim() || !phone.trim()) {
            setError('Nombre y Teléfono son obligatorios.');
            return;
        }
        setError('');
        onSave({
            ...client,
            name,
            nickname: nickname || '-',
            phone,
            email,
            registrationDate: client.registrationDate, // Keep original date
        });
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
            onClick={handleCloseAttempt} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="p-8">
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Editar Cliente</h2>
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="name-edit" className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                                    <input type="text" id="name-edit" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="phone-edit" className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
                                    <input type="tel" id="phone-edit" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="email-edit" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="email-edit" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="nickname-edit" className="block text-sm font-medium text-gray-700 mb-1">Apodo</label>
                                    <input type="text" id="nickname-edit" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="registrationDate-edit" className="block text-sm font-medium text-gray-700 mb-1">Fecha de Alta</label>
                                <input type="text" id="registrationDate-edit" value={client?.registrationDate} readOnly className="w-full bg-gray-100 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none" />
                            </div>

                            <div className="border-t pt-5 mt-5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Cuenta de App</span>
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${client?.user_id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {client?.user_id ? 'Vinculada' : 'No vinculada'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Código de Cliente</span>
                                    <span className="font-mono bg-gray-100 text-gray-800 px-3 py-1 rounded">
                                        {client?.claim_code}
                                    </span>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                        <button 
                            type="button"
                            onClick={handleCloseAttempt} 
                            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditClientModal;