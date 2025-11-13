import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import CreateBonoModal from '../components/bonos/CreateBonoModal';
import EditBonoModal from '../components/bonos/EditBonoModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { EyeIcon, EyeSlashIcon } from '../components/icons/Icons';

// Tipos
interface BonoService {
  id: number;
  name: string;
}
interface Bono {
  id: number;
  name: string;
  type: 'five_plus_one' | 'special';
  price: number;
  total_sessions: number;
  is_active: boolean;
  services: BonoService[];
}
interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
}

const BonosPage: React.FC = () => {
    const [allBonos, setAllBonos] = useState<Bono[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showInactive, setShowInactive] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingBono, setEditingBono] = useState<Bono | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

    useEffect(() => {
        fetchBonos();
    }, []);

    const fetchBonos = async () => {
        setIsLoading(true);
        setError(null);
        // Siempre pedimos todos los bonos para poder filtrar en el frontend
        const { data, error } = await supabase.rpc('get_bono_definitions', { p_include_inactive: true });
        if (error) {
            console.error('Error fetching bonos:', error);
            setError('No se pudieron cargar los bonos.');
        } else {
            setAllBonos(data || []);
        }
        setIsLoading(false);
    };

    const handleToggleActive = (bono: Bono) => {
        setConfirmation({
            isOpen: true,
            title: bono.is_active ? 'Desactivar Bono' : 'Activar Bono',
            message: `¿Estás seguro de que quieres ${bono.is_active ? 'desactivar' : 'activar'} el bono "${bono.name}"?`,
            onConfirm: async () => {
                const { error } = await supabase.rpc('set_bono_active_status', { p_bono_id: bono.id, p_is_active: !bono.is_active });
                if (error) {
                    alert(`Error: ${error.message}`);
                } else {
                    fetchBonos(); // Refrescamos la lista completa
                }
                setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
        });
    };

    // Memoizamos la lista de bonos a mostrar según el filtro
    const displayedBonos = useMemo(() => {
        return allBonos.filter(bono => bono.is_active === !showInactive);
    }, [allBonos, showInactive]);

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Bonos</h1>
                        <p className="text-gray-500 mt-1">Crea y gestiona los paquetes de sesiones.</p>
                    </div>
                    <button onClick={() => setIsCreateModalOpen(true)} className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm">Crear Nuevo Bono</button>
                </div>

                <div className="bg-white p-8 rounded-xl shadow-sm">
                    <div className="mb-6 flex items-center">
                        <label className="flex items-center cursor-pointer">
                            <div className="relative">
                                <input type="checkbox" className="sr-only" checked={showInactive} onChange={() => setShowInactive(!showInactive)} />
                                <div className={`block w-10 h-6 rounded-full ${showInactive ? 'bg-pink-600' : 'bg-gray-300'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${showInactive ? 'transform translate-x-full' : ''}`}></div>
                            </div>
                            <div className="ml-3 text-gray-700 font-medium">Mostrar solo bonos inactivos</div>
                        </label>
                    </div>

                    {isLoading ? <p>Cargando...</p> : error ? <p className="text-red-500">{error}</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b-2 border-gray-100">
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Nombre</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Estado</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Tipo</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Sesiones</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Precio</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Servicios Incluidos</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayedBonos.length > 0 ? displayedBonos.map(bono => (
                                        <tr key={bono.id} className={`border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors ${!bono.is_active ? 'opacity-60' : ''}`}>
                                            <td className="p-4 text-gray-800 font-medium">{bono.name}</td>
                                            <td className="p-4"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${bono.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{bono.is_active ? 'Activo' : 'Inactivo'}</span></td>
                                            <td className="p-4"><span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${bono.type === 'five_plus_one' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{bono.type === 'five_plus_one' ? '5+1' : 'Especial'}</span></td>
                                            <td className="p-4 text-gray-600">{bono.total_sessions}</td>
                                            <td className="p-4 text-gray-600">{bono.price} €</td>
                                            <td className="p-4 text-gray-600 text-xs">{bono.services.map(s => s.name).join(', ')}</td>
                                            <td className="p-4 whitespace-nowrap space-x-4 flex items-center">
                                                <button onClick={() => setEditingBono(bono)} className="text-pink-600 hover:underline text-sm font-medium disabled:text-gray-400 disabled:cursor-not-allowed" disabled={!bono.is_active}>Editar</button>
                                                <button onClick={() => handleToggleActive(bono)} className="p-1 rounded-full transition-colors" title={bono.is_active ? 'Desactivar' : 'Activar'}>
                                                    {bono.is_active ? <EyeSlashIcon className="h-5 w-5 text-gray-500 hover:text-red-600" /> : <EyeIcon className="h-5 w-5 text-gray-500 hover:text-green-600" />}
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="text-center p-8 text-gray-500">
                                                {showInactive ? 'No se encontraron bonos inactivos.' : 'No hay bonos activos. ¡Crea uno nuevo!'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <CreateBonoModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSaveSuccess={fetchBonos} />
            <EditBonoModal isOpen={!!editingBono} onClose={() => setEditingBono(null)} onSaveSuccess={() => { setEditingBono(null); fetchBonos(); }} bonoToEdit={editingBono} />
            <ConfirmationModal isOpen={confirmation.isOpen} onClose={() => setConfirmation({ ...confirmation, isOpen: false })} onConfirm={confirmation.onConfirm} title={confirmation.title} message={confirmation.message} />
        </>
    );
};

export default BonosPage;