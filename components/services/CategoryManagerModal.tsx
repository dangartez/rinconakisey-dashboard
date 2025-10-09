import React, { useState, useMemo } from 'react';
import { TrashIcon, PlusIcon } from '../icons/Icons';

interface Category {
    id: number;
    name: string;
}

interface CategoryManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    onAddCategory: (name: string) => Promise<void>;
    onDeleteCategory: (category: Category) => Promise<void>;
}

const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({ isOpen, onClose, categories, onAddCategory, onDeleteCategory }) => {
    const [newCategoryName, setNewCategoryName] = useState('');

    const filteredCategories = useMemo(() => {
        if (!newCategoryName.trim()) {
            return categories;
        }
        const lowercasedFilter = newCategoryName.toLowerCase();
        return categories.filter(cat => cat.name.toLowerCase().includes(lowercasedFilter));
    }, [categories, newCategoryName]);

    if (!isOpen) return null;

    const handleAddClick = () => {
        onAddCategory(newCategoryName).then(() => {
            setNewCategoryName('');
        });
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="category-modal-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <h2 id="category-modal-title" className="text-3xl font-bold text-gray-900 mb-2">Gestionar Categorías</h2>
                    <p className="text-gray-500 mb-6">Añade o elimina categorías de servicios.</p>
                    
                    <div className="flex space-x-2 mb-4">
                        <input 
                            type="text" 
                            placeholder="Buscar o crear categoría..." 
                            className="flex-grow px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddClick()}
                        />
                        <button onClick={handleAddClick} className="bg-pink-600 text-white p-2 rounded-lg hover:bg-pink-700 transition-colors flex-shrink-0">
                            <PlusIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <div className="space-y-3 h-64 overflow-y-auto pr-2 border-t pt-4">
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map(cat => (
                                <div key={cat.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg animate-fadeIn">
                                    <span className="text-gray-700 font-medium">{cat.name}</span>
                                    <button onClick={() => onDeleteCategory(cat)} className="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500">No hay categorías que coincidan.</p>
                                {newCategoryName.trim() && <p className="text-gray-400 text-sm">Puedes crear la categoría "{newCategoryName}".</p>}
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end">
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryManagerModal;
