import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Service } from '../../types';
import { SearchIcon, PlusIcon } from '../icons/Icons';

interface ServiceSelectorProps {
  onServiceSelect: (service: Service) => void;
}

const ServiceSelector: React.FC<ServiceSelectorProps> = ({ onServiceSelect }) => {
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('services')
                .select('*')
                .order('name');
            
            if (error) {
                console.error("Error fetching services:", error);
            } else {
                setAllServices(data as Service[]);
            }
            setIsLoading(false);
        };
        fetchServices();
    }, []);

    const filteredServices = useMemo(() => {
        if (!searchTerm) {
            return allServices;
        }
        return allServices.filter(service => 
            service.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, allServices]);

    if (isLoading) {
        return <div className="text-center p-4 text-gray-400">Cargando servicios...</div>;
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar servicio para añadir..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {filteredServices.map(service => (
                    <div key={service.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                            <p className="font-medium text-gray-800">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.duration} min</p>
                        </div>
                        <div className="text-right">
                            <p className="font-semibold text-lg text-gray-800">{service.price.toLocaleString('es-ES')}€</p>
                            <button 
                                onClick={() => onServiceSelect(service)}
                                className="mt-1 flex items-center gap-1 text-sm font-semibold text-pink-600 hover:text-pink-800"
                            >
                                <PlusIcon className="h-4 w-4"/>
                                Añadir
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServiceSelector;
