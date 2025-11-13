import React, { useState, useMemo } from 'react';
import { Professional, Appointment } from '../../types';
import ConfirmationModal from '../ui/ConfirmationModal';
import { TrashIcon } from '../icons/Icons';

interface ProfessionalAgendaModalProps {
  isOpen: boolean;
  onClose: () => void;
  professional: Professional | null;
  appointments: Appointment[];
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (appointmentId: string) => void;
}

const statusColors: Record<Appointment['status'], string> = {
    'Pendiente': 'bg-blue-100 text-blue-800',
    'Confirmada': 'bg-blue-100 text-blue-800',
    'Completada': 'bg-green-100 text-green-800',
    'Cancelada': 'bg-red-100 text-red-800',
};

const ProfessionalAgendaModal: React.FC<ProfessionalAgendaModalProps> = ({
  isOpen, onClose, professional, appointments, onEditAppointment, onDeleteAppointment
}) => {
    
    const [filters, setFilters] = useState({
        singleDate: '',
        startDate: '',
        endDate: '',
        time: '',
        status: 'Todas',
    });
    
    const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);

    const professionalAppointments = useMemo(() => {
        if (!professional) return [];
        return appointments
            .filter(app => app.professional.id === professional.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.startTime.localeCompare(a.startTime));
    }, [professional, appointments]);
    
    const filteredAppointments = useMemo(() => {
        return professionalAppointments.filter(app => {
            if (filters.status !== 'Todas' && app.status !== filters.status) return false;
            if (filters.singleDate && app.date !== filters.singleDate) return false;
            if (filters.startDate && app.date < filters.startDate) return false;
            if (filters.endDate && app.date > filters.endDate) return false;
            if (filters.time && !app.startTime.startsWith(filters.time)) return false;
            return true;
        });
    }, [professionalAppointments, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({...prev, [name]: value}));
    };

    const handleClearFilters = () => {
        setFilters({
            singleDate: '',
            startDate: '',
            endDate: '',
            time: '',
            status: 'Todas',
        });
    };

    const handleDeleteClick = (appointment: Appointment) => {
        setAppointmentToDelete(appointment);
    };

    const confirmDelete = () => {
        if (appointmentToDelete) {
            onDeleteAppointment(appointmentToDelete.id);
            setAppointmentToDelete(null);
        }
    };
    
    React.useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                 setFilters({
                    singleDate: '',
                    startDate: '',
                    endDate: '',
                    time: '',
                    status: 'Todas',
                });
            }, 200)
        }
    }, [isOpen]);

    if (!isOpen || !professional) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
                onClick={onClose} 
                role="dialog" 
                aria-modal="true"
            >
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl transform transition-all duration-300 animate-scaleUp max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-6 border-b sticky top-0 bg-white z-10">
                        <h2 className="text-3xl font-bold text-gray-900">Agenda de {professional.full_name}</h2>
                    </div>
                    
                    <div className="p-6 bg-gray-50/70 border-b flex flex-wrap items-end gap-4 text-sm">
                        <div className="flex-grow min-w-[150px]">
                            <label htmlFor="singleDate" className="block font-medium text-gray-600 mb-1">Fecha única</label>
                            <input type="date" name="singleDate" id="singleDate" value={filters.singleDate} onChange={handleFilterChange} className="w-full bg-white p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500" />
                        </div>
                        <div className="flex-grow min-w-[150px]">
                            <label htmlFor="startDate" className="block font-medium text-gray-600 mb-1">Desde</label>
                            <input type="date" name="startDate" id="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full bg-white p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500" />
                        </div>
                        <div className="flex-grow min-w-[150px]">
                            <label htmlFor="endDate" className="block font-medium text-gray-600 mb-1">Hasta</label>
                            <input type="date" name="endDate" id="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full bg-white p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500" />
                        </div>
                         <div className="flex-grow min-w-[120px]">
                            <label htmlFor="time" className="block font-medium text-gray-600 mb-1">Hora</label>
                            <input type="time" name="time" id="time" value={filters.time} onChange={handleFilterChange} className="w-full bg-white p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500" />
                        </div>
                         <div className="flex-grow min-w-[150px]">
                            <label htmlFor="status" className="block font-medium text-gray-600 mb-1">Estado</label>
                            <select name="status" id="status" value={filters.status} onChange={handleFilterChange} className="w-full bg-white p-2 border border-gray-300 rounded-md focus:ring-pink-500 focus:border-pink-500">
                                <option>Todas</option>
                                <option>Confirmada</option>
                                <option>Completada</option>
                                <option>Cancelada</option>
                            </select>
                        </div>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b-2 border-gray-100">
                                        <th className="p-3 text-sm font-semibold text-gray-600">Fecha</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">Hora</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">Cliente</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">Servicio</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">Estado</th>
                                        <th className="p-3 text-sm font-semibold text-gray-600">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAppointments.map(app => (
                                        <tr key={app.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50">
                                            <td className="p-3 text-gray-600 whitespace-nowrap">{new Date(app.date+'T00:00:00').toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                                            <td className="p-3 text-gray-600 whitespace-nowrap">{app.startTime}</td>
                                            <td className="p-3 font-medium text-gray-800">{app.client.name}</td>
                                            <td className="p-3 text-gray-600">{app.service.name}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${statusColors[app.status]}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="p-3 whitespace-nowrap space-x-4 flex items-center">
                                                <button onClick={() => onEditAppointment(app)} className="text-pink-600 hover:underline text-sm font-medium">Editar</button>
                                                <button onClick={() => handleDeleteClick(app)} className="text-gray-500 hover:text-red-600 p-1 rounded-full transition-colors" aria-label={`Eliminar cita de ${app.client.name}`}>
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                     {filteredAppointments.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center p-8 text-gray-500">
                                                No se encontraron citas con los filtros seleccionados.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-between items-center border-t">
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Limpiar Filtros
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
            {appointmentToDelete && (
                <ConfirmationModal
                    isOpen={!!appointmentToDelete}
                    onClose={() => setAppointmentToDelete(null)}
                    onConfirm={confirmDelete}
                    title="Eliminar Cita"
                    message={`¿Estás seguro de que quieres eliminar la cita de ${appointmentToDelete.client.name} para el servicio de ${appointmentToDelete.service.name}?`}
                    confirmButtonColor="red"
                />
            )}
        </>
    );
};

export default ProfessionalAgendaModal;