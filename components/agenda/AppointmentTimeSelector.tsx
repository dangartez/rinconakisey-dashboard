import React, { useMemo, useState } from 'react';
import { Service, Professional, Appointment } from '../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/Icons';
import AvailableSlotsModal from './AvailableSlotsModal';

export interface ComputedSlot {
  time: string;
  isAvailable: boolean;
  professionalId: string;
}

// This component is now a "dumb" component. It receives all state and handlers as props.
interface AppointmentTimeSelectorProps {
  services: Service[];
  professional: Professional | null;
  appointmentToEdit?: Appointment | null;
  onDateTimeSelected: (date: Date, time: string, professionalId: string) => void;
  allProfessionals: Professional[];
  onProfessionalSelected?: (professional: Professional) => void;

  // State values from parent
  dateTimeView: 'calendar' | 'byHour';
  selectedDate: Date;
  weekOffset: number;
  isLoadingSlots: boolean;
  computedSlots: ComputedSlot[];
  workSchedule: { start_time: string; end_time: string; is_working: boolean } | null;
  isSlotsModalOpen: boolean;
  groupedRangeSlots: { [key: string]: { time: string; professional_id: string }[] };
  isLoadingRange: boolean;
  filterStartTime: string;
  filterEndTime: string;

  // State setters from parent
  setDateTimeView: (view: 'calendar' | 'byHour') => void;
  setSelectedDate: (date: Date) => void;
  setWeekOffset: (offset: number) => void;
  setIsSlotsModalOpen: (isOpen: boolean) => void;
  setFilterStartTime: (time: string) => void;
  setFilterEndTime: (time: string) => void;
  
  // Logic handlers from parent (or to be created in parent)
  handleSearchByHour: () => void;
}

const AppointmentTimeSelector: React.FC<AppointmentTimeSelectorProps> = (props) => {
  const {
    professional, appointmentToEdit, onDateTimeSelected, allProfessionals, onProfessionalSelected,
    dateTimeView, setDateTimeView, selectedDate, setSelectedDate, weekOffset, setWeekOffset,
    isLoadingSlots, computedSlots, workSchedule, isSlotsModalOpen, setIsSlotsModalOpen,
    groupedRangeSlots, isLoadingRange, filterStartTime, setFilterStartTime, filterEndTime, setFilterEndTime,
    handleSearchByHour
  } = props;

  const isEditMode = !!appointmentToEdit;
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const handleSelectDateTime = (date: Date, time: string, professionalId: string) => {
    if (!professional && onProfessionalSelected) {
      const assignedProfessional = allProfessionals.find(p => p.id === professionalId);
      if (assignedProfessional) {
        onProfessionalSelected(assignedProfessional);
      }
    }
    setSelectedTimeSlot(time); // Mark this time slot as selected
    onDateTimeSelected(date, time, professionalId);
  };

  // --- Memos for UI calculation ---
  const weekDays = useMemo(() => {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1 + (weekOffset * 7));
    return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        return date;
    });
  }, [weekOffset]);

  const timeOptions = useMemo(() => {
    const options = [];
    for (let i = 8; i < 22; i++) {
        options.push(`${i.toString().padStart(2, '0')}:00`);
        options.push(`${i.toString().padStart(2, '0')}:30`);
    }
    return options;
  }, []);

  const today = useMemo(() => {
      const d = new Date();
      d.setHours(0,0,0,0);
      return d;
  }, []);

  return (
    <div className="border-t pt-5">
        <div className="flex justify-center border-b border-gray-200 mb-4">
            <button type="button" onClick={() => setDateTimeView('calendar')} className={`py-2 px-4 font-semibold text-sm transition-colors ${dateTimeView === 'calendar' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                Buscar por Días
            </button>
            <button type="button" onClick={() => setDateTimeView('byHour')} className={`py-2 px-4 font-semibold text-sm transition-colors ${dateTimeView === 'byHour' ? 'border-b-2 border-pink-500 text-pink-600' : 'text-gray-500 hover:text-pink-600'}`}>
                Buscar por Horas
            </button>
        </div>

        {dateTimeView === 'calendar' && (
            <>
                <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50" disabled={weekOffset === 0}><ChevronLeftIcon className="w-5 h-5" /></button>
                    <span className="font-semibold text-gray-700">
                        {weekDays[0].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                    </span>
                    <button type="button" onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-full hover:bg-gray-100"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="grid grid-cols-7 gap-2 mb-6">
                    {weekDays.map(day => {
                        const isPast = day < today;
                        return (
                            <button 
                                key={day.toISOString()} 
                                type="button"
                                onClick={() => !isPast && setSelectedDate(day)}
                                disabled={isPast}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition ${
                                    selectedDate.toDateString() === day.toDateString() 
                                        ? 'bg-pink-600 text-white shadow-md' 
                                        : isPast 
                                            ? 'text-gray-300 cursor-not-allowed' 
                                            : 'hover:bg-gray-100'
                                }`}>
                                <span className="text-xs uppercase">{day.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                                <span className="block font-bold text-lg">{day.getDate()}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="max-h-60 overflow-y-auto pr-2">
                    {isLoadingSlots ? (
                        <div className="text-center p-8">Buscando huecos...</div>
                    ) : !workSchedule || !workSchedule.is_working ? (
                        <div className="text-center p-8 text-gray-500">No hay citas disponibles para este día.</div>
                    ) : (
                        <div className="grid grid-cols-4 gap-2">
                            {computedSlots.map(slot => {
                                const now = new Date();
                                const [hour, minute] = slot.time.split(':').map(Number);
                                const isPast = selectedDate.toDateString() === now.toDateString() && 
                                                (hour < now.getHours() || (hour === now.getHours() && minute < now.getMinutes()));
                                
                                const isDisabled = isPast || !slot.isAvailable;

                                return (
                                    <button
                                        key={slot.time}
                                        type="button"
                                        onClick={() => !isDisabled && handleSelectDateTime(selectedDate, slot.time, slot.professionalId)}
                                        disabled={isDisabled}
                                        className={`px-3 py-2 text-sm rounded-lg font-semibold transition-colors ${!isDisabled ? (selectedTimeSlot === slot.time ? 'bg-pink-300 bg-opacity-70 text-pink-800' : 'bg-pink-600 text-white hover:bg-pink-700') : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                        {slot.time}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </>
        )}

        {dateTimeView === 'byHour' && (
            <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                <button
                    type="button"
                    onClick={handleSearchByHour}
                    className="w-full bg-pink-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-pink-700 transition-transform transform hover:scale-105"
                >
                    Buscar Horas Disponibles
                </button>
            </div>
        )}
        <AvailableSlotsModal 
            isOpen={isSlotsModalOpen}
            onClose={() => setIsSlotsModalOpen(false)}
            groupedSlots={groupedRangeSlots}
            handleSelectDateTime={handleSelectDateTime}
            isLoading={isLoadingRange}
        />
    </div>
  );
};

export default AppointmentTimeSelector;
