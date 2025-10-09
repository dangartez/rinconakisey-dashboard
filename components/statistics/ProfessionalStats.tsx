import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import StatCard from '../ui/StatCard';
import { CurrencyEuroIcon, CalendarDaysIcon, CheckIcon, TrashIcon } from '../icons/Icons';
import { Professional } from '../../types';

const ProfessionalStats: React.FC = () => {
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [selectedProId, setSelectedProId] = useState<string>('');
    const [timeRange, setTimeRange] = useState('30d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [statsData, setStatsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch professionals for the filter dropdown on component mount
    useEffect(() => {
        const fetchProfessionals = async () => {
            const { data, error } = await supabase.from('professionals').select('id, name:full_name').order('full_name');
            if (error) {
                console.error("Error fetching professionals", error);
            } else {
                setProfessionals(data as Professional[]);
                if (data && data.length > 0) {
                    setSelectedProId(data[0].id);
                }
            }
        };
        fetchProfessionals();
    }, []);

    // Set initial date range
    useEffect(() => {
        handleTimeRangeChange('30d');
    }, []);

    // Fetch stats when date range or professional selection changes
    useEffect(() => {
        const fetchStats = async () => {
            if (!startDate || !endDate || !selectedProId) return;
            
            setIsLoading(true);
            const { data, error } = await supabase.rpc('get_professional_stats', {
                p_professional_id: selectedProId,
                start_date: startDate,
                end_date: endDate
            });

            if (error) {
                console.error(`Error fetching stats for professional ${selectedProId}:`, error);
                setStatsData(null);
            } else {
                setStatsData(data);
            }
            setIsLoading(false);
        };

        fetchStats();
    }, [startDate, endDate, selectedProId]);

    const handleTimeRangeChange = (range: string) => {
        setTimeRange(range);
        const end = new Date();
        const start = new Date();
        if (range === '7d') start.setDate(end.getDate() - 7);
        else if (range === '30d') start.setDate(end.getDate() - 30);
        else if (range === '90d') start.setDate(end.getDate() - 90);
        
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
        setTimeRange('custom');
        if (type === 'start') {
            setStartDate(e.target.value);
        } else {
            setEndDate(e.target.value);
        }
    };

    const stats = useMemo(() => {
        if (!statsData) return { totalRevenue: 0, totalAppointments: 0, completedAppointments: 0, cancelledAppointments: 0 };
        return {
            totalRevenue: statsData.total_revenue,
            totalAppointments: statsData.total_appointments,
            completedAppointments: statsData.completed_appointments,
            cancelledAppointments: statsData.cancelled_appointments,
        };
    }, [statsData]);

    const appointmentsByDay = useMemo(() => {
        if (!statsData || !statsData.appointments_by_day) return [];
        return statsData.appointments_by_day.map((item: any) => [item.date, item.count]);
    }, [statsData]);

    const servicePerformance = useMemo(() => {
        if (!statsData || !statsData.service_performance) return [];
        return statsData.service_performance;
    }, [statsData]);

    const timeRangeOptions = [
        { id: '7d', label: 'Últimos 7 días' },
        { id: '30d', label: 'Últimos 30 días' },
        { id: '90d', label: 'Últimos 90 días' },
    ];
    
    const LineChart = ({ data }: { data: [string, number][] }) => {
        if (isLoading) {
            return <div className="h-64 flex items-center justify-center text-gray-400">Cargando datos...</div>;
        }
        if (!data || data.length < 2) {
            return <div className="h-64 flex items-center justify-center text-gray-500">No hay suficientes datos para mostrar el gráfico.</div>;
        }

        const width = 500;
        const height = 200;
        const padding = 20;
        const maxValue = Math.max(...data.map(d => d[1]), 1);

        const points = data.map(([, value], i) => {
            const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
            const y = (height - padding) - ((value / maxValue) * (height - 2 * padding));
            return `${x},${y}`;
        }).join(' ');
        
        const areaPoints = `${padding},${height-padding} ${points} ${width - padding},${height-padding}`;

        return (
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="areaGradientPro" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#areaGradientPro)" />
                <polyline fill="none" stroke="#6366f1" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
                 {data.map(([date, value], i) => {
                    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
                    const y = (height - padding) - ((value / maxValue) * (height - 2 * padding));
                    return (
                        <g key={date} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="8" fill="transparent" />
                            <circle cx={x} cy={y} r="3" fill="#6366f1" className="transition-transform duration-200 group-hover:scale-150" />
                             <g transform={`translate(${x}, ${y - 15})`} className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <rect x="-45" y="-20" width="90" height="25" fill="#1f2937" rx="5" />
                                <text x="0" y="-2" fill="white" textAnchor="middle" fontSize="10">{`${new Date(date + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}: ${value} citas`}</text>
                                <path d="M-5,-1 L0,0 L5,-1" fill="#1f2937" transform={`translate(0, 4)`} />
                            </g>
                        </g>
                    )
                })}
            </svg>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-wrap gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg">
                 <div className="flex items-center gap-2 bg-gray-200 p-1 rounded-lg">
                    {timeRangeOptions.map(opt => (
                        <button key={opt.id} onClick={() => handleTimeRangeChange(opt.id)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${timeRange === opt.id ? 'bg-white shadow-sm text-gray-800' : 'text-gray-600 hover:text-gray-800'}`}>
                            {opt.label}
                        </button>
                    ))}
                </div>
                 <div className="flex items-center gap-4 flex-wrap">
                    <input type="date" value={startDate} onChange={e => handleDateInputChange(e, 'start')} className="bg-white p-2 border border-gray-300 rounded-lg text-sm" />
                    <span className="text-gray-500">-</span>
                    <input type="date" value={endDate} onChange={e => handleDateInputChange(e, 'end')} className="bg-white p-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                 <div className="w-full sm:w-64">
                    <select value={selectedProId} onChange={e => setSelectedProId(e.target.value)} className="w-full bg-white p-2.5 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-sm">
                        {professionals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ingresos Generados" value={isLoading ? '...' : `${stats.totalRevenue.toLocaleString('es-ES')}€`} icon={<CurrencyEuroIcon className="h-8 w-8 text-pink-500"/>} />
                <StatCard title="Total Citas" value={isLoading ? '...' : stats.totalAppointments.toString()} icon={<CalendarDaysIcon className="h-8 w-8 text-pink-500"/>} />
                <StatCard title="Citas Completadas" value={isLoading ? '...' : stats.completedAppointments.toString()} icon={<CheckIcon className="h-8 w-8 text-pink-500"/>} />
                <StatCard title="Citas Canceladas" value={isLoading ? '...' : stats.cancelledAppointments.toString()} icon={<TrashIcon className="h-8 w-8 text-pink-500"/>} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Evolución de Citas</h3>
                    <div className="h-64">
                        <LineChart data={appointmentsByDay} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Rendimiento por Servicio</h3>
                    <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                         {isLoading ? (
                            <div className="text-center p-8 text-gray-400">Cargando...</div>
                         ) : servicePerformance && servicePerformance.length > 0 ? servicePerformance.map((s: any) => {
                            const maxRevenue = Math.max(...servicePerformance.map((sp: any) => sp.revenue), 1);
                            const width = (s.revenue / maxRevenue) * 100;
                            return (
                                <div key={s.name} className="flex items-center gap-4 text-sm">
                                    <span className="w-40 truncate font-medium text-gray-700">{s.name}</span>
                                    <div className="flex-1 bg-gray-200 rounded-full h-5">
                                        <div style={{ width: `${width}%` }} className="bg-indigo-500 h-5 rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold transition-all duration-500">
                                            {s.revenue > 0 ? `${s.revenue.toLocaleString('es-ES')}€` : ''}
                                        </div>
                                    </div>
                                    <span className="w-20 text-right text-gray-500">{s.count} citas</span>
                                </div>
                            )
                        }) : (
                            <p className="text-center text-gray-500 py-8">No hay datos de rendimiento para esta profesional en el periodo seleccionado.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessionalStats;