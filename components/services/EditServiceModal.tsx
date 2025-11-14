import React, { useState, useEffect, useMemo } from 'react';
import { Service } from '../../types';
import ComboBox from '../ui/ComboBox';

interface Category {
    id: number;
    name: string;
}

interface EditServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  service: Service | null;
  categories: Category[];
}

const EditServiceModal: React.FC<EditServiceModalProps> = ({ isOpen, onClose, onSave, service, categories }) => {
    const [name, setName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [duration, setDuration] = useState('');
    const [breakDuration, setBreakDuration] = useState(0);
    const [price, setPrice] = useState('');
    const [requiredProfessionals, setRequiredProfessionals] = useState(1);
    const [error, setError] = useState('');
    const [initialState, setInitialState] = useState<Service & { required_professionals?: number } | null>(null);

    useEffect(() => {
        if (service) {
            const fullService = {
                ...service,
                required_professionals: service.required_professionals || 1
            };
            setName(fullService.name);
            const currentCategory = categories.find(c => c.id === fullService.category_id) || null;
            setSelectedCategory(currentCategory);
            setDuration(String(fullService.duration));
            setBreakDuration(fullService.breakDuration);
            setPrice(String(fullService.price));
            setRequiredProfessionals(fullService.required_professionals);
            setInitialState(fullService);
        }
    }, [service, categories]);

    const isDirty = useMemo(() => {
        if (!initialState) return false;
        return (
            initialState.name !== name ||
            initialState.category_id !== selectedCategory?.id ||
            initialState.duration !== Number(duration) ||
            initialState.breakDuration !== breakDuration ||
            initialState.price !== Number(price) ||
            initialState.required_professionals !== requiredProfessionals
        );
    }, [name, selectedCategory, duration, breakDuration, price, requiredProfessionals, initialState]);

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
        if (!service) return;

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
            ...service,
            name,
            category_id: selectedCategory.id,
            category: selectedCategory.name,
            duration: Number(duration),
            breakDuration: Number(breakDuration),
            price: Number(price),
            required_professionals: Number(requiredProfessionals),
        });
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
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Editar Servicio</h2>
                        <div className="space-y-5">
                            <div>
                                <label htmlFor="service-name-edit" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Servicio</label>
                                <input type="text" id="service-name-edit" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                            <div>
                                <label htmlFor="category-edit" className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                                <ComboBox 
                                    items={categories}
                                    selectedValue={selectedCategory}
                                    onSelect={(item) => setSelectedCategory(item as Category | null)}
                                    placeholder="Buscar o seleccionar categoría..."
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="duration-edit" className="block text-sm font-medium text-gray-700 mb-1">Duración (min)</label>
                                    <input type="number" id="duration-edit" value={duration} onChange={e => setDuration(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="0" />
                                </div>
                                <div className="relative">
                                    <label htmlFor="breakDuration-edit" className="block text-sm font-medium text-gray-700 mb-1">Tiempo de Break</label>
                                    <select id="breakDuration-edit" value={breakDuration} onChange={e => setBreakDuration(Number(e.target.value))} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 appearance-none">
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
                                    <label htmlFor="price-edit" className="block text-sm font-medium text-gray-700 mb-1">Precio (€)</label>
                                    <input type="number" id="price-edit" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="0" />
                                </div>
                                <div>
                                    <label htmlFor="required-professionals-edit" className="block text-sm font-medium text-gray-700 mb-1">Nº Profesionales</label>
                                    <input type="number" id="required-professionals-edit" value={requiredProfessionals} onChange={e => setRequiredProfessionals(Number(e.target.value))} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="1" />
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

export default EditServiceModal;
