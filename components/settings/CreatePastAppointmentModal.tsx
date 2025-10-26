import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Client, Service, Professional } from '../../types';
import ClientSelector from '../tpv/ClientSelector';

interface CreatePastAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAppointmentCreated: () => void;
}

const CreatePastAppointmentModal: React.FC<CreatePastAppointmentModalProps> = ({ isOpen, onClose, onAppointmentCreated }) => {
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isSelectingClient, setIsSelectingClient] = useState(true); // State to control UI

    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    
    const [startDateTime, setStartDateTime] = useState('');
    const [status, setStatus] = useState<'Completada' | 'Confirmada' | 'Cancelada'>('Completada');
    const [notes, setNotes] = useState('');

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for searchable dropdowns
    const [serviceSearch, setServiceSearch] = useState('');
    const [profSearch, setProfSearch] = useState('');
    const [showServiceDropdown, setShowServiceDropdown] = useState(false);
    const [showProfDropdown, setShowProfDropdown] = useState(false);

    const serviceRef = useRef<HTMLDivElement>(null);
    const profRef = useRef<HTMLDivElement>(null);

    // Fetch initial data
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setIsLoading(true);
            const { data: servicesData, error: servicesError } = await supabase.from('services').select('*').order('name');
            const { data: professionalsData, error: professionalsError } = await supabase.from('professionals').select('*').order('full_name');

            if (servicesError || professionalsError) {
                setError('No se pudieron cargar los datos necesarios.');
            } else {
                setServices(servicesData as Service[]);
                setProfessionals(professionalsData as Professional[]);
            }
            setIsLoading(false);
        };

        fetchData();
    }, [isOpen]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (serviceRef.current && !serviceRef.current.contains(event.target as Node)) setShowServiceDropdown(false);
            if (profRef.current && !profRef.current.contains(event.target as Node)) setShowProfDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClientSelection = (client: Client) => {
        setSelectedClient(client);
        setIsSelectingClient(false); // Hide selector UI
    };

    const handleChangeClient = () => {
        setSelectedClient(null);
        setIsSelectingClient(true); // Show selector UI
    };

    const filteredServices = useMemo(() => services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())), [services, serviceSearch]);
    const filteredProfessionals = useMemo(() => professionals.filter(p => p.full_name.toLowerCase().includes(profSearch.toLowerCase())), [professionals, profSearch]);

    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        setServiceSearch(service.name);
        setShowServiceDropdown(false);
    }

    const handleSelectProfessional = (prof: Professional) => {
        setSelectedProfessional(prof);
        setProfSearch(prof.full_name);
        setShowProfDropdown(false);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !selectedService || !selectedProfessional || !startDateTime) {
            setError('Todos los campos son obligatorios: cliente, servicio, profesional y fecha/hora.');
            return;
        }

        setIsSaving(true);
        setError(null);

        const startTime = new Date(startDateTime);
        const endTime = new Date(startTime.getTime() + selectedService.duration * 60000);

        const { error: insertError } = await supabase.from('appointments').insert([{
            client_id: selectedClient.id,
            service_id: selectedService.id,
            professional_id: selectedProfessional.id,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            status: status,
            notes: notes,
        }]);

        setIsSaving(false);

        if (insertError) {
            console.error("Error creating past appointment:", insertError);
            setError(`Error al crear la cita: ${insertError.message}`);
        } else {
            alert('Cita manual creada con éxito.');
            onAppointmentCreated();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">Añadir Cita Manualmente</h3>
                        <p className="text-sm text-gray-500 mt-1">Crea un registro de una cita pasada. No se comprobará la disponibilidad.</p>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto"> {/* SCROLL FIX */}
                        {isLoading ? (
                            <div>Cargando...</div>
                        ) : (
                            <>

                                {isSelectingClient ? (
                                    <ClientSelector onClientSelect={handleClientSelection} />
                                ) : (
                                    <div className='p-3 bg-gray-100 rounded-lg'>
                                        <p className='text-sm font-medium text-gray-600'>Cliente Seleccionado:</p>
                                        <div className='flex justify-between items-center'>
                                            <p className='font-bold text-lg text-pink-700'>{selectedClient?.name}</p>
                                            <button onClick={handleChangeClient} className='text-sm text-blue-600 hover:underline'>Cambiar</button>
                                        </div>
                                    </div>
                                )}


                                {/* Service Combobox */}
                                <div ref={serviceRef} className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={serviceSearch}
                                            onChange={(e) => { setServiceSearch(e.target.value); if(!showServiceDropdown) setShowServiceDropdown(true); setSelectedService(null); }}
                                            onFocus={() => setShowServiceDropdown(true)}
                                            placeholder="Buscar servicio..."
                                            className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                    {showServiceDropdown && (
                                        <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredServices.length > 0 ? filteredServices.map(service => (
                                                <div key={service.id} onClick={() => handleSelectService(service)} className="p-3 cursor-pointer hover:bg-pink-50">
                                                    <p className="font-medium text-gray-800">{service.name}</p>
                                                    <p className="text-sm text-gray-500">{service.duration} min - {service.price}€</p>
                                                </div>
                                            )) : <div className="p-3 text-gray-500">No se encontraron servicios.</div>}
                                        </div>
                                    )}
                                </div>

                                {/* Professional Combobox */}
                                <div ref={profRef} className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={profSearch}
                                            onChange={(e) => { setProfSearch(e.target.value); if(!showProfDropdown) setShowProfDropdown(true); setSelectedProfessional(null); }}
                                            onFocus={() => setShowProfDropdown(true)}
                                            placeholder="Buscar profesional..."
                                            className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        />
                                    </div>
                                    {showProfDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {filteredProfessionals.length > 0 ? filteredProfessionals.map(prof => (
                                                <div key={prof.id} onClick={() => handleSelectProfessional(prof)} className="p-3 cursor-pointer hover:bg-pink-50">
                                                    <p className="font-medium text-gray-800">{prof.full_name}</p>
                                                </div>
                                            )) : <div className="p-3 text-gray-500">No se encontraron profesionales.</div>}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y Hora de Inicio</label>
                                    <input 
                                        type="datetime-local" 
                                        value={startDateTime}
                                        onChange={(e) => setStartDateTime(e.target.value)}
                                        className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select 
                                        className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as any)}
                                    >
                                        <option value="Completada">Completada</option>
                                        <option value="Confirmada">Confirmada</option>
                                        <option value="Cancelada">Cancelada</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas (Opcional)</label>
                                    <textarea 
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                    />
                                </div>
                            </>
                        )}
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                    </div>

                    <div className="flex justify-end items-center p-4 border-t bg-gray-50">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors mr-3">
                            Cancelar
                        </button>
                        <button type="submit" disabled={isSaving || !selectedClient || !selectedService || !selectedProfessional} className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors disabled:bg-pink-300">
                            {isSaving ? 'Guardando...' : 'Guardar Cita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePastAppointmentModal;