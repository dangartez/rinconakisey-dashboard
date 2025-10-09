import React, { useState, useEffect, useRef } from 'react';
import { Client, Service, Professional } from '../../types';
import { supabase } from '../../lib/supabaseClient';

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
      client: Client;
      service: Service;
      professionalId: string;
      date: string;
      startTime: string;
  }) => void;
  clients: Client[];
  services: Service[];
  professionals: Professional[];
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, onSave, clients, services, professionals }) => {
    const [step, setStep] = useState(1);
    const [error, setError] = useState('');

    // Step 1 state
    const [clientSearch, setClientSearch] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Step 2 state
    const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('any');
    const [date, setDate] = useState('');
    const [availableSlots, setAvailableSlots] = useState<{time: string, professional_id: string}[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{time: string, professional_id: string} | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    
    // Autocomplete state
    const [clientResults, setClientResults] = useState<Client[]>([]);
    const [serviceResults, setServiceResults] = useState<Service[]>([]);
    const [showClientResults, setShowClientResults] = useState(false);
    const [showServiceResults, setShowServiceResults] = useState(false);

    const clientInputRef = useRef<HTMLDivElement>(null);
    const serviceInputRef = useRef<HTMLDivElement>(null);
    
    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setStep(1);
                setClientSearch('');
                setServiceSearch('');
                setSelectedClient(null);
                setSelectedService(null);
                setSelectedProfessionalId('any');
                setDate('');
                setAvailableSlots([]);
                setSelectedSlot(null);
                setError('');
            }, 200);
        } else {
            const today = new Date();
            setDate(formatDate(today));
        }
    }, [isOpen]);

    // Fetch available slots when dependencies change
    useEffect(() => {
        if (step === 2 && date && selectedService) {
            const fetchSlots = async () => {
                setIsLoadingSlots(true);
                setSelectedSlot(null);
                const { data, error } = await supabase.rpc('get_available_slots', {
                    p_service_id: selectedService.id,
                    p_date: date,
                    p_professional_id: selectedProfessionalId === 'any' ? null : selectedProfessionalId
                });

                if (error) {
                    console.error('Error fetching slots:', error);
                    setAvailableSlots([]);
                } else {
                    setAvailableSlots(data.map((s: any) => ({ time: s.slot_time.slice(0, 5), professional_id: s.professional_id })));
                }
                setIsLoadingSlots(false);
            };
            fetchSlots();
        }
    }, [step, date, selectedService, selectedProfessionalId]);

    useEffect(() => {
        if (clientSearch.trim().length > 0) {
            const results = clients.filter(c => 
                c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
                (c.phone || '').includes(clientSearch) ||
                (c.nickname || '').toLowerCase().includes(clientSearch.toLowerCase())
            );
            setClientResults(results);
            setShowClientResults(true);
        } else {
            setShowClientResults(false);
        }
    }, [clientSearch, clients]);

    useEffect(() => {
        if (serviceSearch.trim().length > 0) {
            const results = services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));
            setServiceResults(results);
            setShowServiceResults(true);
        } else {
            setShowServiceResults(false);
        }
    }, [serviceSearch, services]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientInputRef.current && !clientInputRef.current.contains(event.target as Node)) setShowClientResults(false);
            if (serviceInputRef.current && !serviceInputRef.current.contains(event.target as Node)) setShowServiceResults(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setClientSearch(client.name);
        setShowClientResults(false);
    };

    const handleSelectService = (service: Service) => {
        setSelectedService(service);
        setServiceSearch(service.name);
        setShowServiceResults(false);
    };

    const handleNextStep = () => {
        if (selectedClient && selectedService) setStep(2);
    };
    
    const handleSave = () => {
        if (!selectedSlot) {
            setError("Debes seleccionar un hueco disponible.");
            return;
        }
        if (selectedClient && selectedService) {
            setError('');
            onSave({ 
                client: selectedClient, 
                service: selectedService, 
                professionalId: selectedSlot.professional_id, 
                date, 
                startTime: selectedSlot.time 
            });
        }
    }

    if (!isOpen) return null;

    const isStep1NextEnabled = selectedClient && selectedService;
    const isSaveEnabled = step === 2 && date && selectedSlot && selectedClient && selectedService;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-scaleUp"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8">
                    <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-2">Nueva Cita</h2>
                    
                    {step === 1 && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">Paso 1: Cliente y Servicio</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div ref={clientInputRef} className="relative">
                                    <label htmlFor="client-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar Cliente</label>
                                    <input type="text" id="client-search" placeholder="Nombre, teléfono, apodo..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); }} onFocus={() => clientSearch.length > 0 && setShowClientResults(true)} autoComplete="off" />
                                    {showClientResults && clientResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {clientResults.map(client => (
                                                <div key={client.id} onClick={() => handleSelectClient(client)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                    <p className="font-medium">{client.name}</p>
                                                    <p className="text-xs text-gray-500">{client.phone}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div ref={serviceInputRef} className="relative">
                                    <label htmlFor="service-search" className="block text-sm font-medium text-gray-700 mb-1">Buscar Servicio</label>
                                    <input type="text" id="service-search" placeholder="Nombre del servicio..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" value={serviceSearch} onChange={(e) => { setServiceSearch(e.target.value); setSelectedService(null); }} onFocus={() => serviceSearch.length > 0 && setShowServiceResults(true)} autoComplete="off" />
                                     {showServiceResults && serviceResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {serviceResults.map(service => (
                                                <div key={service.id} onClick={() => handleSelectService(service)} className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm">
                                                    <p className="font-medium">{service.name}</p>
                                                     <p className="text-xs text-gray-500">{service.duration} min - {service.price}€</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end">
                                <button onClick={handleNextStep} disabled={!isStep1NextEnabled} className="px-6 py-2 bg-pink-600 text-white font-semibold rounded-lg shadow-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-opacity-75 disabled:bg-pink-300 disabled:cursor-not-allowed transition-colors">
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                         <div>
                            <h3 className="text-lg font-semibold text-gray-800 mb-6">Paso 2: Profesional y Fecha</h3>
                             <div className="space-y-6">
                                <div>
                                    <label htmlFor="professional-select" className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                                    <div className="relative">
                                        <select id="professional-select" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white appearance-none" value={selectedProfessionalId} onChange={(e) => setSelectedProfessionalId(e.target.value)}>
                                            <option value="any">Cualquiera</option>
                                            {/* Filter professionals who can perform the selected service */}
                                            {professionals
                                                .filter(p => selectedService?.id && p.assignedServices?.includes(selectedService.id))
                                                .map(pro => ( <option key={pro.id} value={pro.id}>{pro.name}</option> ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                    <input type="date" id="appointment-date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                    {isLoadingSlots ? (
                                        <div className="text-center p-4">Buscando huecos...</div>
                                    ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-4 gap-2">
                                            {availableSlots.map(slot => (
                                                <button 
                                                    key={slot.time}
                                                    type="button"
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${selectedSlot?.time === slot.time ? 'bg-pink-600 text-white' : 'bg-gray-100 hover:bg-pink-100'}`}>
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center p-4 text-gray-500">No hay huecos disponibles para este día/profesional.</div>
                                    )}
                                </div>

                                {error && <p className="text-red-500 text-sm">{error}</p>}
                             </div>
                             <div className="mt-8 flex justify-between">
                                <button onClick={() => setStep(1)} className="px-6 py-2 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                                    Anterior
                                </button>
                            </div>
                         </div>
                    )}
                </div>
                
                <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                        Cancelar
                    </button>
                    <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors" disabled={!isSaveEnabled}>
                        Guardar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NewAppointmentModal;