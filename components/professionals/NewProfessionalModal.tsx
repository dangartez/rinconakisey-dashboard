import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Professional, Service, WeeklySchedule, ScheduleOverride } from '../../types';
import { UploadIcon } from '../icons/Icons';
import { ScheduleManager } from './ScheduleManager';


type ProfessionalToSave = Omit<Professional, 'id' | 'creationDate' | 'avatar'> & {
    avatarFile?: File;
    schedules: WeeklySchedule;
    overrides: ScheduleOverride[];
};

interface NewProfessionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (professional: ProfessionalToSave) => void;
  services: Service[];
}

const colors: Professional['color'][] = ['pink', 'purple', 'blue', 'green', 'yellow', 'red', 'indigo', 'gray'];
const colorHex = {
    pink: 'bg-pink-500',
    purple: 'bg-purple-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    gray: 'bg-gray-500',
};


const NewProfessionalModal: React.FC<NewProfessionalModalProps> = ({ isOpen, onClose, onSave, services }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'Profesional' | 'Administradora'>('Profesional');
    const [avatarFile, setAvatarFile] = useState<File | undefined>();
    const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
    const [assignedServices, setAssignedServices] = useState<number[]>([]);
    const [color, setColor] = useState<Professional['color']>('pink');
    const [schedules, setSchedules] = useState<WeeklySchedule>({});
    const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
    
    const [error, setError] = useState('');
    const [serviceSearch, setServiceSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Reset state on close
    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => {
                setName('');
                setEmail('');
                setPhone('');
                setRole('Profesional');
                setAvatarFile(undefined);
                setAvatarPreview(undefined);
                setAssignedServices([]);
                setColor('pink');
                setSchedules({});
                setOverrides([]);
                setError('');
                setServiceSearch('');
            }, 200);
        }
    }, [isOpen]);

    const isDirty = useMemo(() => {
        return (
            name !== '' ||
            email !== '' ||
            phone !== '' ||
            role !== 'Profesional' ||
            avatarFile !== undefined ||
            assignedServices.length > 0 ||
            color !== 'pink' ||
            Object.keys(schedules).length > 0 ||
            overrides.length > 0
        );
    }, [name, email, phone, role, avatarFile, assignedServices, color, schedules]);
    
    const handleCloseAttempt = () => {
        if (isDirty) {
            if (window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres cerrar?')) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleServiceToggle = (serviceId: number) => {
        setAssignedServices(prev => 
            prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
        );
    };

    const handleToggleAllServices = () => {
        const allServiceIds = services.map(s => s.id);
        if (assignedServices.length === allServiceIds.length) {
            setAssignedServices([]);
        } else {
            setAssignedServices(allServiceIds);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !email.trim()) {
            setError('El nombre y el email son obligatorios.');
            return;
        }
        setError('');
        onSave({
            name,
            email,
            phone,
            role,
            color,
            assignedServices,
            avatarFile,
            schedules,
            overrides,
        });
    };

    // Memoized lists for performance
    const filteredAvailableServices = useMemo(() => {
        if (!serviceSearch.trim()) {
            return services.sort((a,b) => a.name.localeCompare(b.name));
        }
        return services.filter(service => 
            service.name.toLowerCase().includes(serviceSearch.toLowerCase())
        ).sort((a,b) => a.name.localeCompare(b.name));
    }, [serviceSearch, services]);

    const selectedServiceObjects = useMemo(() => {
        return services
            .filter(service => assignedServices.includes(service.id))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [assignedServices, services]);

    const allServiceIds = useMemo(() => services.map(s => s.id), [services]);
    const areAllServicesSelected = assignedServices.length === allServiceIds.length;

    if (!isOpen) return null;

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
                        <h2 id="modal-title" className="text-3xl font-bold text-gray-900 mb-6">Añadir Profesional</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Left Column: Avatar & Details */}
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
                                    <label htmlFor="professional_name" className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                                    <input type="text" id="professional_name" name="professional_name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                 <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                    <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                                </div>
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                    <select id="role" value={role} onChange={e => setRole(e.target.value as any)} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
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
                            </div>
                            
                            {/* Right Column: Services */}
                            <div className="md:col-span-2 flex flex-col">
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">Servicios Asignados</h3>
                                <p className="text-sm text-gray-500 mb-4">Busca y selecciona los servicios que realizará el profesional.</p>
                                
                                <div className="flex items-center space-x-2 mb-3">
                                    <input 
                                        type="text" 
                                        placeholder="Buscar servicio..."
                                        value={serviceSearch}
                                        onChange={(e) => setServiceSearch(e.target.value)}
                                        className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleToggleAllServices}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg whitespace-nowrap transition-colors"
                                    >
                                        {areAllServicesSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 flex-1 min-h-[300px]">
                                    <div>
                                        <h4 className="font-semibold text-gray-600 text-sm mb-2">Disponibles ({filteredAvailableServices.length})</h4>
                                        <div className="border border-gray-200 rounded-lg bg-white h-full overflow-y-auto p-2 space-y-1">
                                            {filteredAvailableServices.map(service => (
                                                <button
                                                    key={service.id}
                                                    type="button"
                                                    onClick={() => handleServiceToggle(service.id)}
                                                    disabled={assignedServices.includes(service.id)}
                                                    className="w-full text-left p-2 rounded text-sm transition-colors text-gray-800 disabled:bg-pink-50 disabled:text-pink-700 disabled:font-medium disabled:cursor-default hover:bg-gray-50"
                                                >
                                                    {service.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-600 text-sm mb-2">Seleccionados ({selectedServiceObjects.length})</h4>
                                        <div className="border border-gray-200 rounded-lg bg-white h-full overflow-y-auto p-2 space-y-1">
                                            {selectedServiceObjects.length > 0 ? selectedServiceObjects.map(service => (
                                                <div key={service.id} className="flex items-center justify-between p-2 rounded bg-white text-sm text-gray-800 border border-gray-100">
                                                    <span className="font-medium">{service.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleServiceToggle(service.id)}
                                                        className="text-gray-400 hover:text-red-500 p-1"
                                                        aria-label={`Quitar ${service.name}`}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                    </button>
                                                </div>
                                            )) : (
                                                <div className="flex items-center justify-center h-full text-center text-sm text-gray-400 p-4">
                                                    <p>Selecciona servicios de la lista de disponibles.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-gray-200">
                             <h3 className="text-lg font-semibold text-gray-800 mb-4">Gestión de Horarios</h3>
                             <ScheduleManager 
                                schedules={schedules}
                                onSchedulesChange={setSchedules}
                                overrides={overrides}
                                onOverridesChange={setOverrides}
                             />
                        </div>

                         {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                    </div>
                    <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3 mt-auto border-t">
                        <button 
                            type="button"
                            onClick={handleCloseAttempt} 
                            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
                        >
                            Guardar Profesional
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProfessionalModal;