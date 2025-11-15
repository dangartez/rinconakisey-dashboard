
import React, { useState, useEffect, useMemo } from 'react';
import { Service } from '../../types';
import ComboBox from '../ui/ComboBox';

interface Category {
    id: number;
    name: string;
}

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Omit<Service, 'id' | 'category'> & { category_id: number | null }) => void;
  categories: Category[];
}

const NewServiceModal: React.FC<NewServiceModalProps> = ({ isOpen, onClose, onSave, categories }) => {
    const [name, setName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [duration, setDuration] = useState('');
    const [breakDuration, setBreakDuration] = useState(0);
    const [price, setPrice] = useState('');
    const [requiredProfessionals, setRequiredProfessionals] = useState(1);
    const [assignToAll, setAssignToAll] = useState(true); // Nuevo estado para el switch, por defecto en ON
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setName('');
                setSelectedCategory(null);
                setDuration('');
                setBreakDuration(0);
                setPrice('');
                setRequiredProfessionals(1);
                setAssignToAll(true); // Resetear a ON por defecto
                setError('');
            }, 200);
        }
    }, [isOpen]);

    const isDirty = useMemo(() => {
        return (
            name !== '' ||
            selectedCategory !== null ||
            duration !== '' ||
            breakDuration !== 0 ||
            price !== '' ||
            requiredProfessionals !== 1 ||
            assignToAll !== true // Considerar si el switch ha cambiado de su valor por defecto
        );
    }, [name, selectedCategory, duration, breakDuration, price, requiredProfessionals, assignToAll]);

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
        if (!name.trim() || !selectedCategory || !duration || !price) {
            setError('Todos los campos excepto Tiempo de Break son obligatorios.');
            return;
        }
        if (isNaN(Number(duration)) || isNaN(Number(price)) || Number(duration) < 0 || Number(price) < 0 || Number(requiredProfessionals) < 1) {
            setError('Duración, precio y número de profesionales deben ser números positivos.');
            return;
        }

        setError('');
        onSave({
            name,
            category_id: selectedCategory.id,
            duration: Number(duration),
            breakDuration: Number(breakDuration),
            price: Number(price),
            required_professionals: Number(requiredProfessionals),
            assign_to_all: assignToAll, // <-- Nuevo campo enviado
        } as any);
    };

    if (!isOpen) return null;

    const breakOptions = [0, 5, 10, 15, 20, 30];

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
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Nuevo Servicio</h2>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="service-name" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                                <input type="text" id="service-name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <ComboBox 
                                    items={categories}
                                    selectedValue={selectedCategory}
                                    onSelect={(item) => setSelectedCategory(item as Category | null)}
                                    placeholder="Buscar o seleccionar categoría..."
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                                    <input type="number" id="duration" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="0" />
                                </div>
                                <div className="relative">
                                    <label htmlFor="breakDuration" className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Break</label>
                                    <select id="breakDuration" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none">
                                        {breakOptions.map(option => (
                                            <option key={option} value={option}>{option} min</option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 top-6 flex items-center px-2 text-gray-700">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                                    <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="0" />
                                </div>
                                <div>
                                    <label htmlFor="required-professionals" className="block text-sm font-medium text-gray-700 mb-1">Nº Profesionales</label>
                                    <input type="number" id="required-professionals" value={requiredProfessionals} onChange={e => setRequiredProfessionals(Number(e.target.value))} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="1" />
                                </div>
                            </div>
                            {/* Nuevo switch para asignar a todas las profesionales */}
                            <label htmlFor="assign-to-all" className="flex items-center justify-between pt-4 cursor-pointer">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-700">Asignar a todas las profesionales</span>
                                    <span className="text-xs text-gray-500">Por defecto, el servicio se asignará a todas las profesionales.</span>
                                </div>
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        id="assign-to-all" 
                                        className="sr-only" 
                                        checked={assignToAll} 
                                        onChange={() => setAssignToAll(!assignToAll)} 
                                    />
                                    <div className="block bg-gray-300 w-14 h-8 rounded-full"></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${assignToAll ? 'translate-x-full bg-pink-500' : ''}`}></div>
                                </div>
                            </label>
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
                            className="px-5 py-2 text-sm font-semibold text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewServiceModal;
