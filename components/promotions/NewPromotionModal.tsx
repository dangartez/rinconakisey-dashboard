import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Promotion, Service } from '../../types';
import { UploadIcon } from '../icons/Icons';
import ToggleSwitch from '../ui/ToggleSwitch';
import { supabase } from '../../lib/supabaseClient';

type NewPromotionData = Omit<Promotion, 'id' | 'image'> & {
    imageFile?: File;
    serviceIds: number[];
};

interface NewPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (promotion: NewPromotionData) => void;
}

const NewPromotionModal: React.FC<NewPromotionModalProps> = ({ isOpen, onClose, onSave }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [originalPrice, setOriginalPrice] = useState('');
    const [promoPrice, setPromoPrice] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | undefined>();
    const [imagePreview, setImagePreview] = useState<string | undefined>();
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [services, setServices] = useState<Service[]>([]);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            const fetchServices = async () => {
                const { data, error } = await supabase.from('services').select('id, name');
                if (error) {
                    console.error('Error fetching services:', error);
                } else {
                    setServices(data as Service[]);
                }
            };
            fetchServices();
        } else {
            setTimeout(() => {
                setTitle('');
                setDescription('');
                setOriginalPrice('');
                setPromoPrice('');
                setIsActive(true);
                setImageFile(undefined);
                setImagePreview(undefined);
                setSelectedServiceIds([]);
                setSearchTerm('');
                setError('');
            }, 200);
        }
    }, [isOpen]);

    const filteredServices = useMemo(() => {
        return services.filter(service =>
            service.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [services, searchTerm]);

    const isDirty = useMemo(() => {
        return (
            title !== '' ||
            description !== '' ||
            originalPrice !== '' ||
            promoPrice !== '' ||
            isActive !== true ||
            imageFile !== undefined ||
            selectedServiceIds.length > 0
        );
    }, [title, description, originalPrice, promoPrice, isActive, imageFile, selectedServiceIds]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
        }
    };

    const handleServiceToggle = (serviceId: number) => {
        setSelectedServiceIds(prev => 
            prev.includes(serviceId) 
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

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
        if (!title.trim() || !originalPrice || !promoPrice) {
            setError('El título y los precios son obligatorios.');
            return;
        }
        if (isNaN(Number(originalPrice)) || isNaN(Number(promoPrice)) || Number(originalPrice) < 0 || Number(promoPrice) < 0) {
            setError('Los precios deben ser números positivos.');
            return;
        }
        if (selectedServiceIds.length === 0) {
            setError('Debes seleccionar al menos un servicio para la promoción.');
            return;
        }

        setError('');
        onSave({
            title,
            description,
            originalPrice: Number(originalPrice),
            promoPrice: Number(promoPrice),
            isActive: isActive,
            imageFile,
            serviceIds: selectedServiceIds,
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-scaleUp max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-8 overflow-y-auto min-h-0">
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Nueva Promoción</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                            <div className="md:col-span-2">
                                <label htmlFor="promo-title" className="block text-sm font-medium text-gray-700 mb-1">Título de la Promoción <span className="text-red-500">*</span></label>
                                <input type="text" id="promo-title" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                            </div>
                             <div className="md:col-span-2">
                                <label htmlFor="promo-description" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea id="promo-description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
                            </div>
                            <div>
                                <label htmlFor="original-price" className="block text-sm font-medium text-gray-700 mb-1">Precio Original (€) <span className="text-red-500">*</span></label>
                                <input type="number" id="original-price" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="0" />
                            </div>
                            <div>
                                <label htmlFor="promo-price" className="block text-sm font-medium text-gray-700 mb-1">Precio Promoción (€) <span className="text-red-500">*</span></label>
                                <input type="number" id="promo-price" value={promoPrice} onChange={e => setPromoPrice(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" min="0" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Servicios Incluidos <span className="text-red-500">*</span></label>
                                <input 
                                    type="text"
                                    placeholder="Buscar servicios..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                                <div className="max-h-40 overflow-y-auto bg-white border border-gray-300 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {filteredServices.map(service => (
                                        <label key={service.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={selectedServiceIds.includes(service.id)}
                                                onChange={() => handleServiceToggle(service.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                            />
                                            <span className="text-sm text-gray-800">{service.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
                                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" className="w-full h-full rounded-lg object-cover"/>
                                        ) : (
                                            <div className="text-gray-400 text-center p-2">
                                                <UploadIcon className="h-6 w-6 mx-auto"/>
                                                <span className="text-xs mt-1 block">Subir</span>
                                            </div>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg">
                                        Seleccionar imagen
                                    </button>
                                </div>
                            </div>
                             <div className="md:col-span-2 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                <div className="text-sm">
                                    <h4 className="font-medium text-gray-800">Estado de la promoción</h4>
                                    <p className="text-gray-500">{isActive ? 'La promoción estará visible para los clientes.' : 'La promoción permanecerá oculta.'}</p>
                                </div>
                                <ToggleSwitch enabled={isActive} onChange={setIsActive} />
                            </div>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3 mt-auto border-t">
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
                            Guardar Promoción
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewPromotionModal;
