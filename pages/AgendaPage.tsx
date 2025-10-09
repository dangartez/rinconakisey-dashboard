import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Appointment, Professional, Client, Service } from '../types';
import { ChevronDownIcon, CheckIcon } from '../components/icons/Icons';
import ProfessionalBadge from '../components/ui/ProfessionalBadge';
import NewAppointmentModal from '../components/agenda/NewAppointmentModal';
import EditAppointmentModal from '../components/agenda/EditAppointmentModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import ComboBox from '../components/ui/ComboBox';

// --- HELPERS ---
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60).toString().padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
};

const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getWeekDays = (startDate: Date) => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const newDate = new Date(startDate);
        newDate.setDate(startDate.getDate() + i);
        dates.push(newDate);
    }
    return dates;
};

const getMonthGrid = (dateInMonth: Date) => {
    const year = dateInMonth.getFullYear();
    const month = dateInMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    const dayOfWeek = (firstDay.getDay() + 6) % 7; // Monday is 0
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    const grid = [];
    for (let i = 0; i < 6; i++) { // 6 weeks for full coverage
        const week = [];
        for (let j = 0; j < 7; j++) {
            week.push(new Date(startDate));
            startDate.setDate(startDate.getDate() + 1);
        }
        grid.push(week);
        if (startDate > lastDay && i > 3) break;
    }
    return grid;
};

const getStartOfWeek = (date: Date) => {
    const dateCopy = new Date(date);
    const day = dateCopy.getDay();
    const diff = dateCopy.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    dateCopy.setDate(diff);
    dateCopy.setHours(0, 0, 0, 0);
    return dateCopy;
};
// --- END HELPERS ---


// --- VIEW COMPONENTS ---
const TodayView: React.FC<{ appointments: Appointment[], professionals: Professional[], onSelectAppointment: (appointment: Appointment) => void }> = ({ appointments, professionals, onSelectAppointment }) => {
    const calendarStartHour = 8;
    const calendarEndHour = 18;
    const hours = Array.from({ length: calendarEndHour - calendarStartHour + 1 }, (_, i) => i + calendarStartHour);

    const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
      const colorVariants = {
        red: { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300' },
        green: { bg: 'bg-green-100', text: 'text-green-900', border: 'border-green-300' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-300' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-900', border: 'border-blue-300' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-300' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-900', border: 'border-pink-300' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-900', border: 'border-indigo-300' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-900', border: 'border-gray-300' },
      };
      const colors = colorVariants[appointment.professional.color] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };
      const hourHeight = 96;
      const top = ((timeToMinutes(new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })) - calendarStartHour * 60) / 60) * hourHeight;
      const height = ((timeToMinutes(new Date(appointment.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })) - timeToMinutes(new Date(appointment.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))) / 60) * hourHeight;
      
      return (
        <div 
            style={{ top: `${top}px`, height: `${height}px` }} 
            className={`absolute w-[calc(100%-0.5rem)] left-1 rounded-lg p-2 text-xs border-l-4 cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-pink-400 transition-all ${colors.bg} ${colors.text} ${colors.border}`}
            onClick={() => onSelectAppointment(appointment)}
        >
          <p className="font-bold whitespace-nowrap overflow-hidden text-ellipsis">{appointment.service.name}</p>
          <p className="whitespace-nowrap overflow-hidden text-ellipsis">{appointment.client.name}</p>
        </div>
      );
    };

    return (
        <div className="flex w-full min-w-[600px]">
            <div className="w-16 flex-shrink-0">
                <div className="h-10"></div>
                {hours.map(hour => (
                    <div key={hour} className="h-24 -mt-2.5 pr-2 text-right"><span className="text-xs text-gray-400">{hour}:00</span></div>
                ))}
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${professionals.length || 1}, minmax(0, 1fr))` }}>
                {professionals.length > 0 ? professionals.map(pro => (
                    <div key={pro.id} className="relative border-l border-gray-200">
                        <div className="h-10 sticky top-0 bg-white z-[1] flex items-center justify-center text-center py-2 border-b border-gray-200">
                            <span className="font-semibold text-gray-700">{pro.name}</span>
                        </div>
                        <div className="relative">
                            {hours.slice(1).map(hour => <div key={hour} className="h-24 border-t border-gray-200"></div>)}
                            {appointments.filter(app => app.professional && app.professional.id === pro.id).map(app => (
                                <AppointmentCard key={app.id} appointment={app} />
                            ))}
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full flex items-center justify-center h-full text-gray-500 py-16">Selecciona un profesional para ver la agenda.</div>
                )}
            </div>
        </div>
    );
};

const WeekView: React.FC<{ appointmentsByDate: Record<string, Appointment[]>, startDate: Date, onSelectAppointment: (appointment: Appointment) => void }> = ({ appointmentsByDate, startDate, onSelectAppointment }) => {
    const weekDays = getWeekDays(startDate);
    const dayLocale = 'es-ES';
    const professionalColorClasses: Record<Professional['color'], string> = {
        red: 'border-red-300 bg-red-100', green: 'border-green-300 bg-green-100', purple: 'border-purple-300 bg-purple-100',
        blue: 'border-blue-300 bg-blue-100', yellow: 'border-yellow-300 bg-yellow-100', pink: 'border-pink-300 bg-pink-100',
        indigo: 'border-indigo-300 bg-indigo-100', gray: 'border-gray-300 bg-gray-100',
    };
    return (
        <div className="grid grid-cols-7 w-full min-w-[800px]">
            {weekDays.map(date => {
                const dateKey = formatDate(date);
                const appointments = appointmentsByDate[dateKey] || [];
                return (
                    <div key={dateKey} className="border-l border-gray-200 first:border-l-0">
                        <div className="text-center py-2 border-b border-gray-200 sticky top-0 bg-white z-[1]">
                            <p className="font-semibold text-gray-700 text-sm">{date.toLocaleDateString(dayLocale, { weekday: 'short' })}</p>
                            <p className="font-bold text-lg text-gray-800">{date.getDate()}</p>
                        </div>
                        <div className="p-2 space-y-2 h-[60vh] overflow-y-auto">
                            {appointments.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).map(app => (
                                <div 
                                    key={app.id} 
                                    className={`p-2 rounded-lg border-l-4 cursor-pointer hover:shadow-md hover:ring-2 hover:ring-pink-300 transition-all ${professionalColorClasses[app.professional.color]}`}
                                    onClick={() => onSelectAppointment(app)}
                                >
                                    <p className="font-bold text-xs">{new Date(app.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
                                    <p className="text-xs font-medium text-gray-800">{app.service.name}</p>
                                    <p className="text-xs text-gray-600">{app.client.name}</p>
                                    <p className="text-xs font-semibold text-gray-500">{app.professional.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const MonthView: React.FC<{ appointmentsByDate: Record<string, Appointment[]>, currentDate: Date, onSelectAppointment: (appointment: Appointment) => void }> = ({ appointmentsByDate, currentDate, onSelectAppointment }) => {
    const monthGrid = getMonthGrid(currentDate);
    const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const professionalColorClasses: Record<Professional['color'], { bg: string, text: string }> = {
        red: { bg: 'bg-red-100', text: 'text-red-800' }, green: { bg: 'bg-green-100', text: 'text-green-800' }, purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-800' }, yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' }, pink: { bg: 'bg-pink-100', text: 'text-pink-800' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800' }, gray: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };
    return (
        <div className="w-full">
            <div className="grid grid-cols-7 text-center font-semibold text-sm text-gray-600 border-b border-gray-200">
                {dayNames.map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 grid-rows-5 h-[60vh]">
                {monthGrid.flat().map(date => {
                    const dateKey = formatDate(date);
                    const appointments = appointmentsByDate[dateKey] || [];
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = formatDate(new Date()) === dateKey;
                    return (
                        <div key={dateKey} className={`border-t border-l border-gray-200 p-1.5 ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}`}>
                             <p className={`text-xs font-semibold ${isToday ? 'bg-pink-600 text-white rounded-full w-5 h-5 flex items-center justify-center' : ''} ${!isCurrentMonth ? 'text-gray-400' : ''}`}>
                                {date.getDate()}
                            </p>
                            <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                                {appointments.map(app => (
                                    <div 
                                        key={app.id} 
                                        className={`p-1 rounded text-xs cursor-pointer hover:scale-105 transition-transform ${professionalColorClasses[app.professional.color].bg} ${professionalColorClasses[app.professional.color].text}`}
                                        onClick={() => onSelectAppointment(app)}
                                    >
                                        <p className="font-bold truncate">{app.service.name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AgendaPage: React.FC = () => {
    const [activeView, setActiveView] = useState('Hoy');
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    const [selectedProfessionalIds, setSelectedProfessionalIds] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [isCalendarVisible, setIsCalendarVisible] = useState(true);
    const [confirmation, setConfirmation] = useState<any>({ isOpen: false });
    const filterRef = useRef<HTMLDivElement>(null);

    // New state for filters
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    // Adjust date when view changes
    useEffect(() => {
        if (activeView === 'Semanal') {
            setCurrentDate(getStartOfWeek(new Date()));
        } else if (activeView === 'Hoy' || activeView === 'TODAS') {
            setCurrentDate(new Date());
        }
    }, [activeView]);

    const fetchAppointments = async () => {
        const { data, error } = await supabase.from('appointments').select(`*,
            client:clients(id, name:full_name),
            professional:professionals(id, name:full_name, color),
            service:services(id, name, duration)`);
        if (error) console.error('Error fetching appointments:', error);
        else setAppointments(data as any[] || []);
    };

    const fetchProfessionals = async () => {
        const { data, error } = await supabase.from('professionals').select('*, name:full_name, professional_skills(service_id)');
        if (error) console.error('Error fetching professionals:', error);
        else {
            const professionalsWithServices = data.map(p => ({ ...p, assignedServices: p.professional_skills.map((ps: any) => ps.service_id) }));
            setProfessionals(professionalsWithServices as Professional[]);
            setSelectedProfessionalIds(data?.map(p => p.id) || []);
        }
    };

    const fetchClients = async () => {
        const { data, error } = await supabase.from('clients').select('*, name:full_name, registrationDate:created_at');
        if (error) console.error('Error fetching clients:', error);
        else setClients(data as Client[]);
    };

    const fetchServices = async () => {
        const { data, error } = await supabase.from('services').select('*, breakDuration:break_time');
        if (error) console.error('Error fetching services:', error);
        else setServices(data as Service[]);
    };

    useEffect(() => {
        fetchAppointments();
        fetchProfessionals();
        fetchClients();
        fetchServices();
    }, []); // WARNING: This is not ideal, fetch functions should be dependencies.

    const allProfessionalIds = useMemo(() => professionals.map(p => p.id), [professionals]);
    const areAllSelected = useMemo(() => selectedProfessionalIds.length === allProfessionalIds.length, [selectedProfessionalIds, allProfessionalIds]);
    const visibleProfessionals = useMemo(() => professionals.filter(p => selectedProfessionalIds.includes(p.id)), [selectedProfessionalIds, professionals]);

    const appointmentsByDate = useMemo(() => {
        let filtered = appointments;

        if (selectedProfessionalIds.length > 0) {
            filtered = filtered.filter(app => app.professional && selectedProfessionalIds.includes(app.professional.id));
        }
        if (selectedClient) {
            filtered = filtered.filter(app => app.client && app.client.id === selectedClient.id);
        }
        if (selectedService) {
            filtered = filtered.filter(app => app.service && app.service.id === selectedService.id);
        }

        return filtered.reduce((acc, app) => {
            const date = formatDate(new Date(app.start_time));
            if (!acc[date]) acc[date] = [];
            acc[date].push(app);
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [appointments, selectedProfessionalIds, selectedClient, selectedService]);

    const filteredAppointmentsForList = useMemo(() => {
        let filtered = appointments;

        if (selectedProfessionalIds.length > 0) {
            filtered = filtered.filter(app => app.professional && selectedProfessionalIds.includes(app.professional.id));
        }
        if (selectedClient) {
            filtered = filtered.filter(app => app.client && app.client.id === selectedClient.id);
        }
        if (selectedService) {
            filtered = filtered.filter(app => app.service && app.service.id === selectedService.id);
        }

        if (activeView === 'Hoy') {
            const todayStr = formatDate(currentDate);
            const todayAppointments = filtered.filter(app => {
                const appDate = formatDate(new Date(app.start_time));
                return appDate === todayStr;
            });
            return todayAppointments.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }

        if (activeView === 'Semanal') {
            const startOfWeek = currentDate;
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);

            const startStr = formatDate(startOfWeek);
            const endStr = formatDate(endOfWeek);

            const weekAppointments = filtered.filter(app => {
                const appDate = formatDate(new Date(app.start_time));
                return appDate >= startStr && appDate <= endStr;
            });
            return weekAppointments.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
        }

        // Default case for 'TODAS'
        const todayStr = formatDate(new Date());
        const upcomingAppointments = filtered.filter(app => formatDate(new Date(app.start_time)) >= todayStr);

        return upcomingAppointments.sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    }, [appointments, selectedProfessionalIds, selectedClient, selectedService, activeView, currentDate]);

    const handleToggleAll = () => setSelectedProfessionalIds(areAllSelected ? [] : allProfessionalIds);
    const handleToggleProfessional = (id: string) => setSelectedProfessionalIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) setIsFilterOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const changeDate = (amount: number) => {
        const newDate = new Date(currentDate);
        if (activeView === 'Hoy') newDate.setDate(newDate.getDate() + amount);
        else if (activeView === 'Semanal') newDate.setDate(newDate.getDate() + (amount * 7));
        else if (activeView === 'TODAS') newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };
    
    const handleSelectAppointment = (appointment: Appointment) => {
        setEditingAppointment(appointment);
    };

    const handleUpdateAppointment = async (updatedAppointment: Appointment) => {
        const { error } = await supabase
            .from('appointments')
            .update({
                client_id: updatedAppointment.client.id,
                service_id: updatedAppointment.service.id,
                professional_id: updatedAppointment.professional.id,
                start_time: updatedAppointment.start_time,
                end_time: updatedAppointment.end_time,
                status: updatedAppointment.status,
            })
            .eq('id', updatedAppointment.id);

        if (error) {
            alert(`Error al actualizar la cita: ${error.message}`);
        } else {
            fetchAppointments();
            setEditingAppointment(null);
        }
    };
    
    const handleAddNewAppointment = async (data: any) => {
        const { client, service, professionalId, date, startTime } = data;
        const [hours, minutes] = startTime.split(':').map(Number);
        const startDate = new Date(date);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + service.duration * 60000);

        const { error } = await supabase.from('appointments').insert({
            client_id: client.id,
            service_id: service.id,
            professional_id: professionalId === 'any' ? professionals[0].id : professionalId,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            status: 'Pendiente',
        });

        if (error) {
            alert(`Error al crear la cita: ${error.message}`);
        } else {
            fetchAppointments();
            setIsNewAppointmentModalOpen(false);
        }
    };

    const viewButtons = ['Hoy', 'Semanal', 'TODAS'];
    const currentViewTitle = useMemo(() => {
        if (activeView === 'Hoy') return currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric'});
        if (activeView === 'Semanal') {
            const endOfWeek = new Date(currentDate);
            endOfWeek.setDate(currentDate.getDate() + 6);
            return `Semana del ${currentDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} al ${endOfWeek.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`;
        }
        if (activeView === 'TODAS') return currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        return '';
    }, [activeView, currentDate]);
    
    return (
        <>
            <div className="space-y-8">
                <div className="flex justify-between items-center">
                    <h1 className="text-4xl font-bold text-gray-800">Agenda</h1>
                    <button onClick={() => setIsNewAppointmentModalOpen(true)} className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm">Nueva Cita</button>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                        {/* Row 1: View and Date Navigation */}
                        <div className="flex items-center space-x-4">
                             <div className="bg-gray-100 p-1 rounded-lg flex items-center space-x-1">
                                {viewButtons.map(view => (
                                    <button key={view} onClick={() => setActiveView(view)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeView === view ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}>
                                        {view}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => changeDate(-1)} className="p-2 rounded-md hover:bg-gray-100"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                <span className="font-semibold text-gray-700 text-lg capitalize">{currentViewTitle}</span>
                                <button onClick={() => changeDate(1)} className="p-2 rounded-md hover:bg-gray-100"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                            </div>
                        </div>
                        <button onClick={() => setIsCalendarVisible(prev => !prev)} className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                            {isCalendarVisible ? 'Ocultar Calendario' : 'Mostrar Calendario'}
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Row 2: Filters */}
                        <div className="flex-grow md:flex-grow-0 w-full md:w-48">
                            <ComboBox 
                                items={clients}
                                selectedValue={selectedClient}
                                onSelect={(item) => setSelectedClient(item as Client | null)}
                                placeholder="Buscar cliente..."
                            />
                        </div>
                        <div className="flex-grow md:flex-grow-0 w-full md:w-48">
                            <ComboBox 
                                items={services}
                                selectedValue={selectedService}
                                onSelect={(item) => setSelectedService(item as Service | null)}
                                placeholder="Buscar servicio..."
                            />
                        </div>
                        <div ref={filterRef} className="relative">
                            <button onClick={() => setIsFilterOpen(prev => !prev)} className="flex items-center space-x-2 border border-gray-200 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors w-full justify-between md:w-auto">
                                <span className="text-sm font-medium text-gray-700">{areAllSelected ? 'Todos los Profesionales' : `${selectedProfessionalIds.length} seleccionados`}</span>
                                <ChevronDownIcon className="h-4 w-4 text-gray-500"/>
                            </button>
                            {isFilterOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-md shadow-lg z-10 py-1">
                                    <div onClick={handleToggleAll} className="flex items-center px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"><div className="w-5 mr-2 flex items-center justify-center">{areAllSelected && <CheckIcon className="h-3.5 w-3.5" />}</div>Todos</div>
                                    <div className="h-px bg-gray-700 my-1"></div>
                                    {professionals.map(pro => (
                                        <div key={pro.id} onClick={() => handleToggleProfessional(pro.id)} className="flex items-center px-3 py-2 text-sm hover:bg-gray-700 cursor-pointer"><div className="w-5 mr-2 flex items-center justify-center">{selectedProfessionalIds.includes(pro.id) && <CheckIcon className="h-3.5 w-3.5" />}</div>{pro.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={() => { setSelectedClient(null); setSelectedService(null); handleToggleAll(); }} className="text-sm font-medium text-pink-600 hover:text-pink-800 transition-colors">
                            Limpiar Filtros
                        </button>
                    </div>
                    
                    <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCalendarVisible ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="overflow-auto">
                            {activeView === 'Hoy' && <TodayView appointments={appointmentsByDate[formatDate(currentDate)] || []} professionals={visibleProfessionals} onSelectAppointment={handleSelectAppointment} />}
                            {activeView === 'Semanal' && <WeekView appointmentsByDate={appointmentsByDate} startDate={currentDate} onSelectAppointment={handleSelectAppointment} />}
                            {activeView === 'TODAS' && <MonthView appointmentsByDate={appointmentsByDate} currentDate={currentDate} onSelectAppointment={handleSelectAppointment} />}
                        </div>
                    </div>

                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Próximas Citas</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-gray-100">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Fecha</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Hora</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Cliente</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Servicio</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Profesional</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointmentsForList.map(app => (
                                    <tr key={app.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(app.start_time).toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'})}</td>
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{new Date(app.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(app.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</td>
                                        <td className="p-4 text-gray-800 font-medium">{app.client.name}</td>
                                        <td className="p-4 text-gray-600">{app.service.name}</td>
                                        <td className="p-4"><ProfessionalBadge professional={app.professional} /></td>
                                        <td className="p-4"><button onClick={() => handleSelectAppointment(app)} className="text-blue-600 hover:underline text-sm font-medium">Editar</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <NewAppointmentModal 
                isOpen={isNewAppointmentModalOpen} 
                onClose={() => setIsNewAppointmentModalOpen(false)}
                onSave={handleAddNewAppointment}
                clients={clients}
                services={services}
                professionals={professionals}
            />
            {editingAppointment && (
                <EditAppointmentModal 
                    isOpen={!!editingAppointment}
                    onClose={() => setEditingAppointment(null)}
                    appointment={editingAppointment}
                    onSave={handleUpdateAppointment}
                    clients={clients}
                    services={services}
                    professionals={professionals}
                />
            )}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={() => {
                    confirmation.onConfirm();
                    if(confirmation.singleButton) {
                        setConfirmation({ ...confirmation, isOpen: false });
                    }
                }}
                title={confirmation.title}
                message={confirmation.message}
                confirmButtonText={confirmation.confirmButtonText}
                confirmButtonColor={confirmation.confirmButtonColor}
                singleButton={confirmation.singleButton}
            />
        </>
    );
};

export default AgendaPage;