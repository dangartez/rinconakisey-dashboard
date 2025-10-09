
import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Professional, Appointment, Service, WeeklySchedule, ScheduleOverride } from '../types';
import { appointments as initialAppointments } from '../data/mockData';
import NewProfessionalModal from '../components/professionals/NewProfessionalModal';
import EditProfessionalModal from '../components/professionals/EditProfessionalModal';
import ProfessionalAgendaModal from '../components/professionals/ProfessionalAgendaModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import EditAppointmentModal from '../components/agenda/EditAppointmentModal';
import { TrashIcon } from '../components/icons/Icons';

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonColor?: 'pink' | 'red';
}

// Define el tipo de datos que viene del modal de creación
type ProfessionalToSave = Omit<Professional, 'id' | 'creationDate' | 'avatar' | 'status'> & {
    avatarFile?: File;
    schedules: WeeklySchedule;
    overrides: ScheduleOverride[];
};

const ProfessionalsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
    
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAgendaModalOpen, setIsAgendaModalOpen] = useState(false);
    
    const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    useEffect(() => {
        fetchProfessionals();
        fetchServices();
    }, []);

    const fetchProfessionals = async () => {
        const { data, error } = await supabase
            .from('professionals')
            .select('*, name:full_name, avatar:avatar_url, professional_skills(service_id)');
        
        if (error) {
            console.error('Error fetching professionals:', error);
        } else {
            const professionalsWithServices = data.map(p => ({
                ...p,
                assignedServices: p.professional_skills.map(ps => ps.service_id)
            }));
            setProfessionals(professionalsWithServices as Professional[]);
        }
    };

    const fetchServices = async () => {
        const { data, error } = await supabase.from('services').select('*, breakDuration:break_time');
        if (error) {
            console.error('Error fetching services:', error);
        } else {
            setServices(data as Service[]);
        }
    };

    const filteredProfessionals = useMemo(() => {
        const professionalsToFilter = [...professionals].sort((a,b) => a.name.localeCompare(b.name));

        if (!searchTerm.trim()) return professionalsToFilter;

        const lowercasedFilter = searchTerm.toLowerCase();
        return professionalsToFilter.filter((pro: Professional) =>
            (pro.name || '').toLowerCase().includes(lowercasedFilter) ||
            (pro.phone || '').includes(lowercasedFilter) ||
            (pro.email || '').toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, professionals]);

    const handleAddProfessional = async (newProfessionalData: ProfessionalToSave) => {
        const { avatarFile, name, assignedServices, schedules, overrides, ...restData } = newProfessionalData;
        
        let avatar_url: string | undefined = undefined;

        // 1. Handle avatar upload
        if (avatarFile) {
            const filePath = `pro-${Date.now()}-${avatarFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile);

            if (uploadError) {
                console.error('Error uploading avatar:', uploadError);
                alert('Error al subir la imagen del profesional.');
                return;
            }

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatar_url = urlData.publicUrl;
        }

        // 2. Insert professional data
        const professionalToInsert = {
            ...restData,
            full_name: name,
            avatar_url,
        };

        const { data: newProfessional, error: insertError } = await supabase
            .from('professionals')
            .insert(professionalToInsert)
            .select()
            .single();

        if (insertError || !newProfessional) {
            console.error('Error inserting professional:', insertError);
            alert('Error al crear el profesional.');
            return;
        }

        // 3. Insert skills
        if (assignedServices && assignedServices.length > 0) {
            const newSkills = assignedServices.map(service_id => ({
                professional_id: newProfessional.id,
                service_id,
            }));

            const { error: insertSkillsError } = await supabase
                .from('professional_skills')
                .insert(newSkills);

            if (insertSkillsError) {
                console.error('Error inserting new skills:', insertSkillsError);
                alert('Error al asignar las habilidades. El profesional fue creado pero sin servicios.');
            }
        }

        // 4. Insert schedules and overrides via RPC
        const schedulesToInsert = Object.entries(schedules).flatMap(([dayId, shifts]) =>
            shifts.map(shift => ({
                day_of_week: parseInt(dayId, 10),
                start_time: shift.start_time,
                end_time: shift.end_time,
            }))
        );
        const overridesToInsert = overrides.map(({ id, ...rest }) => rest); // Remove temporary UI id

        const { error: scheduleError } = await supabase.rpc('update_professional_schedule', {
            p_professional_id: newProfessional.id,
            p_schedules: schedulesToInsert,
            p_overrides: overridesToInsert,
        });

        if (scheduleError) {
            console.error('Error saving schedule:', scheduleError);
            alert('El profesional fue creado, pero hubo un error al guardar su horario.');
        }

        // 5. Refresh UI
        setIsNewModalOpen(false);
        fetchProfessionals();
    };

    const handleEditClick = (pro: Professional) => {
        setSelectedProfessional(pro);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (pro: Professional) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Profesional',
            message: `¿Estás seguro de que quieres eliminar a ${pro.name}? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                // This RPC function should handle all dependencies (skills, schedules, etc.)
                const { error } = await supabase.rpc('delete_professional_with_dependencies', { p_professional_id: pro.id });

                if (error) {
                    alert(`Error al eliminar el profesional: ${error.message}`);
                } else {
                    if (pro.avatar) {
                        const avatarPath = pro.avatar.split('/avatars/')[1];
                        if (avatarPath) {
                            await supabase.storage.from('avatars').remove([avatarPath]);
                        }
                    }
                    fetchProfessionals();
                }
                
                setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
            confirmButtonColor: 'red',
        });
    };

    const handleUpdateProfessional = async (updatedPro: Professional, schedules: WeeklySchedule, overrides: ScheduleOverride[], avatarFile?: File) => {
        const { id, name, email, phone, role, color, status, assignedServices, avatar } = updatedPro;

        let avatar_url = avatar;

        // 1. Handle new avatar upload
        if (avatarFile) {
            const filePath = `pro-${id}-${Date.now()}-${avatarFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, avatarFile, { upsert: true });

            if (uploadError) {
                alert(`Error al subir la nueva imagen: ${uploadError.message}`);
                return;
            }

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
            avatar_url = urlData.publicUrl;

            if (avatar && avatar !== avatar_url) {
                const oldAvatarPath = avatar.split('/avatars/')[1];
                if (oldAvatarPath) {
                    await supabase.storage.from('avatars').remove([oldAvatarPath]);
                }
            }
        }

        // 2. Update professional data
        const { error: profileError } = await supabase
            .from('professionals')
            .update({ full_name: name, email, phone, role, color, status, avatar_url })
            .eq('id', id);

        if (profileError) {
            console.error('Error updating professional:', profileError);
            alert('Error al actualizar el profesional.');
            return;
        }

        // 3. Update skills (delete and insert)
        await supabase.from('professional_skills').delete().eq('professional_id', id);
        if (assignedServices && assignedServices.length > 0) {
            const newSkills = assignedServices.map(service_id => ({ professional_id: id, service_id }));
            const { error: insertSkillsError } = await supabase.from('professional_skills').insert(newSkills);
            if (insertSkillsError) {
                console.error('Error inserting new skills:', insertSkillsError);
                alert('Error al actualizar las habilidades.');
                return;
            }
        }

        // 4. Update schedules and overrides via RPC
        const schedulesToInsert = Object.entries(schedules).flatMap(([dayId, shifts]) =>
            shifts.map(shift => ({ day_of_week: parseInt(dayId, 10), start_time: shift.start_time, end_time: shift.end_time }))
        );
        const overridesToInsert = overrides.map(({ id, ...rest }) => rest);

        const { error: scheduleError } = await supabase.rpc('update_professional_schedule', {
            p_professional_id: id,
            p_schedules: schedulesToInsert,
            p_overrides: overridesToInsert,
        });

        if (scheduleError) {
            console.error('Error saving schedule:', scheduleError);
            alert('Los datos del profesional se guardaron, pero hubo un error al guardar su horario.');
        }

        // 5. If all went well, close modal and refresh data
        setIsEditModalOpen(false);
        fetchProfessionals();
    };

    const handleViewAgendaClick = (pro: Professional) => {
        setSelectedProfessional(pro);
        setIsAgendaModalOpen(true);
    };

    const handleUpdateAppointment = (updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(app => app.id === updatedAppointment.id ? updatedAppointment : app));
        setEditingAppointment(null);
    };
    
    const handleDeleteAppointment = (appointmentId: string) => {
        setAppointments(prev => prev.filter(app => app.id !== appointmentId));
    };

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Profesionales</h1>
                        <p className="text-gray-500 mt-1">Gestiona tu equipo y sus especialidades.</p>
                    </div>
                    <button 
                        onClick={() => setIsNewModalOpen(true)}
                        className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm">
                        Añadir Profesional
                    </button>
                </div>

                 <div className="bg-white p-8 rounded-xl shadow-sm">
                     <div className="mb-6">
                         <input 
                            type="text" 
                            placeholder="Buscar por nombre, teléfono, email..." 
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
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Email</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Teléfono</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Rol</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Estado</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfessionals.map(pro => (
                                    <tr key={pro.id} className={`border-b border-gray-100 last:border-b-0 transition-colors ${pro.status === 'inactive' ? 'bg-red-500/10 hover:bg-red-500/20' : 'hover:bg-gray-50/50'}`}>
                                        <td className="p-4 text-gray-800 font-medium flex items-center">
                                            <img 
                                                src={pro.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(pro.name)}&background=random&color=fff`} 
                                                alt={pro.name} 
                                                className="h-10 w-10 rounded-full mr-4 object-cover bg-gray-200" 
                                            />
                                            {pro.name}
                                        </td>
                                        <td className="p-4 text-gray-600">{pro.email}</td>
                                        <td className="p-4 text-gray-600">{pro.phone}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${pro.role === 'Administradora' ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {pro.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${pro.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {pro.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap space-x-4">
                                            <button onClick={() => handleViewAgendaClick(pro)} className="text-blue-600 hover:underline text-sm font-medium">Ver Agenda</button>
                                            <button onClick={() => handleEditClick(pro)} className="text-pink-600 hover:underline text-sm font-medium">Editar</button>
                                            <button onClick={() => handleDeleteClick(pro)} className="text-gray-500 hover:text-red-600 p-1 rounded-full transition-colors" aria-label={`Eliminar ${pro.name}`}>
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
            <NewProfessionalModal 
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSave={handleAddProfessional}
                services={services}
            />
             {selectedProfessional && (
                <>
                    <EditProfessionalModal
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onSave={handleUpdateProfessional}
                        professional={selectedProfessional}
                        services={services}
                    />
                    <ProfessionalAgendaModal
                        isOpen={isAgendaModalOpen}
                        onClose={() => setIsAgendaModalOpen(false)}
                        professional={selectedProfessional}
                        appointments={appointments}
                        onEditAppointment={(app) => setEditingAppointment(app)}
                        onDeleteAppointment={handleDeleteAppointment}
                    />
                </>
            )}
             {editingAppointment && (
                <EditAppointmentModal 
                    isOpen={!!editingAppointment}
                    onClose={() => setEditingAppointment(null)}
                    appointment={editingAppointment}
                    onSave={handleUpdateAppointment}
                />
            )}
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

export default ProfessionalsPage;
