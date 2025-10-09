
import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { UserPlusIcon, CalendarDaysIcon, ServicesIcon, SummaryIcon, StarIcon } from '../icons/Icons'; // Assuming StarIcon exists

// --- TYPES ---
interface ClientNote {
  id: string;
  note: string;
  created_at: string;
  professional_name: string;
}

interface SaleItem {
  id: number;
  service_name: string;
  professional_name: string;
  price: number;
  notes: string;
}

interface Sale {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  notes: string;
  items: {
    favorites: SaleItem[];
    normal: SaleItem[];
  };
}

interface HistoryData {
  notes: {
    favorites: ClientNote[];
    normal: ClientNote[];
  };
  sales: Sale[];
}

type ActiveTab = 'resumen' | 'notas' | 'compras';

// --- SUB-COMPONENTS ---
const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex items-center">
        <div className="p-3 bg-pink-100 rounded-full mr-4">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const TabButton: React.FC<{ label: string; tabId: ActiveTab; activeTab: ActiveTab; onClick: (tabId: ActiveTab) => void; }> = ({ label, tabId, activeTab, onClick }) => (
    <button 
        onClick={() => onClick(tabId)}
        className={`px-4 py-2 font-semibold text-sm rounded-t-lg border-b-2 transition-colors ${activeTab === tabId ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-pink-600'}`}>
        {label}
    </button>
);

// --- MAIN MODAL COMPONENT ---
interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ isOpen, onClose, client }) => {
    const [historyData, setHistoryData] = useState<HistoryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');

    useEffect(() => {
        if (isOpen && client) {
            const fetchHistory = async () => {
                setIsLoading(true);
                setError(null);
                setHistoryData(null);

                const { data, error } = await supabase.rpc('get_client_full_history', { p_client_id: client.id });

                if (error) {
                    console.error("Error fetching client history:", error);
                    setError("No se pudo cargar el historial del cliente.");
                } else {
                    setHistoryData(data);
                }
                setIsLoading(false);
            };
            fetchHistory();
        } else {
            // Reset state on close
            setTimeout(() => {
                setHistoryData(null);
                setActiveTab('resumen');
            }, 200)
        }
    }, [isOpen, client]);

    const stats = useMemo(() => {
        if (!historyData) return { totalVisits: 0, uniqueServices: 0, favoriteService: 'N/A' };

        const allItems = historyData.sales.flatMap(s => [...s.items.favorites, ...s.items.normal]);
        const servicesCount = new Map<string, number>();
        allItems.forEach(item => {
            servicesCount.set(item.service_name, (servicesCount.get(item.service_name) || 0) + 1);
        });

        let favoriteService = 'N/A';
        if (servicesCount.size > 0) {
            favoriteService = [...servicesCount.entries()].reduce((a, e) => e[1] > a[1] ? e : a)[0];
        }

        return {
            totalVisits: historyData.sales.length,
            uniqueServices: servicesCount.size,
            favoriteService
        };
    }, [historyData]);

    const renderContent = () => {
        if (isLoading) return <div className="text-center p-16">Cargando historial...</div>;
        if (error) return <div className="text-center p-16 text-red-500">{error}</div>;
        if (!historyData) return null;

        switch (activeTab) {
            case 'resumen':
                return (
                    <div className="p-8">
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard title="Visitas Realizadas" value={stats.totalVisits} icon={<UserPlusIcon className="h-6 w-6 text-pink-600"/>} />
                            <StatCard title="Servicios Probados" value={stats.uniqueServices} icon={<ServicesIcon className="h-6 w-6 text-pink-600"/>} />
                            <StatCard title="Servicio Favorito" value={stats.favoriteService} icon={<SummaryIcon className="h-6 w-6 text-pink-600"/>} />
                        </div>
                    </div>
                );
            case 'notas':
                return (
                    <div className="p-8 space-y-6">
                        <NoteSection title="Notas Favoritas" notes={historyData.notes.favorites} />
                        <NoteSection title="Otras Notas" notes={historyData.notes.normal} />
                    </div>
                );
            case 'compras':
                return (
                    <div className="p-8 space-y-6">
                        {historyData.sales.map(sale => <SaleCard key={sale.id} sale={sale} />)}
                        {historyData.sales.length === 0 && <p className="text-center text-gray-500 py-8">No hay compras registradas.</p>}
                    </div>
                );
            default: return null;
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-8 border-b">
                    <h2 className="text-3xl font-bold text-gray-900">Historial de {client.name}</h2>
                    <p className="text-gray-500">Registrado desde el {new Date(client.registrationDate).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="border-b border-gray-200">
                    <div className="px-8 flex items-center">
                        <TabButton label="Resumen" tabId="resumen" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Notas" tabId="notas" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Compras" tabId="compras" activeTab={activeTab} onClick={setActiveTab} />
                    </div>
                </div>
                <div className="overflow-y-auto flex-1 bg-gray-50/70">
                    {renderContent()}
                </div>
                <div className="bg-gray-100 px-8 py-4 rounded-b-2xl flex justify-end items-center border-t">
                    <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- RENDER HELPER COMPONENTS ---

const NoteSection: React.FC<{title: string, notes: ClientNote[]}> = ({ title, notes }) => {
    if (!notes || notes.length === 0) return null;
    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
            <div className="space-y-3">
                {notes.map(note => (
                    <div key={note.id} className="bg-white p-4 rounded-lg border">
                        <p className="text-gray-700">{note.note}</p>
                        <p className="text-xs text-gray-400 mt-2">Por {note.professional_name} - {new Date(note.created_at).toLocaleString('es-ES')}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

const SaleCard: React.FC<{sale: Sale}> = ({ sale }) => {
    return (
        <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
                <div>
                    <p className="font-bold">Venta del {new Date(sale.created_at).toLocaleDateString('es-ES')}</p>
                    <p className="text-sm text-gray-500">Pagado con {sale.payment_method}</p>
                </div>
                <p className="font-bold text-xl">{sale.total_amount.toLocaleString('es-ES')}€</p>
            </div>
            <div className="p-4 space-y-3">
                <SaleItemsSection title="Artículos Favoritos" items={sale.items.favorites} />
                <SaleItemsSection title="Otros Artículos" items={sale.items.normal} />
                {sale.notes && (
                    <div className="pt-2">
                        <p className="text-sm font-semibold">Notas de la venta:</p>
                        <p className="text-sm text-gray-600">{sale.notes}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

const SaleItemsSection: React.FC<{title: string, items: SaleItem[]}> = ({ title, items }) => {
    if (!items || items.length === 0) return null;
    return (
        <div>
            <h4 className="text-sm font-semibold text-gray-600 mb-2">{title}</h4>
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item.id} className="p-2 bg-gray-50 rounded-md flex justify-between">
                        <div>
                            <p className="font-medium text-sm">{item.service_name}</p>
                            <p className="text-xs text-gray-500">con {item.professional_name}</p>
                            {item.notes && <p className="text-xs text-blue-500 italic">Nota: {item.notes}</p>}
                        </div>
                        <p className="font-medium text-sm">{item.price.toLocaleString('es-ES')}€</p>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default ClientHistoryModal;
