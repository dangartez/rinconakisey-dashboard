import React, { useState, useEffect, useMemo } from 'react';
import { Client } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { UserPlusIcon, CalendarDaysIcon, ServicesIcon, SummaryIcon, StarIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import ServiceNotesView from './ServiceNotesView';
import EditServiceNoteModal from './EditServiceNoteModal';
import DebtView from './DebtView'; // Importar el nuevo componente
import BonoView from './BonoView'; // Importar el nuevo componente

// --- TYPES ---
interface ClientNote {
  id: string;
  note: string;
  created_at: string;
  professional_name: string;
  is_favorite: boolean;
}

interface SaleItem {
  id: number; // This is sale_item_id
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
  payments: { method: string; amount: number }[];
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

type ActiveTab = 'resumen' | 'notas' | 'notas_servicios' | 'compras' | 'historial' | 'deudas' | 'bonos';


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

import ConfirmationModal from '../ui/ConfirmationModal';
import EditNoteModal from './EditNoteModal';

// --- MAIN MODAL COMPONENT ---
interface ClientHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onDataChange: () => void; // Prop para refrescar datos
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({ isOpen, onClose, client, onDataChange }) => {
    const [historyData, setHistoryData] = useState<HistoryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');
    const [historySearchTerm, setHistorySearchTerm] = useState('');

    // State for note actions
    const [noteToEdit, setNoteToEdit] = useState<ClientNote | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // State for service note actions
    const [serviceNoteToEdit, setServiceNoteToEdit] = useState<{id: number, note: string} | null>(null);
    const [isEditServiceNoteModalOpen, setIsEditServiceNoteModalOpen] = useState(false);

    const serviceHistory = useMemo(() => {
        if (!historyData) return [];
        const allItems = historyData.sales.flatMap(sale => 
            [...sale.items.favorites, ...sale.items.normal].map(item => ({
                ...item,
                sale_item_id: item.id, // Preserve original sale_item.id
                date: sale.created_at,
                composite_id: `${sale.id}-${item.id}` // Use a different name for the React key
            }))
        );
        return allItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [historyData]);

    const filteredServiceHistory = useMemo(() => {
        if (!historySearchTerm) return serviceHistory;
        const lowercasedTerm = historySearchTerm.toLowerCase();
        return serviceHistory.filter(item => 
            item.service_name.toLowerCase().includes(lowercasedTerm) ||
            item.professional_name.toLowerCase().includes(lowercasedTerm) ||
            new Date(item.date).toLocaleDateString('es-ES').includes(lowercasedTerm)
        );
    }, [serviceHistory, historySearchTerm]);

    useEffect(() => {
        if (isOpen && client) {
            fetchHistory();
        } else {
            // Reset state on close
            setTimeout(() => {
                setHistoryData(null);
                setActiveTab('resumen');
            }, 200)
        }
    }, [isOpen, client]);

    const fetchHistory = async () => {
        if (!client) return;
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase.rpc('get_client_full_history_v2', { p_client_id: client.id });
        if (error) {
            console.error("Error fetching client history:", error);
            setError("No se pudo cargar el historial del cliente.");
        }
        else {
            setHistoryData(data);
        }
        setIsLoading(false);
    };

    const handleToggleFavorite = async (noteId: string, isCurrentlyFavorite: boolean) => {
        if (!historyData) return;

        const originalData = { ...historyData };
        let noteToMove: ClientNote | undefined;

        if (isCurrentlyFavorite) {
            noteToMove = historyData.notes.favorites.find(n => n.id === noteId);
            if (noteToMove) {
                setHistoryData({
                    ...historyData,
                    notes: {
                        favorites: historyData.notes.favorites.filter(n => n.id !== noteId),
                        normal: [noteToMove, ...historyData.notes.normal],
                    },
                });
            }
        } else {
            noteToMove = historyData.notes.normal.find(n => n.id === noteId);
            if (noteToMove) {
                setHistoryData({
                    ...historyData,
                    notes: {
                        favorites: [noteToMove, ...historyData.notes.favorites],
                        normal: historyData.notes.normal.filter(n => n.id !== noteId),
                    },
                });
            }
        }

        const { error } = await supabase
            .from('client_notes')
            .update({ is_favorite: !isCurrentlyFavorite })
            .eq('id', noteId);

        if (error) {
            console.error('Error updating favorite status:', error);
            alert('No se pudo actualizar la nota. Inténtalo de nuevo.');
            setHistoryData(originalData);
        }
    };

    const handleDelete = (noteId: string) => {
        setNoteToDelete(noteId);
        setIsConfirmDeleteOpen(true);
    };

    const confirmDelete = async () => {
        if (!noteToDelete || !historyData) return;

        const originalData = { ...historyData };

        setHistoryData({
            ...historyData,
            notes: {
                favorites: historyData.notes.favorites.filter(n => n.id !== noteToDelete),
                normal: historyData.notes.normal.filter(n => n.id !== noteToDelete),
            },
        });
        setIsConfirmDeleteOpen(false);

        const { error } = await supabase
            .from('client_notes')
            .delete()
            .eq('id', noteToDelete);

        if (error) {
            console.error('Error deleting note:', error);
            alert('No se pudo borrar la nota. Inténtalo de nuevo.');
            setHistoryData(originalData);
        }

        setNoteToDelete(null);
    };

    const handleEdit = (note: ClientNote) => {
        setNoteToEdit(note);
        setIsEditModalOpen(true);
    };

    const handleEditServiceNote = (item: any) => {
        setServiceNoteToEdit({ id: item.sale_item_id, note: item.notes || '' });
        setIsEditServiceNoteModalOpen(true);
    };

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
        if (isLoading && activeTab !== 'notas_servicios') return <div className="text-center p-16">Cargando historial...</div>;
        if (error) return <div className="text-center p-16 text-red-500">{error}</div>;
        if (!historyData && activeTab !== 'notas_servicios') return null;

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
                        <NoteSection 
                            title="Notas Favoritas" 
                            notes={historyData.notes.favorites} 
                            isFavoritesSection={true}
                            onToggleFavorite={handleToggleFavorite}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                        <NoteSection 
                            title="Otras Notas" 
                            notes={historyData.notes.normal} 
                            onToggleFavorite={handleToggleFavorite}
                            onDelete={handleDelete}
                            onEdit={handleEdit}
                        />
                    </div>
                );
            case 'notas_servicios':
                return <ServiceNotesView clientId={client!.id} />;
            case 'compras':
                return (
                    <div className="p-8 space-y-6">
                        {historyData.sales.map(sale => <SaleCard key={sale.id} sale={sale} />)}
                        {historyData.sales.length === 0 && <p className="text-center text-gray-500 py-8">No hay compras registradas.</p>}
                    </div>
                );
            case 'deudas':
                return <DebtView clientId={client!.id} onDebtUpdate={onDataChange} />;
            case 'bonos':
                return <BonoView clientId={client!.id} />;
            case 'historial':
                return (
                    <div className="p-8">
                        <div className="mb-4">
                            <input 
                                type="text"
                                placeholder="Buscar por servicio, profesional o fecha..."
                                value={historySearchTerm}
                                onChange={(e) => setHistorySearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                            />
                        </div>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            {filteredServiceHistory.length > 0 ? (
                                filteredServiceHistory.map(item => (
                                    <div key={item.composite_id} className="bg-white p-4 rounded-lg border flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-gray-800">{item.service_name}</p>
                                            <p className="text-sm text-gray-500">con {item.professional_name}</p>
                                            {item.notes && <p className="text-xs text-blue-600 italic mt-1">Nota: {item.notes}</p>}
                                        </div>
                                        <div className="flex items-center flex-shrink-0 ml-4">
                                            <p className="text-sm font-medium text-gray-600 mr-4">{new Date(item.date).toLocaleDateString('es-ES')}</p>
                                            <button onClick={() => handleEditServiceNote(item)} className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-100 transition-colors">
                                                <PencilIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    {serviceHistory.length === 0 ? "No hay historial de servicios." : "No se encontraron resultados para tu búsqueda."}
                                </p>
                            )}
                        </div>
                    </div>
                )
            default: return null;
        }
    };

    if (!isOpen || !client) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="p-8 border-b">
                    <h2 className="text-3xl font-bold text-gray-900">Ficha de {client.name}</h2>
                    <p className="text-gray-500">Registrado desde el {new Date(client.registrationDate).toLocaleDateString('es-ES')}</p>
                </div>
                <div className="border-b border-gray-200">
                    <div className="px-8 flex items-center">
                        <TabButton label="Resumen" tabId="resumen" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Notas Cliente" tabId="notas" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Notas Servicios" tabId="notas_servicios" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Compras" tabId="compras" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Deudas" tabId="deudas" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Bonos" tabId="bonos" activeTab={activeTab} onClick={setActiveTab} />
                        <TabButton label="Historial" tabId="historial" activeTab={activeTab} onClick={setActiveTab} />
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

            <ConfirmationModal 
                isOpen={isConfirmDeleteOpen}
                onClose={() => setIsConfirmDeleteOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Borrado"
                message="¿Estás seguro de que quieres borrar esta nota? Esta acción no se puede deshacer."
            />

            <EditNoteModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                note={noteToEdit}
                onNoteUpdated={() => {
                    fetchHistory();
                }}
            />

            <EditServiceNoteModal 
                isOpen={isEditServiceNoteModalOpen}
                onClose={() => setIsEditServiceNoteModalOpen(false)}
                note={serviceNoteToEdit}
                onNoteUpdated={() => {
                    setIsEditServiceNoteModalOpen(false);
                    fetchHistory();
                }}
            />
        </div>
    );
};

// --- RENDER HELPER COMPONENTS ---

interface NoteSectionProps {
  title: string;
  notes: ClientNote[];
  isFavoritesSection?: boolean;
  onToggleFavorite: (noteId: string, isFavorite: boolean) => void;
  onDelete: (noteId: string) => void;
  onEdit: (note: ClientNote) => void;
}

const NoteSection: React.FC<NoteSectionProps> = ({ title, notes, isFavoritesSection = false, onToggleFavorite, onDelete, onEdit }) => {
    if (!notes || notes.length === 0) return null;
    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
            <div className="space-y-3">
                {notes.map(note => (
                    <div key={note.id} className={`p-4 rounded-lg border flex justify-between items-start ${isFavoritesSection ? 'bg-pink-50 border-pink-200' : 'bg-white'}`}>
                        <div>
                            <p className="text-gray-700 pr-4">{note.note}</p>
                            <p className="text-xs text-gray-400 mt-2">Por {note.professional_name} - {new Date(note.created_at).toLocaleString('es-ES')}</p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <button onClick={() => onEdit(note)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onDelete(note.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onToggleFavorite(note.id, isFavoritesSection)} className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
                                <StarIcon className={`h-5 w-5 ${isFavoritesSection ? 'text-yellow-400' : ''}`} />
                            </button>
                        </div>
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
                    {sale.payment_method === 'multiple' ? (
                        <div className="text-sm text-gray-500">
                            Pagado con: {sale.payments.map(p => `${p.method} (${p.amount.toLocaleString('es-ES')}€)`).join(', ')}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Pagado con {sale.payment_method}</p>
                    )}
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