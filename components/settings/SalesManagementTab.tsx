
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';
import SaleDetailModal from './SaleDetailModal';
import { useDebounce } from 'use-debounce';

interface SaleSummary {
    sale_id: string;
    client_name: string;
    sale_date: string;
    total_amount: number;
    payment_status: 'Pagado' | 'Deuda Parcial';
    remaining_debt: number;
}

interface Client {
    id: string;
    full_name: string;
}

const SalesManagementTab = () => {
    const [sales, setSales] = useState<SaleSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filter states
    const [clientNameFilter, setClientNameFilter] = useState('');
    const [startDateFilter, setStartDateFilter] = useState('');
    const [endDateFilter, setEndDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [debouncedClientName] = useDebounce(clientNameFilter, 500);

    // Client selector states
    const [allClients, setAllClients] = useState<Client[]>([]);
    const [isClientListOpen, setIsClientListOpen] = useState(false);
    const clientSearchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchClients = async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('id, full_name')
                .order('full_name');
            if (!error) {
                setAllClients(data);
            }
        };
        fetchClients();
    }, []);

    const fetchSales = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const params = {
            p_client_name: debouncedClientName || null,
            p_start_date: startDateFilter || null,
            p_end_date: endDateFilter || null,
            p_payment_status: statusFilter || null,
        };

        const { data, error: rpcError } = await supabase.rpc('get_all_sales_summary', params);

        if (rpcError) {
            console.error("Error fetching sales summary:", rpcError);
            setError("No se pudieron cargar las ventas. Inténtalo de nuevo.");
        } else {
            setSales(data);
        }
        setIsLoading(false);
    }, [debouncedClientName, startDateFilter, endDateFilter, statusFilter]);

    useEffect(() => {
        fetchSales();
    }, [fetchSales]);

    // Close client list when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (clientSearchRef.current && !clientSearchRef.current.contains(event.target as Node)) {
                setIsClientListOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClearFilters = () => {
        setClientNameFilter('');
        setStartDateFilter('');
        setEndDateFilter('');
        setStatusFilter('');
        setIsClientListOpen(false);
    };

    const handleClientSelect = (client: Client) => {
        setClientNameFilter(client.full_name);
        setIsClientListOpen(false);
    };

    const filteredClients = useMemo(() => {
        if (!clientNameFilter) return [];
        return allClients.filter(c => 
            c.full_name.toLowerCase().includes(clientNameFilter.toLowerCase())
        );
    }, [clientNameFilter, allClients]);

    const handleOpenModal = (saleId: string) => {
        setSelectedSaleId(saleId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSaleId(null);
    };

    const handleSaleDeleted = () => {
        handleCloseModal();
        fetchSales();
    };

    const getStatusChipClass = (status: SaleSummary['payment_status']) => {
        switch (status) {
            case 'Pagado':
                return 'bg-green-100 text-green-800';
            case 'Deuda Parcial':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Listado de Ventas</h3>

            {/* Filter Section */}
            <div className="p-4 bg-gray-50 rounded-lg mb-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div ref={clientSearchRef} className="relative">
                        <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                        <input
                            type="text"
                            id="clientName"
                            value={clientNameFilter}
                            onChange={(e) => setClientNameFilter(e.target.value)}
                            onFocus={() => setIsClientListOpen(true)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            placeholder="Buscar por nombre..."
                            autoComplete="off"
                        />
                        {isClientListOpen && filteredClients.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                <ul className="py-1">
                                    {filteredClients.map(client => (
                                        <li 
                                            key={client.id}
                                            onClick={() => handleClientSelect(client)}
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-pink-50 cursor-pointer"
                                        >
                                            {client.full_name}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Estado del Pago</label>
                        <select
                            id="status"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
                        >
                            <option value="">Todos</option>
                            <option value="Pagado">Pagado</option>
                            <option value="Deuda Parcial">Deuda Parcial</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleClearFilters}
                            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 text-sm font-medium"
                        >
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>

            {isLoading && <div className="text-center py-4">Cargando ventas...</div>}
            {error && <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>}

            {!isLoading && !error && (
                <div className="overflow-x-auto bg-white rounded-lg shadow">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado del Pago</th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Acciones</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sales.length > 0 ? sales.map((sale) => (
                                <tr key={sale.sale_id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.client_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {format(new Date(sale.sale_date), 'dd/MM/yyyy HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(sale.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipClass(sale.payment_status)}`}>
                                            {sale.payment_status}
                                        </span>
                                        {sale.payment_status === 'Deuda Parcial' && (
                                            <span className="block text-xs text-gray-500 mt-1">
                                                Resta: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(sale.remaining_debt)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleOpenModal(sale.sale_id)} className="text-pink-600 hover:text-pink-900">
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                                        No se encontraron ventas para los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && selectedSaleId && (
                <SaleDetailModal 
                    isOpen={isModalOpen} 
                    onClose={handleCloseModal} 
                    saleId={selectedSaleId} 
                    onSaleDeleted={handleSaleDeleted}
                />
            )}
        </div>
    );
};

export default SalesManagementTab;
