import React, { useState, useEffect, useMemo } from 'react';
import { Client, Professional } from '../../types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    clientData: Omit<Client, 'id' | 'registrationDate'> & { password?: string };
    noteData: { content: string; is_favorite: boolean; professional_id: string };
  }) => void;
  professionals: Professional[];
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSave, professionals }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [initialNote, setInitialNote] = useState('');
    const [isNoteFavorite, setIsNoteFavorite] = useState(false);
    const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (professionals.length > 0) {
                setSelectedProfessionalId(professionals[0].id);
            }
        } else {
            setTimeout(() => {
                setName('');
                setNickname('');
                setPhone('');
                setEmail('');
                setPassword('');
                setInitialNote('');
                setIsNoteFavorite(false);
                setSelectedProfessionalId('');
                setError('');
            }, 200);
        }
    }, [isOpen, professionals]);

    const isDirty = useMemo(() => {
        return name !== '' || nickname !== '' || phone !== '' || email !== '' || password !== '' || initialNote !== '';
    }, [name, nickname, phone, email, password, initialNote]);

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
        if (!name.trim() || !phone.trim()) {
            setError('Nombre y Teléfono son obligatorios.');
            return;
        }
        if (email && !password) {
            setError('Si introduces un email para crear una cuenta, la contraseña es obligatoria.');
            return;
        }
        if (initialNote.trim() && !selectedProfessionalId) {
            setError('Debes seleccionar el autor de la nota.');
            return;
        }
        setError('');
        onSave({
            clientData: {
                name,
                nickname: nickname || '-',
                phone,
                email,
                password,
            },
            noteData: {
                content: initialNote,
                is_favorite: isNoteFavorite,
                professional_id: selectedProfessionalId,
            }
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
                    <div className="p-8 max-h-[80vh] overflow-y-auto">
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Nuevo Cliente</h2>
                        <div className="space-y-5">
                            {/* Client data fields... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono <span className="text-red-500">*</span></label>
                                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>
                             <div>
                                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">Apodo</label>
                                <input type="text" id="nickname" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div className="p-4 border-t border-b border-gray-200">
                                <p className="text-sm text-gray-600">Para crear una cuenta de acceso para el cliente (opcional), rellena su email y una contraseña temporal.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Contraseña (si hay email)</label>
                                    <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                            </div>

                            {/* Initial Note Section */}
                            <div className="border-t border-gray-200 pt-5 space-y-3">
                                <h3 className="text-lg font-medium text-gray-800">Nota Inicial (Opcional)</h3>
                                <div>
                                    <label htmlFor="professional-select-new-client" className="block text-sm font-medium text-gray-700 mb-1">Autor de la nota</label>
                                    <select 
                                        id="professional-select-new-client" 
                                        value={selectedProfessionalId} 
                                        onChange={e => setSelectedProfessionalId(e.target.value)} 
                                        className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    >
                                        {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="initial-note" className="sr-only">Contenido de la nota</label>
                                    <textarea id="initial-note" rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" value={initialNote} onChange={(e) => setInitialNote(e.target.value)} placeholder="Añade aquí una nota inicial sobre el cliente..." />
                                </div>
                                <div className="flex items-center">
                                    <input id="is-initial-note-favorite" type="checkbox" className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500" checked={isNoteFavorite} onChange={(e) => setIsNoteFavorite(e.target.checked)} />
                                    <label htmlFor="is-initial-note-favorite" className="ml-2 block text-sm text-gray-900">Marcar como nota favorita</label>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                        <button type="button" onClick={handleCloseAttempt} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">Guardar Cliente</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewClientModal;