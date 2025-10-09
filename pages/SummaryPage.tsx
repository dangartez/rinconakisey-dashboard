import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import { CalendarDaysIcon, CurrencyEuroIcon, UserPlusIcon, PromotionsIcon } from '../components/icons/Icons';
import ProfessionalBadge from '../components/ui/ProfessionalBadge';
import { supabase } from '../lib/supabaseClient';

const SummaryPage: React.FC = () => {
    const [summaryData, setSummaryData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const today = new Date();
    const formattedDate = new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(today);

    useEffect(() => {
        const fetchSummaryData = async () => {
            setIsLoading(true);
            const { data, error } = await supabase.rpc('get_summary_data');
            if (error) {
                console.error("Error fetching summary data", error);
                setSummaryData(null);
            } else {
                setSummaryData(data);
            }
            setIsLoading(false);
        };
        fetchSummaryData();
    }, []);

    const StatSkeleton = () => (
        <div className="bg-gray-200 h-28 rounded-xl animate-pulse"></div>
    );

    return (
        <div className="space-y-8">
            <PageHeader 
                title="Resumen del Día" 
                subtitle={formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)} 
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {isLoading ? (
                    <><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
                ) : (
                    <>
                        <StatCard title="Total Citas Hoy" value={summaryData?.total_appointments_today?.toString() || '0'} icon={<CalendarDaysIcon className="h-8 w-8" />} />
                        <StatCard title="Ingresos Estimados" value={`${summaryData?.estimated_income_today?.toLocaleString('es-ES') || '0'}€`} icon={<CurrencyEuroIcon className="h-8 w-8" />} />
                        <StatCard title="Clientes Registrados Ayer" value={summaryData?.clients_registered_yesterday?.toString() || '0'} icon={<UserPlusIcon className="h-8 w-8" />} />
                    </>
                )}
            </div>

            {/* First-time clients section */}
            {!isLoading && summaryData?.first_time_clients_today?.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                        <PromotionsIcon className="h-6 w-6 text-yellow-500 mr-2" />
                        Clientes de Primera Visita Hoy
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-gray-100">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Hora</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Cliente</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Servicio</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Profesional</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summaryData.first_time_clients_today.map((app: any, index: number) => (
                                    <tr key={index} className="border-b border-gray-100 last:border-b-0 bg-yellow-50/50">
                                        <td className="p-4 text-gray-600 whitespace-nowrap font-medium">{app.start_time}</td>
                                        <td className="p-4 text-gray-800 font-bold">{app.client_name}</td>
                                        <td className="p-4 text-gray-600">{app.service_name}</td>
                                        <td className="p-4 text-gray-600">{app.professional_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Agenda de Hoy</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b-2 border-gray-100">
                            <tr>
                                <th className="p-4 text-sm font-semibold text-gray-500">Hora</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Cliente</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Servicio</th>
                                <th className="p-4 text-sm font-semibold text-gray-500">Profesional</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-400">Cargando agenda...</td></tr>
                            ) : summaryData?.todays_appointments?.length > 0 ? (
                                summaryData.todays_appointments.map((app: any, index: number) => (
                                    <tr key={index} className="border-b border-gray-100 last:border-b-0">
                                        <td className="p-4 text-gray-600 whitespace-nowrap">{app.start_time} - {app.end_time}</td>
                                        <td className="p-4 text-gray-800 font-medium">{app.client_name}</td>
                                        <td className="p-4 text-gray-600">{app.service_name}</td>
                                        <td className="p-4">
                                            <ProfessionalBadge professional={app.professional} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={4} className="text-center p-8 text-gray-500">No hay citas para hoy.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SummaryPage;