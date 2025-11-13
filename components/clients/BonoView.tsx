import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TicketIcon, ChevronDownIcon } from '../icons/Icons';

// --- TYPES ---
interface Bono {
    id: string;
    bono_name: string;
    total_sessions: number;
    remaining_sessions: number;
    purchase_date: string;
}

interface BonoUsage {
    service_name: string;
    professional_name: string;
    start_time: string;
}

interface BonoViewProps {
    clientId: string;
}

// --- SUB-COMPONENTS ---
const BonoUsageDetails: React.FC<{ bonoId: string }> = ({ bonoId }) => {
    const [usage, setUsage] = useState<BonoUsage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUsage = async () => {
            const { data, error } = await supabase.rpc('get_bono_usage_details', { p_client_bono_id: bonoId });
            if (error) {
                console.error("Error fetching bono usage:", error);
            } else {
                setUsage(data || []);
            }
            setIsLoading(false);
        };
        fetchUsage();
    }, [bonoId]);

    if (isLoading) return <div className="p-4 text-sm text-center">Cargando usos...</div>;
    if (usage.length === 0) return <div className="p-4 text-sm text-center text-gray-500">Este bono aún no ha sido utilizado.</div>;

    return (
        <div className="p-4 bg-white border-t">
            <h4 className="font-semibold mb-2 text-sm text-gray-600">Historial de Uso:</h4>
            <ul className="space-y-2">
                {usage.map((use, index) => (
                    <li key={index} className="flex justify-between items-center text-sm">
                        <div>
                            <p className="font-medium text-gray-700">{use.service_name}</p>
                            <p className="text-xs text-gray-500">con {use.professional_name}</p>
                        </div>
                        <p className="text-gray-600">{new Date(use.start_time).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};


// --- MAIN COMPONENT ---
const BonoView: React.FC<BonoViewProps> = ({ clientId }) => {
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedBonoId, setExpandedBonoId] = useState<string | null>(null);

    useEffect(() => {
        const fetchBonos = async () => {
            setIsLoading(true);
            setError(null);
            const { data, error } = await supabase.rpc('get_client_bonos_details', { p_client_id: clientId });
            if (error) {
                console.error("Error fetching client bonos:", error);
                setError("No se pudieron cargar los bonos del cliente.");
            } else {
                setBonos(data || []);
            }
            setIsLoading(false);
        };
        fetchBonos();
    }, [clientId]);

    const handleToggle = (bonoId: string) => {
        setExpandedBonoId(prevId => (prevId === bonoId ? null : bonoId));
    };

    if (isLoading) return <div className="text-center p-16">Cargando bonos...</div>;
    if (error) return <div className="text-center p-16 text-red-500">{error}</div>;

    return (
        <div className="p-8">
            {bonos.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Este cliente no tiene bonos.</p>
            ) : (
                <div className="space-y-4">
                    {bonos.map(bono => {
                        const isExpanded = expandedBonoId === bono.id;
                        const hasUsage = bono.total_sessions - bono.remaining_sessions > 0;
                        return (
                            <div key={bono.id} className={`rounded-lg border transition-shadow duration-300 ${isExpanded ? 'shadow-lg' : 'shadow-sm'} ${bono.remaining_sessions > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-100 border-gray-200 opacity-80'}`}>
                                <div 
                                    className={`p-4 flex justify-between items-center cursor-pointer ${hasUsage ? '' : 'cursor-not-allowed'}`}
                                    onClick={() => hasUsage && handleToggle(bono.id)}
                                >
                                    <div className="flex items-center">
                                        <div className={`p-3 rounded-full mr-4 ${bono.remaining_sessions > 0 ? 'bg-green-100' : 'bg-gray-200'}`}>
                                            <TicketIcon className={`h-6 w-6 ${bono.remaining_sessions > 0 ? 'text-green-600' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-800">{bono.bono_name}</p>
                                            <p className="text-sm text-gray-500">Comprado el {new Date(bono.purchase_date).toLocaleDateString('es-ES')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="text-right mr-4">
                                            <p className="text-lg font-bold text-gray-800">{bono.remaining_sessions} / {bono.total_sessions}</p>
                                            <p className="text-sm text-gray-500">Sesiones restantes</p>
                                        </div>
                                        {hasUsage && (
                                            <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        )}
                                    </div>
                                </div>
                                {isExpanded && hasUsage && <BonoUsageDetails bonoId={bono.id} />}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BonoView;
