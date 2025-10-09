import React, { useState, useEffect, useMemo } from 'react';
import { Appointment, Client, Service, Professional } from '../../types';
import { supabase } from '../../lib/supabaseClient';

// Helper functions
const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface EditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
  appointment: Appointment;
  clients: Client[];
  services: Service[];
  professionals: Professional[];
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({ isOpen, onClose, onSave, appointment, clients, services, professionals }) => {
    // Form state
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [date, setDate] = useState('');
    const [status, setStatus] = useState<Appointment['status']>('Pendiente');
    const [error, setError] = useState('');

    // View state
    const [view, setView] = useState<'calendar' | 'byHour'>('calendar');

    // Calendar View state
    const [availableSlots, setAvailableSlots] = useState<{time: string, professional_id: string}[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{time: string, professional_id: string} | null>(null);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);

    // By-Hour View state
    const [rangeSlots, setRangeSlots] = useState<any[]>([]);
    const [isLoadingRange, setIsLoadingRange] = useState(false);
    const [filterStartTime, setFilterStartTime] = useState('08:00');
    const [filterEndTime, setFilterEndTime] = useState('21:00');

    // Derived state from props
    const selectedClient = useMemo(() => appointment.client, [appointment]);
    const selectedService = useMemo(() => appointment.service, [appointment]);

    useEffect(() => {
        if (isOpen && appointment) {
            const startDate = new Date(appointment.start_time);
            setSelectedProfessional(appointment.professional || null);
            setDate(formatDate(startDate));
            const initialHours = startDate.getUTCHours().toString().padStart(2, '0');
            const initialMinutes = startDate.getUTCMinutes().toString().padStart(2, '0');
            const initialTime = `${initialHours}:${initialMinutes}`;
            setSelectedSlot({ time: initialTime, professional_id: appointment.professional?.id || '' });
            setStatus(appointment.status);
            setError('');
        } else if (!isOpen) {
            setTimeout(() => {
                setAvailableSlots([]);
                setRangeSlots([]);
            }, 200);
        }
    }, [isOpen, appointment]);

    // Effect for fetching slots based on view
    useEffect(() => {
        if (!isOpen || !date || !selectedService || !selectedProfessional) return;

        if (view === 'calendar') {
            const fetchSlots = async () => {
                setIsLoadingSlots(true);
                const { data, error } = await supabase.rpc('get_available_slots', {
                    p_service_id: selectedService.id,
                    p_date: date,
                    p_professional_id: selectedProfessional.id
                });
                if (error) setAvailableSlots([]);
                else setAvailableSlots(data.map((s: any) => ({ time: s.slot_time.slice(0, 5), professional_id: s.professional_id })));
                setIsLoadingSlots(false);
            };
            fetchSlots();
        } else if (view === 'byHour') {
            const fetchRange = async () => {
                setIsLoadingRange(true);
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(startDate.getDate() + 30);
                const { data, error } = await supabase.rpc('get_available_slots_for_range', {
                    p_service_id: selectedService.id,
                    p_professional_id: selectedProfessional.id,
                    p_start_date: formatDate(startDate),
                    p_end_date: formatDate(endDate),
                });
                if (error) setRangeSlots([]);
                else setRangeSlots(data || []);
                setIsLoadingRange(false);
            };
            fetchRange();
        }
    }, [isOpen, date, selectedService, selectedProfessional, view]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || !selectedService || !selectedProfessional || !date || !selectedSlot) {
            setError('Todos los campos y la selección de hora son obligatorios.');
            return;
        }

        const [hours, minutes] = selectedSlot.time.split(':').map(Number);
        const newStartDate = new Date(date);
        newStartDate.setHours(hours, minutes, 0, 0);

        const newEndDate = new Date(newStartDate.getTime() + selectedService.duration * 60000);

        setError('');
        onSave({
            ...appointment,
            client: selectedClient,
            service: selectedService,
            professional: selectedProfessional,
            start_time: newStartDate.toISOString(),
            end_time: newEndDate.toISOString(),
            status,
        });
    };

    const timeOptions = useMemo(() => {
        const options = [];
        for (let i = 8; i < 22; i++) {
            options.push(`${i.toString().padStart(2, '0')}:00`);
            options.push(`${i.toString().padStart(2, '0')}:30`);
        }
        return options;
    }, []);

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
            groups[dateString].push({
                time: date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                professional_id: slot.professional_id
            });
        });
        return groups;
    }, [rangeSlots, filterStartTime, filterEndTime]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all duration-300 animate-scaleUp max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-8 overflow-y-auto min-h-0">
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Editar Cita</h2>
                        <div className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                                    <input type="text" value={selectedClient?.name || 'Cliente no encontrado'} readOnly className="w-full bg-gray-100 px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                                    <input type="text" value={selectedService?.name || 'Servicio no encontrado'} readOnly className="w-full bg-gray-100 px-4 py-2 border border-gray-300 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="professional-select" className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                                <select id="professional-select" value={selectedProfessional?.id || ''} onChange={e => setSelectedProfessional(professionals.find(p => p.id === e.target.value)!)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                                    {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
                                </select>
                            </div>
                            
                            <div className="border-t pt-5">
                                <div className="flex justify-center border-b border-gray-200 mb-4">
                                    <button type="button" onClick={() => setView('calendar')} className={`py-2 px-4 font-semibold text-sm transition-colors ${view === 'calendar' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                                        Elegir Fecha y Hora
                                    </button>
                                    <button type="button" onClick={() => setView('byHour')} className={`py-2 px-4 font-semibold text-sm transition-colors ${view === 'byHour' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                                        Buscar por Horas
                                    </button>
                                </div>

                                {view === 'calendar' && (
                                    <div className="space-y-4">
                                        <div>
                                            <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                                            <input type="date" id="appointment-date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Hora de inicio</label>
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
                                                <div className="text-center p-4 text-gray-500">No hay huecos disponibles.</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {view === 'byHour' && (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="start-time-filter" className="block text-sm font-medium text-gray-700">Desde</label>
                                                <select id="start-time-filter" value={filterStartTime} onChange={e => setFilterStartTime(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                                                    {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="end-time-filter" className="block text-sm font-medium text-gray-700">Hasta</label>
                                                <select id="end-time-filter" value={filterEndTime} onChange={e => setFilterEndTime(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                                                    {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="max-h-64 overflow-y-auto pr-2 space-y-4">
                                            {isLoadingRange ? (
                                                <div className="text-center p-4">Buscando...</div>
                                            ) : Object.keys(groupedRangeSlots).length === 0 ? (
                                                <div className="text-center p-4 text-gray-500">No se encontraron huecos.</div>
                                            ) : (
                                                Object.entries(groupedRangeSlots).map(([dateString, slots]) => (
                                                    <div key={dateString}>
                                                        <h4 className="font-semibold text-gray-600 text-sm mb-2">{new Date(dateString+'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })}</h4>
                                                        <div className="grid grid-cols-4 gap-2">
                                                            {slots.map(slot => (
                                                                <button 
                                                                    key={slot.time}
                                                                    type="button"
                                                                    onClick={() => { setDate(dateString); setSelectedSlot(slot); setView('calendar'); }}
                                                                    className="px-3 py-2 text-sm rounded-lg transition-colors bg-gray-100 hover:bg-pink-100">
                                                                    {slot.time}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label htmlFor="status-select" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                                <select id="status-select" value={status} onChange={e => setStatus(e.target.value as Appointment['status'])} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                                    <option value="Pendiente">Pendiente</option>
                                    <option value="Completada">Completada</option>
                                    <option value="Cancelada">Cancelada</option>
                                </select>
                            </div>
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                        <button 
                            type="button"
                            onClick={onClose} 
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
export default EditAppointmentModal;