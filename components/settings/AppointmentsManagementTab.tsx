
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import { PlusIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import CreatePastAppointmentModal from './CreatePastAppointmentModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import EditAppointmentModal from '../agenda/EditAppointmentModal';
import { Appointment, Client, Service, Professional } from '../../types';

interface AppointmentSummary {
    id: string;
    client_name: string;
    service_name: string;
    professional_name: string;
    start_time: string;
    status: string;
    sale_id: string | null;
}

const APPOINTMENT_STATUSES = ['Confirmada', 'Completada', 'Cancelada', 'Pendiente'];

const AppointmentsManagementTab = () => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentSummary | null>(null);
    const [fullSelectedAppointment, setFullSelectedAppointment] = useState<Appointment | null>(null);
    
    const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [clientNameFilter, setClientNameFilter] = useState('');
    const [clientIdFilter, setClientIdFilter] = useState<string | null>(null);
    const [professionalIdFilter, setProfessionalIdFilter] = useState<string | null>(null);
    const [serviceIdFilter, setServiceIdFilter] = useState<string | null>(null);
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    // Client Search states
    const [isClientListOpen, setIsClientListOpen] = useState(false);
    const clientSearchRef = useRef<HTMLDivElement>(null);

    // Fetch static data for filters
    useEffect(() => {
        const fetchFilterData = async () => {
            const { data: clientsData, error: clientsError } = await supabase.from('clients').select('id, full_name').order('full_name');
            const { data: servicesData, error: servicesError } = await supabase.from('services').select('id, name').order('name');
            const { data: professionalsData, error: professionalsError } = await supabase.from('professionals').select('id, full_name').order('full_name');

            if (clientsError || servicesError || professionalsError) {
                setError("No se pudieron cargar los datos para los filtros.");
            } else {
                setClients(clientsData || []);
                setServices(servicesData || []);
                setProfessionals(professionalsData || []);
            }
        };
        fetchFilterData();
    }, []);

    const fetchAppointments = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        
        const params = {
            p_client_id: clientIdFilter,
            p_professional_id: professionalIdFilter,
            p_service_id: serviceIdFilter ? parseInt(serviceIdFilter, 10) : null,
            p_start_date: startDateFilter || null,
            p_end_date: endDateFilter || null,
            p_status: statusFilter,
        };

        const { data, error: rpcError } = await supabase.rpc('get_all_appointments_summary', params);

        if (rpcError) {
            console.error("Error fetching appointments summary:", rpcError);
            setError("No se pudieron cargar las citas.");
        } else {
            setAppointments(data || []);
        }
        setIsLoading(false);
    }, [clientIdFilter, professionalIdFilter, serviceIdFilter, startDateFilter, endDateFilter, statusFilter]);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    // Close client list when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
                setIsClientListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClearFilters = () => {
        setClientNameFilter('');
        setClientIdFilter(null);
        setProfessionalIdFilter(null);
        setServiceIdFilter(null);
        setStartDateFilter('');
        setEndDateFilter('');
        setStatusFilter(null);
    };

    const handleClientSelect = (client: Client) => {
        setClientIdFilter(client.id);
        setClientNameFilter(client.full_name);
        setIsClientListOpen(false);
    };

    const filteredClients = useMemo(() => {
        if (!clientNameFilter) return [];
        return clients.filter(c => 
            c.full_name.toLowerCase().includes(clientNameFilter.toLowerCase())
        );
    }, [clientNameFilter, clients]);

    const handleAppointmentCreated = () => {
        setIsCreateModalOpen(false);
        fetchAppointments();
    };

    const handleDeleteClick = (appointment: AppointmentSummary) => {
        if (appointment.sale_id) {
            alert('Esta cita es parte de una venta y no puede ser borrada desde aquí. Por favor, gestione la venta completa para realizar cambios.');
            return;
        }
        setSelectedAppointment(appointment);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedAppointment) return;
        setIsDeleting(true);
        const { error: deleteError } = await supabase.from('appointments').delete().eq('id', selectedAppointment.id);
        if (deleteError) {
            alert(`Error al borrar la cita: ${deleteError.message}`);
        } else {
            alert('Cita borrada con éxito.');
            setIsDeleteModalOpen(false);
            setSelectedAppointment(null);
            fetchAppointments();
        }
        setIsDeleting(false);
    };

    const handleEditClick = async (appointmentSummary: AppointmentSummary) => {
        const { data, error } = await supabase.from('appointments').select('*, client:clients(*, name:full_name), service:services(*), professional:professionals(*, name:full_name)').eq('id', appointmentSummary.id).single();
        if (error) {
            alert("No se pudo cargar la información completa de la cita para editar.");
            return;
        }
        setFullSelectedAppointment(data as Appointment);
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async (editedAppointment: Appointment) => {
        const { error } = await supabase.from('appointments').update({
            client_id: editedAppointment.client.id,
            service_id: editedAppointment.service.id,
            professional_id: editedAppointment.professional.id,
            start_time: editedAppointment.start_time,
            end_time: editedAppointment.end_time,
            status: editedAppointment.status,
            notes: editedAppointment.notes
        }).eq('id', editedAppointment.id);

        if (error) {
            alert("Error al guardar los cambios.");
        } else {
            alert("Cita actualizada con éxito.");
            setIsEditModalOpen(false);
            fetchAppointments();
        }
    };

    const getStatusChipClass = (status: string) => {
        switch (status) {
            case 'Completada': return 'bg-green-100 text-green-800';
            case 'Confirmada': return 'bg-blue-100 text-blue-800';
            case 'Cancelada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Gestionar Citas</h3>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700 shadow-sm"
                >
                    <PlusIcon className="h-5 w-5"/>
                    Añadir Cita Manualmente
                </button>
            </div>

            {/* Filter Section */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {/* Client Search */}
                    <div ref={clientSearchRef} className="relative">
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                        <input
                            type="text"
                            id="clientName"
                            value={clientNameFilter}
                            onChange={(e) => { setClientNameFilter(e.target.value); setClientIdFilter(null); }}
                            onFocus={() => setIsClientListOpen(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            placeholder="Buscar cliente..."
                            autoComplete="off"
                        />
                        {isClientListOpen && clientNameFilter && filteredClients.length > 0 && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <ul className="py-1">
                                    {filteredClients.map(client => (
                                        <li key={client.id} onClick={() => handleClientSelect(client)} className="px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 cursor-pointer">
                                            {client.full_name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Other Filters */}
                    <div>
                        <label htmlFor="professional" className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                        <select id="professional" value={professionalIdFilter || ''} onChange={(e) => setProfessionalIdFilter(e.target.value || null)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                            <option value="">Todos</option>
                            {professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                        <select id="service" value={serviceIdFilter || ''} onChange={(e) => setServiceIdFilter(e.target.value || null)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                            <option value="">Todos</option>
                            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                            <input type="date" id="startDate" value={startDateFilter} onChange={(e) => setStartDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                            <input type="date" id="endDate" value={endDateFilter} onChange={(e) => setEndDateFilter(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm" />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                        <select id="status" value={statusFilter || ''} onChange={(e) => setStatusFilter(e.target.value || null)} className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm">
                            <option value="">Todos</option>
                            {APPOINTMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleClearFilters} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium">Limpiar Filtros</button>
                </div>
            </div>

            {isLoading ? (
                <p className="text-center py-4">Cargando citas...</p>
            ) : error ? (
                <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Servicio</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesional</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {appointments.length > 0 ? appointments.map((appt) => (
                                <tr key={appt.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{appt.client_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.service_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{appt.professional_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{format(new Date(appt.start_time), 'dd/MM/yyyy HH:mm')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(appt.status)}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button onClick={() => handleEditClick(appt)} className="text-blue-600 hover:text-blue-900"><PencilIcon className="h-5 w-5"/></button>
                                        <button onClick={() => handleDeleteClick(appt)} className="text-red-600 hover:text-red-900"><TrashIcon className="h-5 w-5"/></button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">No se encontraron citas para los filtros seleccionados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isCreateModalOpen && (
                <CreatePastAppointmentModal 
                    isOpen={isCreateModalOpen} 
                    onClose={() => setIsCreateModalOpen(false)} 
                    onAppointmentCreated={handleAppointmentCreated}
                />
            )}

            {isDeleteModalOpen && selectedAppointment && (
                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    itemName={`la cita de ${selectedAppointment.client_name} el ${format(new Date(selectedAppointment.start_time), 'dd/MM/yyyy')}`}
                    confirmationText="BORRAR"
                    isLoading={isDeleting}
                />
            )}

            {isEditModalOpen && fullSelectedAppointment && (
                <EditAppointmentModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveEdit}
                    appointment={fullSelectedAppointment}
                    clients={clients}
                    services={services}
                    professionals={professionals}
                />
            )}
        </div>
    );
};

export default AppointmentsManagementTab;
