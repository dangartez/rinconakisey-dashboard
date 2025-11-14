import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Appointment, Client, Service, Professional } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import AppointmentTimeSelector from './AppointmentTimeSelector';
import { ComputedSlot, TimeSlot } from './AppointmentTimeSelector';

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
      services: Service[];
      professional: Professional;
      startTime: Date;
  }) => void;
  clients: Client[];
  services: Service[];
  professionals: Professional[];
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({ isOpen, onClose, onSave, clients, services, professionals }) => {
    // Main form state
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(professionals[0] || null);
    const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
    const [status, setStatus] = useState<Appointment['status']>('Confirmada');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{time: string, professional_id: string} | null>(null);
    const [date, setDate] = useState(formatDate(new Date()));
    const [error, setError] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');

    // Client search state
    const [clientSearch, setClientSearch] = useState('');
    const [clientResults, setClientResults] = useState<Client[]>([]);
    const [showClientResults, setShowClientResults] = useState(false);
    const clientInputRef = useRef<HTMLDivElement>(null);

    // State for the time selector logic
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [weekOffset, setWeekOffset] = useState(0);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [computedSlots, setComputedSlots] = useState<ComputedSlot[]>([]);
    const [workSchedule, setWorkSchedule] = useState<{ start_time: string; end_time: string; is_working: boolean } | null>(null);
    const [dateTimeView, setDateTimeView] = useState<'calendar' | 'byHour'>('calendar');
    const [rangeSlots, setRangeSlots] = useState<any[]>([]);
    const [isLoadingRange, setIsLoadingRange] = useState(false);
    const [filterStartTime, setFilterStartTime] = useState('08:00');
    const [filterEndTime, setFilterEndTime] = useState('21:00');
    const [isSlotsModalOpen, setIsSlotsModalOpen] = useState(false);

    // --- EFFECTS ---
    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            // Reset all state variables to their initial values
            setSelectedProfessional(professionals[0] || null);
            setSelectedProfessionalIds([]);
            setStatus('Confirmada');
            setSelectedClient(null);
            setSelectedServiceIds([]);
            setSelectedSlot(null);
            setDate(formatDate(new Date()));
            setError('');
            setServiceSearch('');
            setClientSearch('');
            setClientResults([]);
            setShowClientResults(false);
            setSelectedDate(new Date());
            setWeekOffset(0);
            setIsLoadingSlots(false);
            setComputedSlots([]);
            setWorkSchedule(null);
            setDateTimeView('calendar');
            setRangeSlots([]);
            setIsLoadingRange(false);
            setFilterStartTime('08:00');
            setFilterEndTime('21:00');
            setIsSlotsModalOpen(false);
        }
    }, [isOpen, professionals]);


    const selectedServiceObjects = useMemo(() => services.filter(s => selectedServiceIds.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name)), [selectedServiceIds, services]);
    const isDuoService = useMemo(() => selectedServiceObjects.length > 0 && selectedServiceObjects.every(s => s.required_professionals > 1), [selectedServiceObjects]);

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
        const handleClickOutside = (event: MouseEvent) => {
            if (clientInputRef.current && !clientInputRef.current.contains(event.target as Node)) setShowClientResults(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setClientSearch(client.name);
        setShowClientResults(false);
    };

    useEffect(() => {
        // This effect is for single professional selection, disable for duo service
        if (isDuoService) {
            setComputedSlots([]);
            setWorkSchedule(null);
            return;
        }
        const selectedServiceObjects = services.filter(s => selectedServiceIds.includes(s.id));
        if (!isOpen || selectedServiceObjects.length === 0 || dateTimeView !== 'calendar' || !selectedProfessional) {
            setComputedSlots([]);
            setWorkSchedule(null);
            return;
        }

        const fetchAndComputeSlots = async () => {
            setIsLoadingSlots(true);
            setComputedSlots([]);
            const dateString = formatDate(selectedDate);
            const appointmentIdsToIgnore: string[] = [];

            // 1. Get workday bounds
            const { data: scheduleData, error: scheduleError } = await supabase.rpc('get_professional_workday_bounds', { 
                p_professional_id: selectedProfessional.id, 
                p_date: dateString 
            });

            if (scheduleError || !scheduleData || scheduleData.length === 0 || !scheduleData[0].is_working) {
                setWorkSchedule(scheduleData ? scheduleData[0] : null);
                setIsLoadingSlots(false);
                return;
            }
            
            const { earliest_start_time, latest_end_time } = scheduleData[0];
            setWorkSchedule(scheduleData[0]);

            // 2. Get available slots
            const { data: availableSlotsData, error: slotsError } = await supabase.rpc('get_available_slots_for_multiple_services_for_range', {
                p_professional_id: selectedProfessional.id,
                p_service_ids: selectedServiceIds,
                p_start_date: dateString,
                p_end_date: dateString,
                p_appointment_ids_to_ignore: appointmentIdsToIgnore
            });

            let fetchedSlots: TimeSlot[] = [];
            if (slotsError) {
                console.error('Error fetching slots:', slotsError);
            } else {
                fetchedSlots = (availableSlotsData || []).map((s: any) => {
                    const slotDate = new Date(s.slot_timestamp);
                    const hours = slotDate.getHours().toString().padStart(2, '0');
                    const minutes = slotDate.getMinutes().toString().padStart(2, '0');
                    return { time: `${hours}:${minutes}`, professional_id: s.professional_id };
                });
            }



            // 4. Generate all possible slots for the day
            const allDaySlots: string[] = [];
            const baseDate = formatDate(selectedDate);
            let current = new Date(`${baseDate}T${earliest_start_time}`);
            const end = new Date(`${baseDate}T${latest_end_time}`);
            while (current < end) {
                allDaySlots.push(current.toTimeString().slice(0, 5));
                current.setMinutes(current.getMinutes() + 15);
            }

            // 5. Compute the final slot list
            const availableSlotMap = new Map<string, string>();
            fetchedSlots.forEach(s => availableSlotMap.set(s.time, s.professional_id));

            const finalComputedSlots = allDaySlots.map(slotTime => {
                const professionalId = availableSlotMap.get(slotTime);
                return {
                    time: slotTime,
                    isAvailable: !!professionalId,
                    professionalId: professionalId || ''
                };
            });

            setComputedSlots(finalComputedSlots);
            setIsLoadingSlots(false);
        };

        fetchAndComputeSlots();
    }, [isOpen, selectedDate, selectedProfessional, selectedServiceIds, dateTimeView, services, isDuoService]);

    // --- HANDLERS & MEMOS ---
    const handleServiceToggle = (serviceId: number) => setSelectedServiceIds(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
    const filteredAvailableServices = useMemo(() => {
        if (!serviceSearch.trim()) return services.sort((a,b) => a.name.localeCompare(b.name));
        return services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name));
    }, [serviceSearch, services]);

    const handleDateTimeSelected = (selectedDate: Date, time: string, professionalId: string) => {
        setDate(formatDate(selectedDate));
        setSelectedSlot({ time, professional_id: professionalId });
    };
    
    const handleSearchByHour = async () => {
        if (selectedServiceObjects.length === 0) return;
        setIsLoadingRange(true);
        setIsSlotsModalOpen(true);
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 30);
        const appointmentIdsToIgnore: string[] = [];

        const { data, error } = await supabase.rpc('get_available_slots_for_multiple_services_for_range', {
            p_service_ids: selectedServiceIds,
            p_professional_id: selectedProfessional?.id || null,
            p_start_date: formatDate(startDate),
            p_end_date: formatDate(endDate),
            p_appointment_ids_to_ignore: appointmentIdsToIgnore
        });

        if (error) {
            setRangeSlots([]);
        } else {
            setRangeSlots(data || []);
        }
        setIsLoadingRange(false);
    };

    const groupedRangeSlots = useMemo(() => {
        const groups: { [key: string]: { time: string; professional_id: string }[] } = {};
        if (!rangeSlots) return {};
        const filtered = rangeSlots.filter(slot => {
            const slotTime = new Date(slot.slot_timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            return slotTime >= filterStartTime && slotTime <= filterEndTime;
        });
        filtered.forEach(slot => {
            const date = new Date(slot.slot_timestamp);
            const dateString = formatDate(date);
            if (!groups[dateString]) groups[dateString] = [];
            groups[dateString].push({ time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), professional_id: slot.professional_id });
        });
        return groups;
    }, [rangeSlots, filterStartTime, filterEndTime]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const professionalToSave = isDuoService ? { id: selectedProfessionalIds.join(','), full_name: 'Duo Service' } as any : selectedProfessional;

        if (!selectedClient || !professionalToSave || !date || !selectedSlot) {
            setError('Todos los campos y la selección de hora son obligatorios.');
            return;
        }
        if (isDuoService && selectedProfessionalIds.length < 2) {
            setError('Debe seleccionar al menos 2 profesionales para un servicio Dúo.');
            return;
        }

        const [hours, minutes] = selectedSlot.time.split(':').map(Number);
        const newStartDate = new Date(date);
        newStartDate.setHours(hours, minutes, 0, 0);
        
        setError('');
        onSave({
            client: selectedClient,
            services: selectedServiceObjects,
            professional: professionalToSave, // This will need to be handled in the parent
            startTime: newStartDate,
        });
    };

    const handleProfessionalIdToggle = (id: string) => {
        setSelectedProfessionalIds(prev => 
            prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
        );
    };

    // --- RENDER ---
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 animate-scaleUp max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-8 overflow-y-auto min-h-0">
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-8">Nueva Cita</h2>
                        <div className="space-y-6">
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
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Servicios Asignados</h3>
                                <div className="flex items-center space-x-2 mb-3">
                                    <input type="text" placeholder="Buscar servicio..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4 flex-1">
                                    <div>
                                        <h4 className="font-semibold text-gray-600 text-sm mb-2">Disponibles ({filteredAvailableServices.length})</h4>
                                        <div className="border border-gray-200 rounded-lg bg-white h-full overflow-y-auto p-2 space-y-1">
                                            {filteredAvailableServices.map(service => (
                                                <button key={service.id} type="button" onClick={() => handleServiceToggle(service.id)} disabled={selectedServiceIds.includes(service.id)} className="w-full text-left p-2 rounded text-sm transition-colors text-gray-800 disabled:bg-pink-50 disabled:text-pink-700 disabled:font-medium disabled:cursor-default hover:bg-gray-50">{service.name}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-600 text-sm mb-2">Seleccionados ({selectedServiceObjects.length})</h4>
                                        <div className="border border-gray-200 rounded-lg bg-white h-full overflow-y-auto p-2 space-y-1">
                                            {selectedServiceObjects.length > 0 ? selectedServiceObjects.map(service => (
                                                <div key={service.id} className="flex items-center justify-between p-2 rounded bg-white text-sm text-gray-800 border border-gray-100">
                                                    <span className="font-medium">{service.name}</span>
                                                    <button type="button" onClick={() => handleServiceToggle(service.id)} className="text-gray-400 hover:text-red-500 p-1" aria-label={`Quitar ${service.name}`}><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                                                </div>
                                            )) : <div className="flex items-center justify-center h-full text-center text-sm text-gray-400 p-4"><p>Selecciona servicios de la lista de disponibles.</p></div>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="professional-select" className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                                {isDuoService ? (
                                    <div className="p-3 border border-gray-200 rounded-lg space-y-2">
                                        <p className="text-xs text-gray-500">Selecciona los profesionales para el servicio Dúo:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            {professionals.map(pro => (
                                                <label key={pro.id} className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${selectedProfessionalIds.includes(pro.id) ? 'bg-pink-100' : 'hover:bg-gray-50'}`}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={selectedProfessionalIds.includes(pro.id)}
                                                        onChange={() => handleProfessionalIdToggle(pro.id)}
                                                        className="h-4 w-4 rounded text-pink-600 border-gray-300 focus:ring-pink-500"
                                                    />
                                                    <span className="text-sm font-medium text-gray-800">{pro.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <select id="professional-select" value={selectedProfessional?.id || ''} onChange={e => setSelectedProfessional(professionals.find(p => p.id === e.target.value)!)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">{professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}</select>
                                )}
                            </div>
                            <AppointmentTimeSelector services={selectedServiceObjects} professional={selectedProfessional} onDateTimeSelected={handleDateTimeSelected} allProfessionals={professionals} onProfessionalSelected={setSelectedProfessional} dateTimeView={dateTimeView} setDateTimeView={setDateTimeView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} weekOffset={weekOffset} setWeekOffset={setWeekOffset} isLoadingSlots={isLoadingSlots} computedSlots={computedSlots} workSchedule={workSchedule} isSlotsModalOpen={isSlotsModalOpen} setIsSlotsModalOpen={setIsSlotsModalOpen} groupedRangeSlots={groupedRangeSlots} isLoadingRange={isLoadingRange} filterStartTime={filterStartTime} setFilterStartTime={setFilterStartTime} filterEndTime={filterEndTime} setFilterEndTime={setFilterEndTime} handleSearchByHour={handleSearchByHour} />
                            {selectedSlot && date && (
                                <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
                                    <p className="font-semibold text-pink-800">
                                        Nueva Hora Seleccionada: <span className="text-lg font-bold">{new Date(date.replace(/-/g, '/')).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedSlot.time}</span>
                                    </p>
                                </div>
                            )}
                            <div>
                                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select id="status-select" value={status} onChange={e => setStatus(e.target.value as Appointment['status'])} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"><option value="Confirmada">Confirmada</option><option value="Completada">Completada</option><option value="Cancelada">Cancelada</option></select>
                            </div>
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        </div>
                    </div>
                    <div className="bg-gray-50 px-8 py-4 mt-auto rounded-b-2xl flex justify-end items-center space-x-3 border-t">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">Crear Cita</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewAppointmentModal;
