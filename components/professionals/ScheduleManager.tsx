import React, { useState, useMemo } from 'react';
import { ScheduleEntry, ScheduleOverride, WeeklySchedule } from '../../types';
import { TrashIcon } from '../icons/Icons';
import { InfoTooltip } from '../ui/InfoTooltip';

interface ScheduleManagerProps {
  schedules: WeeklySchedule;
  overrides: ScheduleOverride[];
  onSchedulesChange: (newSchedules: WeeklySchedule) => void;
  onOverridesChange: (newOverrides: ScheduleOverride[]) => void;
}

const weekDays = [
  { id: 1, name: 'Lunes' },
  { id: 2, name: 'Martes' },
  { id: 3, name: 'Miércoles' },
  { id: 4, name: 'Jueves' },
  { id: 5, name: 'Viernes' },
  { id: 6, name: 'Sábado' },
  { id: 7, name: 'Domingo' },
];

// Helper para el bucle de fechas
function getDatesInRange(startDate: Date, endDate: Date): Date[] {
    const dates = [];
    let currentDate = new Date(startDate.toISOString().slice(0, 10));
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
}

export const ScheduleManager: React.FC<ScheduleManagerProps> = ({
  schedules,
  overrides = [],
  onSchedulesChange,
  onOverridesChange,
}) => {

  const handleTimeChange = (
    dayId: number,
    shiftIndex: number,
    field: 'start_time' | 'end_time',
    value: string
  ) => {
    const newSchedules = { ...schedules };
    const daySchedules = [...(newSchedules[dayId] || [])];

    // Ensure the shift exists
    while (daySchedules.length <= shiftIndex) {
      daySchedules.push({ start_time: '', end_time: '' });
    }

    daySchedules[shiftIndex] = { ...daySchedules[shiftIndex], [field]: value };

    // Filter out empty shifts
    const updatedDaySchedules = daySchedules.filter(
      (shift) => shift.start_time || shift.end_time
    );

    onSchedulesChange({ ...newSchedules, [dayId]: updatedDaySchedules });
  };

  // --- Nueva Lógica para Períodos de Excepción ---
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [periodType, setPeriodType] = useState<'rest' | 'special'>('rest');
  const [specialShifts, setSpecialShifts] = useState<ScheduleEntry[]>([{ start_time: '10:00', end_time: '15:00' }]);

  const handleAddPeriod = () => {
    if (!description || !startDate || !endDate) {
        alert('Por favor, completa la descripción y las fechas del período.');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) {
        alert('La fecha de inicio no puede ser posterior a la fecha de fin.');
        return;
    }

    const period_id = `period_${Date.now()}`;
    const datesInRange = getDatesInRange(start, end);
    const newDailyOverrides: ScheduleOverride[] = [];

    datesInRange.forEach(date => {
        const dateString = date.toISOString().slice(0, 10);
        if (periodType === 'rest') {
            newDailyOverrides.push({
                id: Date.now() + Math.random(),
                period_id,
                description,
                override_date: dateString,
                is_working: false,
                start_time: null,
                end_time: null,
            });
        } else {
            specialShifts.forEach(shift => {
                newDailyOverrides.push({
                    id: Date.now() + Math.random(),
                    period_id,
                    description,
                    override_date: dateString,
                    is_working: true,
                    start_time: shift.start_time,
                    end_time: shift.end_time,
                });
            });
        }
    });

    onOverridesChange([...overrides, ...newDailyOverrides]);

    // Reset form
    setDescription('');
    setStartDate('');
    setEndDate('');
    setPeriodType('rest');
    setSpecialShifts([{ start_time: '10:00', end_time: '15:00' }]);
  };

  const groupedOverrides = useMemo(() => {
    return overrides.reduce((acc, override) => {
        const key = override.period_id || `day-${override.id}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(override);
        return acc;
    }, {} as Record<string, ScheduleOverride[]>);
  }, [overrides]);

  const removePeriod = (periodId: string) => {
    onOverridesChange(overrides.filter(o => o.period_id !== periodId));
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* Weekly Schedule Section */}
      <div>
        <h4 className="text-base font-semibold text-gray-800 mb-4">Horario Semanal Fijo</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {weekDays.map((day) => (
          <div key={day.id} className="p-4 border rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-3">{day.name}</h4>
            <div className="space-y-3">
              {[0, 1].map((shiftIndex) => (
                <div key={shiftIndex} className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 w-14">
                    {shiftIndex === 0 ? 'Mañana:' : 'Tarde:'}
                  </span>
                  <input
                    type="time"
                    value={schedules[day.id]?.[shiftIndex]?.start_time || ''}
                    onChange={(e) =>
                      handleTimeChange(
                        day.id,
                        shiftIndex,
                        'start_time',
                        e.target.value
                      )
                    }
                    className="w-full bg-white px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="time"
                    value={schedules[day.id]?.[shiftIndex]?.end_time || ''}
                    onChange={(e) =>
                      handleTimeChange(
                        day.id,
                        shiftIndex,
                        'end_time',
                        e.target.value
                      )
                    }
                    className="w-full bg-white px-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-500 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* Overrides Section */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
            <h4 className="text-base font-semibold text-gray-800">Excepciones y Días Especiales</h4>
            <InfoTooltip info="Define períodos donde el horario semanal no aplica, como vacaciones o semanas con jornada intensiva." />
        </div>
        
        {/* Formulario para añadir período */}
        <div className="p-4 border border-gray-200 rounded-lg flex flex-col space-y-4 mb-6">
            <input type="text" placeholder="Descripción (ej: Vacaciones Verano)" value={description} onChange={e => setDescription(e.target.value)} className="w-full input-class" />
            <div className="flex items-center space-x-4">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full input-class" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full input-class" />
            </div>
            <div className="flex items-center space-x-4">
                <label><input type="radio" name="periodType" value="rest" checked={periodType === 'rest'} onChange={() => setPeriodType('rest')} /> Descanso</label>
                <label><input type="radio" name="periodType" value="special" checked={periodType === 'special'} onChange={() => setPeriodType('special')} /> Horario Especial</label>
            </div>
            {periodType === 'special' && (
                <div className="p-2 border-t">
                    {/* Mini gestor de turnos para el horario especial */}
                    <p className="text-sm font-medium mb-2">Definir turnos para este período:</p>
                    {/* Aquí iría una UI para añadir/quitar turnos a `specialShifts` */}
                    <p className="text-xs text-gray-500">Actualmente no soporta turnos partidos en períodos especiales.</p>
                </div>
            )}
            <button type="button" onClick={handleAddPeriod} className="self-end px-4 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">Añadir Período</button>
        </div>

        {/* Lista de períodos de excepción */}
        <div className="flex flex-col space-y-3">
          {Object.entries(groupedOverrides).map(([periodId, periodOverrides]) => {
            const first = periodOverrides[0];
            const last = periodOverrides[periodOverrides.length - 1];
            return (
                <div key={periodId} className="p-3 border border-gray-200 rounded-lg flex items-center justify-between">
                    <div>
                        <p className="font-semibold">{first.description}</p>
                        <p className="text-sm text-gray-600">
                            {new Date(first.override_date + 'T00:00:00').toLocaleDateString('es-ES')} - {new Date(last.override_date + 'T00:00:00').toLocaleDateString('es-ES')}
                        </p>
                    </div>
                    <p className={`text-sm font-bold ${first.is_working ? 'text-blue-600' : 'text-red-600'}`}>
                        {first.is_working ? 'HORARIO ESPECIAL' : 'DESCANSO'}
                    </p>
                    <button
                        type="button"
                        aria-label="Eliminar período"
                        onClick={() => removePeriod(periodId)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};