import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import StatCard from '../ui/StatCard';
import { CurrencyEuroIcon, CalendarDaysIcon, CheckIcon, TrashIcon } from '../icons/Icons';
import { Service } from '../../types';

const GeneralStats: React.FC = () => {
    const [timeRange, setTimeRange] = useState('30d');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState<number | 'all'>('all');
    
    const [services, setServices] = useState<Service[]>([]);
    const [statsData, setStatsData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch services for the filter dropdown on component mount
    useEffect(() => {
        const fetchServices = async () => {
            const { data, error } = await supabase.from('services').select('id, name').order('name');
            if (error) console.error("Error fetching services", error);
            else setServices(data as Service[]);
        };
        fetchServices();
    }, []);

    // Set initial date range
    useEffect(() => {
        handleTimeRangeChange('30d');
    }, []);

    // Fetch stats when date range or service filter changes
    useEffect(() => {
        const fetchStats = async () => {
            if (!startDate || !endDate) return;
            
            setIsLoading(true);
            const { data, error } = await supabase.rpc('get_general_stats', {
                start_date: startDate,
                end_date: endDate,
                p_service_id: selectedServiceId === 'all' ? null : selectedServiceId
            });

            if (error) {
                console.error('Error fetching general stats:', error);
                setStatsData(null);
            } else {
                setStatsData(data);
            }
            setIsLoading(false);
        };

        fetchStats();
    }, [startDate, endDate, selectedServiceId]);

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
        setTimeRange('custom'); // Deactivate preset buttons
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
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f472b6" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity="0" />
                    </linearGradient>
                </defs>
                <polygon points={areaPoints} fill="url(#areaGradient)" />
                <polyline fill="none" stroke="#ec4899" strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
                {data.map(([date, value], i) => {
                    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
                    const y = (height - padding) - ((value / maxValue) * (height - 2 * padding));
                    return (
                        <g key={date} className="group cursor-pointer">
                            <circle cx={x} cy={y} r="8" fill="transparent" />
                            <circle cx={x} cy={y} r="3" fill="#ec4899" className="transition-transform duration-200 group-hover:scale-150" />
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
                    <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value === 'all' ? 'all' : Number(e.target.value))} className="w-full bg-white p-2.5 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 text-sm">
                        <option value="all">Todos los servicios</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ingresos Totales" value={isLoading ? '...' : `${stats.totalRevenue.toLocaleString('es-ES')}€`} icon={<CurrencyEuroIcon className="h-8 w-8 text-pink-500"/>} />
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
                    <h3 className="text-xl font-bold text-gray-800 mb-4">Ranking de Servicios</h3>
                    <div className="overflow-x-auto max-h-72">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white">
                                <tr className="border-b-2 border-gray-100">
                                    <th className="p-3 text-sm font-semibold text-gray-500">Servicio</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-center">Nº Citas</th>
                                    <th className="p-3 text-sm font-semibold text-gray-500 text-right">Ingresos</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={3} className="text-center p-8 text-gray-400">Cargando...</td></tr>
                                ) : servicePerformance && servicePerformance.length > 0 ? servicePerformance.map((s: any, index: number) => (
                                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                                        <td className="p-3 font-medium text-gray-800">{s.name}</td>
                                        <td className="p-3 text-gray-600 text-center">{s.count}</td>
                                        <td className="p-3 text-gray-600 text-right font-semibold">{s.revenue.toLocaleString('es-ES')}€</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center p-8 text-gray-500">No hay datos para este periodo.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralStats;