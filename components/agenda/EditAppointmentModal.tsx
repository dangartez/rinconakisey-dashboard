import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Client, Service, Professional } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import AppointmentTimeSelector from './AppointmentTimeSelector';
import { ComputedSlot } from './AppointmentTimeSelector';
import ConfirmationModal from '../ui/ConfirmationModal';

// Define TimeSlot interface locally since it's not exported from AppointmentTimeSelector
interface TimeSlot {
    time: string;
    professional_id: string;
}

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: {
    originalAppointment: Appointment;
    selectedServices: Service[];
    newStartTime: Date;
    newProfessional: Professional;
    newStatus: Appointment['status'];
    isEditingSingle?: boolean;
  }) => void;
  appointment: Appointment;
  clients: Client[];
  services: Service[];
  professionals: Professional[];
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({ isOpen, onClose, onSave, appointment, clients, services = [], professionals }) => {
    // Main form state
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [status, setStatus] = useState<Appointment['status']>('Pendiente');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{time: string, professional_id: string} | null>(null);
    const [date, setDate] = useState('');
    const [error, setError] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // --- EFFECTS ---
    useEffect(() => {
        if (isOpen && appointment) {
            const startDate = new Date(appointment.start_time);
            startDate.setHours(0,0,0,0);
            // If the appointment is part of a group, we should probably fetch all services for that group
            // For now, we just show the service of the specific appointment clicked
            // If a full group of services is passed, use it. Otherwise, fall back to the single service.
            const servicesToSelect = (appointment as any).services || (appointment.service ? [appointment.service] : []);
            setSelectedServiceIds(servicesToSelect.map((s: Service) => s.id));
            setSelectedClient(clients.find(c => c.id === appointment.client.id) || null);
            setSelectedProfessional(appointment.professional || null);
            setDate(formatDate(startDate));
            setSelectedDate(startDate);
            const initialHours = new Date(appointment.start_time).getHours().toString().padStart(2, '0');
            const initialMinutes = new Date(appointment.start_time).getMinutes().toString().padStart(2, '0');
            setSelectedSlot({ time: `${initialHours}:${initialMinutes}`, professional_id: appointment.professional?.id || '' });
            setStatus(appointment.status);
            setError('');
            setServiceSearch('');
            setShowSuccessModal(false); // Reset on open
        }
    }, [isOpen, appointment, clients]);

    const selectedServiceObjects = useMemo(() => services?.filter(s => selectedServiceIds.includes(s.id)).sort((a, b) => a.name.localeCompare(b.name)) || [], [selectedServiceIds, services]);

    useEffect(() => {
        const selectedServiceObjects = services?.filter(s => selectedServiceIds.includes(s.id)) || [];
        if (!isOpen || selectedServiceObjects.length === 0 || dateTimeView !== 'calendar' || !selectedProfessional) {
            setComputedSlots([]);
            setWorkSchedule(null);
            return;
        }

        const fetchAndComputeSlots = async () => {
            setIsLoadingSlots(true);
            setComputedSlots([]);
            const dateString = formatDate(selectedDate);
            const appointmentIdsToIgnore = appointment ? [appointment.id] : [];

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

            // 3. Add original appointment time to available slots
            const originalDate = new Date(appointment.start_time);
            const originalHours = originalDate.getHours().toString().padStart(2, '0');
            const originalMinutes = originalDate.getMinutes().toString().padStart(2, '0');
            const originalAppointmentTime = `${originalHours}:${originalMinutes}`;
            const isOriginalSlotInFetched = fetchedSlots.some(s => s.time === originalAppointmentTime);
            if (!isOriginalSlotInFetched) {
                fetchedSlots.push({ time: originalAppointmentTime, professional_id: appointment.professional.id });
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
    }, [isOpen, selectedDate, selectedProfessional, selectedServiceIds, dateTimeView, appointment, services]);

    // --- HANDLERS & MEMOS ---
    const handleServiceToggle = (serviceId: number) => setSelectedServiceIds(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
    const filteredAvailableServices = useMemo(() => {
        if (!serviceSearch.trim()) return services?.sort((a,b) => a.name.localeCompare(b.name)) || [];
        return services?.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase())).sort((a,b) => a.name.localeCompare(b.name)) || [];
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
        const appointmentIdsToIgnore = appointment ? [appointment.id] : [];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !selectedProfessional || !date || !selectedSlot) {
            setError('Todos los campos y la selección de hora son obligatorios.');
            return;
        }
        const [hours, minutes] = selectedSlot.time.split(':').map(Number);
        const newStartDate = new Date(date);
        newStartDate.setHours(hours, minutes, 0, 0);
        
        setError('');
        
        try {
            const success = await onSave({
                originalAppointment: appointment,
                selectedServices: selectedServiceObjects,
                newStartTime: newStartDate,
                newProfessional: selectedProfessional,
                newStatus: status,
                isEditingSingle: (appointment as any).isEditingSingle || false
            });

            if (success) {
                setShowSuccessModal(true);
            } else {
                setError('No se pudo guardar la cita. Por favor, revisa los datos o inténtalo más tarde.');
            }
        } catch (saveError) {
            setError('Hubo un error al guardar la cita. Por favor, inténtalo de nuevo.');
            console.error(saveError);
        }
    };

    const handleCloseSuccessModal = () => {
        setShowSuccessModal(false);
        onClose(); // Close the main edit modal
    };

    // --- RENDER ---
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 animate-scaleUp max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                        <div className="p-8 overflow-y-auto min-h-0">
                            <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-8">Editar Cita</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                    <input type="text" value={selectedClient?.full_name || selectedClient?.name || 'Cliente no encontrado'} readOnly className="w-full bg-gray-100 px-4 py-2 border border-gray-300 rounded-lg" />
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
                                    <select id="professional-select" value={selectedProfessional?.id || ''} onChange={e => setSelectedProfessional(professionals.find(p => p.id === e.target.value)!)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">{professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.full_name || pro.name}</option>)}</select>
                                </div>
                                <AppointmentTimeSelector services={selectedServiceObjects} professional={selectedProfessional} appointmentToEdit={appointment} onDateTimeSelected={handleDateTimeSelected} allProfessionals={professionals} onProfessionalSelected={setSelectedProfessional} dateTimeView={dateTimeView} setDateTimeView={setDateTimeView} selectedDate={selectedDate} setSelectedDate={setSelectedDate} weekOffset={weekOffset} setWeekOffset={setWeekOffset} isLoadingSlots={isLoadingSlots} computedSlots={computedSlots} workSchedule={workSchedule} isSlotsModalOpen={isSlotsModalOpen} setIsSlotsModalOpen={setIsSlotsModalOpen} groupedRangeSlots={groupedRangeSlots} isLoadingRange={isLoadingRange} filterStartTime={filterStartTime} setFilterStartTime={setFilterStartTime} filterEndTime={filterEndTime} setFilterEndTime={setFilterEndTime} handleSearchByHour={handleSearchByHour} />
                                {selectedSlot && date && (
                                    <div className="mt-4 p-3 bg-pink-50 border border-pink-200 rounded-lg text-center">
                                        <p className="font-semibold text-pink-800">
                                            Nueva Hora Seleccionada: <span className="text-lg font-bold">{new Date(date.replace(/-/g, '/')).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedSlot.time}</span>
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                    <select id="status-select" value={status} onChange={e => setStatus(e.target.value as Appointment['status'])} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"><option value="Pendiente">Pendiente</option><option value="Completada">Completada</option><option value="Cancelada">Cancelada</option></select>
                                </div>
                                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            </div>
                        </div>
                        <div className="bg-gray-50 px-8 py-4 mt-auto rounded-b-2xl flex justify-end items-center space-x-3 border-t">
                            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                            <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">Guardar Cambios</button>
                        </div>
                    </form>
                </div>
            </div>
            <ConfirmationModal
                isOpen={showSuccessModal}
                onClose={handleCloseSuccessModal}
                onConfirm={handleCloseSuccessModal}
                title="Cita Actualizada"
                message="Los cambios en la cita se han guardado correctamente."
                confirmButtonText="Aceptar"
                confirmButtonColor="green"
                singleButton={true}
            />
        </>
    );
};

export default EditAppointmentModal;
