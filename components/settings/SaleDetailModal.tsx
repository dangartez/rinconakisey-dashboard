
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { TrashIcon, PencilIcon } from '../icons/Icons';
import { format } from 'date-fns';
import DeleteConfirmationModal from './DeleteConfirmationModal';

interface SaleDetailModalProps {
    saleId: string;
    isOpen: boolean;
    onClose: () => void;
    onSaleDeleted: () => void;
}

interface SaleDetails {
    sale_info: any;
    client_info: any;
    items: any[];
    payments: any[];
    debt_info: any;
}

const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ saleId, isOpen, onClose, onSaleDeleted }) => {
    const [details, setDetails] = useState<SaleDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (isOpen && saleId) {
            const fetchDetails = async () => {
                setIsLoading(true);
                setError(null);
                const { data, error: rpcError } = await supabase.rpc('get_sale_details', { p_sale_id: saleId });

                if (rpcError) {
                    console.error("Error fetching sale details:", rpcError);
                    setError("No se pudieron cargar los detalles de la venta.");
                } else {
                    setDetails(data);
                }
                setIsLoading(false);
            };
            fetchDetails();
        }
    }, [isOpen, saleId]);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        const { error: deleteError } = await supabase.rpc('delete_sale_and_cleanup', { p_sale_id: saleId });

        if (deleteError) {
            console.error("Error deleting sale:", deleteError);
            alert("Error al borrar la venta. Por favor, inténtalo de nuevo.");
            setIsDeleting(false);
        } else {
            alert("Venta borrada con éxito.");
            setIsDeleting(false);
            setIsDeleteModalOpen(false);
            onSaleDeleted();
        }
    };

    if (!isOpen) return null;

    const renderContent = () => {
        if (isLoading) return <div>Cargando detalles...</div>;
        if (error) return <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>;
        if (!details) return <div>No se encontraron detalles para esta venta.</div>;

        const { sale_info, client_info, items, payments, debt_info } = details;

        return (
            <div className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg">
                    <div>
                        <h4 className="text-sm font-medium text-gray-500">Cliente</h4>
                        <p className="text-lg font-semibold text-gray-900">{client_info.full_name}</p>
                        <p className="text-sm text-gray-600">{client_info.phone || 'Sin teléfono'}</p>
                        <p className="text-sm text-gray-600">{client_info.email || 'Sin email'}</p>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-500">Venta</h4>
                        <p className="text-sm text-gray-600">ID: {sale_info.id}</p>
                        <p className="text-sm text-gray-600">Fecha: {format(new Date(sale_info.created_at), 'dd/MM/yyyy HH:mm')}</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                            Total: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(sale_info.total_amount)}
                        </p>
                    </div>
                </div>
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">Artículos Vendidos</h4>
                    <ul className="divide-y divide-gray-200 border rounded-lg">
                        {items.map((item, index) => (
                            <li key={index} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.service_name}</p>
                                    <p className="text-sm text-gray-500">Atendido por: {item.professional_name}</p>
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(item.price)}
                                </p>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Pagos Realizados</h4>
                        <ul className="divide-y divide-gray-200 border rounded-lg">
                            {payments.map((payment, index) => (
                                <li key={index} className="px-4 py-3 flex justify-between items-center">
                                    <p className="font-semibold text-gray-800 capitalize">{payment.method}</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(payment.amount)}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Información de Deuda</h4>
                        {debt_info ? (
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between font-semibold">
                                    <span className="text-yellow-800">Deuda Inicial:</span>
                                    <span className="text-yellow-900">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(debt_info.initial_amount)}</span>
                                </div>
                                <div className="flex justify-between font-bold">
                                    <span className="text-yellow-800">Deuda Restante:</span>
                                    <span className="text-yellow-900 text-lg">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(debt_info.remaining_amount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-yellow-800">Estado:</span>
                                    <span className="font-semibold capitalize text-yellow-900">{debt_info.status}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                                <p className="font-semibold text-green-800">Venta Pagada en su Totalidad</p>
                            </div>
                        )}
                    </div>
                </div>

                {sale_info.notes && (
                     <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-2">Notas de la Venta</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border">{sale_info.notes}</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
                onClick={onClose}
            >
                <div 
                    className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-4 border-b">
                        <h3 className="text-xl font-bold text-gray-800">Detalles de la Venta</h3>
                    </div>
                    <div className="p-6 overflow-y-auto">
                        {renderContent()}
                    </div>
                    <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-xl">
                        <button 
                            onClick={() => setIsDeleteModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 shadow-sm">
                            <TrashIcon className="h-4 w-4" />
                            Borrar Venta
                        </button>
                        <button 
                            type="button"
                            onClick={onClose} 
                            className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
            <DeleteConfirmationModal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                itemName={`la venta #${saleId.substring(0, 8)}`}
                confirmationText="BORRAR"
                isLoading={isDeleting}
            />
        </>
    );
};

export default SaleDetailModal;
