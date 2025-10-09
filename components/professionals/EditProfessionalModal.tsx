
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Professional, Service, WeeklySchedule, ScheduleOverride } from '../../types';
import ToggleSwitch from '../ui/ToggleSwitch';
import { UploadIcon, DeleteIcon } from '../icons/Icons';
import { supabase } from '../../lib/supabaseClient';
import { ScheduleManager } from './ScheduleManager';

interface EditProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (professional: Professional, schedules: WeeklySchedule, overrides: ScheduleOverride[], avatarFile?: File) => void;
  professional: Professional | null;
  services: Service[];
}

const colors: Professional['color'][] = ['pink', 'purple', 'blue', 'green', 'yellow', 'red', 'indigo', 'gray'];
const colorHex = {
    pink: 'bg-pink-500', purple: 'bg-purple-500', blue: 'bg-blue-500', green: 'bg-green-500',
    yellow: 'bg-yellow-500', red: 'bg-red-500', indigo: 'bg-indigo-500', gray: 'bg-gray-500',
};

const EditProfessionalModal: React.FC<EditProfessionalModalProps> = ({ isOpen, onClose, onSave, professional, services }) => {
    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'Profesional' | 'Administradora'>('Profesional');
    const [assignedServices, setAssignedServices] = useState<number[]>([]);
    const [color, setColor] = useState<Professional['color']>('pink');
    const [status, setStatus] = useState<'active' | 'inactive'>('active');
    const [schedules, setSchedules] = useState<WeeklySchedule>({});
    const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
    const [avatarFile, setAvatarFile] = useState<File | undefined>();
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial state for dirty checking
    const [initialState, setInitialState] = useState<any>({});

    useEffect(() => {
        if (professional && isOpen) {
            const fetchScheduleData = async () => {
                // Fetch schedules
                const { data: scheduleData, error: scheduleError } = await supabase
                    .from('professional_schedules')
                    .select('day_of_week, start_time, end_time')
                    .eq('professional_id', professional.id);

                // Fetch overrides
                const { data: overrideData, error: overrideError } = await supabase
                    .from('schedule_overrides')
                    .select('id, override_date, is_working, start_time, end_time')
                    .eq('professional_id', professional.id);

                if (scheduleError || overrideError) {
                    console.error('Error fetching schedule data:', scheduleError || overrideError);
                    // Handle error appropriately
                }

                // Transform flat schedule data into a grouped object
                const groupedSchedules = (scheduleData || []).reduce((acc, shift) => {
                    const day = shift.day_of_week;
                    if (!acc[day]) {
                        acc[day] = [];
                    }
                    acc[day].push({ start_time: shift.start_time, end_time: shift.end_time });
                    return acc;
                }, {} as WeeklySchedule);

                const state = {
                    name: professional.name,
                    email: professional.email,
                    phone: professional.phone || '',
                    role: professional.role,
                    assignedServices: professional.assignedServices || [],
                    color: professional.color,
                    status: professional.status,
                    schedules: groupedSchedules,
                    overrides: overrideData || [],
                };

                setName(state.name);
                setEmail(state.email);
                setPhone(state.phone);
                setRole(state.role);
                setAssignedServices(state.assignedServices);
                setColor(state.color);
                setStatus(state.status);
                setSchedules(state.schedules);
                setOverrides(state.overrides);
                setAvatarPreview(professional.avatar);
                setAvatarFile(undefined);
                setError('');
                setInitialState(state);
            };

            fetchScheduleData();
        }
    }, [professional, isOpen]);

    const isDirty = useMemo(() => {
        if (!initialState.name) return false;
        if (
            initialState.name !== name ||
            initialState.email !== email ||
            initialState.phone !== phone ||
            initialState.role !== role ||
            initialState.color !== color ||
            initialState.status !== status ||
            avatarFile !== undefined ||
            JSON.stringify(initialState.schedules) !== JSON.stringify(schedules) ||
            JSON.stringify(initialState.overrides) !== JSON.stringify(overrides)
        ) {
            return true;
        }
        if (initialState.assignedServices.length !== assignedServices.length) return true;
        const initialSet = new Set(initialState.assignedServices);
        for (const serviceId of assignedServices) {
            if (!initialSet.has(serviceId)) return true;
        }
        return false;
    }, [name, email, phone, role, assignedServices, color, status, avatarFile, schedules, overrides, initialState]);

    const allServiceIds = useMemo(() => services.map(s => s.id), [services]);
    const areAllServicesSelected = assignedServices.length === allServiceIds.length;

    const handleServiceToggle = (serviceId: number) => {
        setAssignedServices(prev => 
            prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
        );
    };

    const handleToggleAllServices = () => {
        setAssignedServices(areAllServicesSelected ? [] : allServiceIds);
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleCloseAttempt = () => {
        if (isDirty) {
            if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!professional) return;
        if (!name.trim() || !email.trim()) {
            setError('El nombre y el email son obligatorios.');
            return;
        }
        setError('');
        const updatedProfessional = {
            ...professional,
            name,
            email,
            phone,
            role,
            color,
            status,
            assignedServices,
        };
        onSave(updatedProfessional, schedules, overrides, avatarFile);
    };

    if (!isOpen || !professional) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" 
            onClick={handleCloseAttempt} 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="modal-title"
        >
            <div 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl transform transition-all duration-300 animate-scaleUp max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-8 overflow-y-auto min-h-0">
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Editar Profesional</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                             <div className="space-y-5">
                                <div className="text-center">
                                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" />
                                    <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 flex items-center justify-center cursor-pointer border-2 border-dashed" onClick={() => fileInputRef.current?.click()}>
                                       {avatarPreview ? (
                                           <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full rounded-full object-cover"/>
                                       ) : (
                                            <div className="text-gray-400">
                                                <UploadIcon className="h-8 w-8 mx-auto"/>
                                                <span className="text-xs mt-1 block">Subir foto</span>
                                            </div>
                                       )}
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="name-edit" className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                                    <input type="text" id="name-edit" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="email-edit" className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" id="email-edit" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="phone-edit" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="tel" id="phone-edit" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="role-edit" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select id="role-edit" value={role} onChange={e => setRole(e.target.value as any)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                                        <option value="Profesional">Profesional</option>
                                        <option value="Administradora">Administradora</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Agenda</label>
                                    <div className="flex flex-wrap gap-2">
                                        {colors.map(c => (
                                            <button type="button" key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${colorHex[c]} transition-transform duration-150 ${color === c ? 'ring-2 ring-offset-2 ring-pink-500' : ''}`}></button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                                    <div className="text-sm">
                                        <h4 className="font-medium text-gray-800">Estado</h4>
                                        <p className="text-gray-500">{status === 'active' ? 'La profesional está activa.' : 'La profesional está inactiva.'}</p>
                                    </div>
                                    <ToggleSwitch enabled={status === 'active'} onChange={(e) => setStatus(e ? 'active' : 'inactive')} />
                                </div>
                            </div>
                            
                            <div className="md:col-span-2 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Servicios Asignados</h3>
                                <button type="button" onClick={handleToggleAllServices} className="text-sm text-pink-600 font-medium mb-2 self-start">{areAllServicesSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}</button>
                                <div className="border border-gray-200 rounded-lg bg-white h-full overflow-y-auto p-2 space-y-1">
                                    {services.map(service => (
                                        <div key={service.id} className="flex items-center p-2 rounded hover:bg-gray-50">
                                            <input 
                                                type="checkbox"
                                                id={`service-${service.id}-edit`}
                                                checked={assignedServices.includes(service.id)}
                                                onChange={() => handleServiceToggle(service.id)}
                                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                                            />
                                            <label htmlFor={`service-${service.id}-edit`} className="ml-3 text-sm text-gray-700">{service.name}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-200">
                             <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestión de Horarios</h3>
                             <ScheduleManager 
                                schedules={schedules}
                                overrides={overrides}
                                onSchedulesChange={setSchedules}
                                onOverridesChange={setOverrides}
                             />
                        </div>

                        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    </div>
                    
                    <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3 mt-auto border-t">
                        <button type="button" onClick={handleCloseAttempt} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                        <button type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditProfessionalModal;
