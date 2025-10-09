import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Service } from '../types';
import NewServiceModal from '../components/services/NewServiceModal';
import EditServiceModal from '../components/services/EditServiceModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import CategoryManagerModal from '../components/services/CategoryManagerModal';
import { TrashIcon, PlusIcon } from '../components/icons/Icons';

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonColor?: 'pink' | 'red';
}

interface Category {
    id: number;
    name: string;
}

const ServicesPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
    });

    useEffect(() => {
        fetchServices();
        fetchCategories();
    }, []);

    const fetchServices = async () => {
        const { data, error } = await supabase
            .from('services')
            .select('*, breakDuration:break_time, service_categories(id, name)')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching services:', error);
        } else if (data) {
            const mappedData = data.map(s => ({
                ...s,
                id: s.id as number,
                price: s.price as number,
                category: s.service_categories?.name ?? 'Sin Categoría',
                category_id: s.service_categories?.id ?? null,
            }));
            setServices(mappedData as Service[]);
        }
    };

    const fetchCategories = async () => {
        const { data, error } = await supabase.from('service_categories').select('*').order('name');
        if (error) console.error('Error fetching categories:', error);
        else setCategories(data || []);
    };


    const handleAddCategory = async (name: string) => {
        if (!name.trim()) return;
        const { data, error } = await supabase.from('service_categories').insert({ name }).select();
        if (error) {
            console.error('Error adding category:', error);
            alert(`Error: ${error.message}`);
        } else if (data) {
            // No need to manually update state, fetchCategories will get the sorted list
            fetchCategories();
        }
    };

    const handleDeleteCategory = async (category: Category) => {
        const { data: servicesWithCategory, error: checkError } = await supabase.from('services').select('id').eq('category_id', category.id).limit(1);
        
        if (checkError) {
            alert(`Error al verificar servicios: ${checkError.message}`);
            return;
        }

        if (servicesWithCategory && servicesWithCategory.length > 0) {
            alert(`No se puede eliminar la categoría "${category.name}" porque está siendo utilizada por al menos un servicio.`);
            return;
        }

        setConfirmation({
            isOpen: true,
            title: 'Eliminar Categoría',
            message: `¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`,
            onConfirm: async () => {
                const { error } = await supabase.from('service_categories').delete().eq('id', category.id);
                if (error) {
                    alert(`Error al eliminar: ${error.message}`);
                } else {
                    fetchCategories();
                }
                setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
            confirmButtonColor: 'red',
        });
    };

    const handleAddService = async (newServiceData: Omit<Service, 'id' | 'category'> & { category_id: number | null }) => {
        const { breakDuration, ...rest } = newServiceData;
        const serviceToInsert = {
            ...rest,
            break_time: breakDuration,
        };

        const { error } = await supabase.from('services').insert([serviceToInsert]);

        if (error) {
            console.error('Error adding service:', error);
        } else {
            fetchServices();
            setIsNewModalOpen(false);
        }
    };

    const handleEditClick = (service: Service) => {
        setEditingService(service);
    };

    const handleUpdateService = async (updatedService: Service) => {
        setConfirmation({
            isOpen: true,
            title: 'Confirmar Cambios',
            message: `¿Estás seguro de que quieres guardar los cambios en "${updatedService.name}"?`,
            onConfirm: async () => {
                const { id, name, duration, price, breakDuration, category_id } = updatedService;
                const serviceToUpdate = {
                    name,
                    duration,
                    price,
                    break_time: breakDuration,
                    category_id,
                };

                const { error } = await supabase
                    .from('services')
                    .update(serviceToUpdate)
                    .eq('id', id);

                if (error) {
                    console.error('Error updating service:', error);
                } else {
                    fetchServices();
                    setEditingService(null);
                }
                setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
            confirmButtonColor: 'pink',
        });
    };

    const filteredServices = useMemo(() => {
        if (!searchTerm.trim()) return services;
        const lowercasedFilter = searchTerm.toLowerCase();
        return services.filter((service: Service) =>
            service.name.toLowerCase().includes(lowercasedFilter) ||
            service.category.toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, services]);
    
    const handleDeleteClick = (service: Service) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Servicio',
            message: `¿Estás seguro de que quieres eliminar "${service.name}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                const { error } = await supabase.from('services').delete().eq('id', service.id);

                if (error) {
                    console.error('Error deleting service:', error);
                }
                else {
                    fetchServices();
                }
                setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
            confirmButtonColor: 'red',
        });
    };

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Servicios</h1>
                        <p className="text-gray-500 mt-1">Define los tratamientos, duraciones y tiempos de preparación.</p>
                    </div>
                    <div className="flex space-x-3">
                        <button 
                            onClick={() => setIsCategoryModalOpen(true)}
                            className="bg-white border border-gray-300 text-gray-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-sm">
                            Gestionar Categorías
                        </button>
                        <button 
                            onClick={() => setIsNewModalOpen(true)}
                            className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm">
                            Nuevo Servicio
                        </button>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm">
                    <div className="mb-6">
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre o categoría..." 
                            className="w-full max-w-sm px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-100">
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Nombre</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Categoría</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Duración</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Break</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Precio</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredServices.map(service => (
                                    <tr key={service.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-800 font-medium">{service.name}</td>
                                        <td className="p-4 text-gray-600">
                                            <span className="bg-pink-100 text-pink-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded-full">
                                                {service.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-600">{service.duration} min</td>
                                        <td className="p-4 text-gray-600">{service.breakDuration} min</td>
                                        <td className="p-4 text-gray-600">{service.price} €</td>
                                        <td className="p-4 whitespace-nowrap space-x-4 flex items-center">
                                            <button onClick={() => handleEditClick(service)} className="text-pink-600 hover:underline text-sm font-medium">Editar</button>
                                            <button onClick={() => handleDeleteClick(service)} className="text-gray-500 hover:text-red-600 p-1 rounded-full transition-colors" aria-label={`Eliminar ${service.name}`}>
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <NewServiceModal 
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSave={handleAddService}
                categories={categories}
            />
             {editingService && (
                <EditServiceModal
                    isOpen={!!editingService}
                    onClose={() => setEditingService(null)}
                    onSave={handleUpdateService}
                    service={editingService}
                    categories={categories}
                />
            )}
            <CategoryManagerModal 
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                categories={categories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
            />
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                confirmButtonColor={confirmation.confirmButtonColor}
            />
        </>
    );
};

export default ServicesPage;