import React, { useState, useMemo, useEffect, useCallback } from 'react';
import PageHeader from '../components/ui/PageHeader';
import ClientSelector from '../components/tpv/ClientSelector';
import PastAppointments from '../components/tpv/PastAppointments';
import FutureAppointments from '../components/tpv/FutureAppointments';
import ServiceSelector from '../components/tpv/ServiceSelector';
import BonoSelector from '../components/tpv/BonoSelector';
import ProfessionalSelectorModal from '../components/tpv/ProfessionalSelectorModal';
import PaymentModal from '../components/tpv/PaymentModal';
import PaymentTypeModal from '../components/tpv/PaymentTypeModal';
import AllPendingAppointments from '../components/tpv/AllPendingAppointments';
import TpvEditAppointmentModal from '../components/tpv/TpvEditAppointmentModal';
import { ChevronDownIcon } from '../components/icons/Icons';
import AddNotePromptModal from '../components/tpv/AddNotePromptModal';
import AddServiceNoteModal from '../components/tpv/AddServiceNoteModal';
import { Client, Service, Professional, Appointment, PendingAppointment, Bono } from '../types';
import { supabase } from '../lib/supabaseClient';
import { showSuccessToast, showErrorToast } from '../components/ui/CustomToast';

// --- TYPES ---
export interface TicketItem {
    id: string;
    type: 'service' | 'bono';
    name: string;
    price: number;
    originalPrice: number;
    appointment_id?: string | null;
    service_id?: number;
    professional_id?: string;
    professional_name?: string;
    bono_definition_id?: number;
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number;
    use_bono_id?: string | null;
}

export interface GeneralDiscount { type: 'percentage' | 'fixed'; value: number; }
interface SaleItemInfo { id: number; name: string; }
interface CompletedSaleData { sale_id: string; sale_items: SaleItemInfo[]; }
interface AvailableBono { client_bono_id: string; bono_name: string; remaining_sessions: number; }

// --- COMPONENTS ---
const Ticket: React.FC<{ 
    items: TicketItem[], 
    generalDiscount: GeneralDiscount,
    availableBonos: Record<string, AvailableBono[] | null>,
    onRemove: (id: string) => void,
    onUpdateItemDiscount: (id: string, type: 'percentage' | 'fixed', value: number) => void,
    onUpdateGeneralDiscount: (type: 'percentage' | 'fixed', value: number) => void,
    onProceedToPayment: () => void,
    onUseBono: (ticketItemId: string, clientBonoId: string) => void,
    onCancelUseBono: (ticketItemId: string) => void,
}> = ({ items, generalDiscount, availableBonos, onRemove, onUpdateItemDiscount, onUpdateGeneralDiscount, onProceedToPayment, onUseBono, onCancelUseBono }) => {
    
    const calculateItemTotal = (item: TicketItem) => {
        if (item.use_bono_id) return 0;
        if (item.discount_type === 'percentage') return item.price * (1 - item.discount_value / 100);
        if (item.discount_type === 'fixed') return item.price - item.discount_value;
        return item.price;
    };

    const subtotal = useMemo(() => items.reduce((sum, item) => sum + calculateItemTotal(item), 0), [items]);

    const total = useMemo(() => {
        if (generalDiscount.type === 'percentage') return subtotal * (1 - generalDiscount.value / 100);
        if (generalDiscount.type === 'fixed') return subtotal - generalDiscount.value;
        return subtotal;
    }, [subtotal, generalDiscount]);

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                {items.length > 0 ? items.map(item => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                {item.type === 'service' && <p className="text-sm text-gray-500">con {item.professional_name}</p>}
                                {item.type === 'bono' && <p className="text-sm text-purple-600">Venta de Bono</p>}
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={`font-semibold ${item.discount_value > 0 || item.use_bono_id ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.originalPrice.toLocaleString('es-ES')}€</p>
                                <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700 font-bold">X</button>
                            </div>
                        </div>
                        
                        {item.use_bono_id ? (
                            <div className="mt-2 p-2 bg-green-100 rounded-md flex justify-between items-center">
                                <p className="text-sm font-bold text-green-800">Pagado con Bono</p>
                                <button onClick={() => onCancelUseBono(item.id)} className='text-xs text-gray-600 hover:underline'>Cancelar</button>
                            </div>
                        ) : (
                            <>
                                {item.type === 'service' && (
                                    <div className="mt-2 flex gap-2 items-center">
                                        <input type="number" placeholder="Dto. €" onChange={(e) => onUpdateItemDiscount(item.id, 'fixed', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded-md text-sm"/>
                                        <input type="number" placeholder="Dto. %" onChange={(e) => onUpdateItemDiscount(item.id, 'percentage', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded-md text-sm"/>
                                        {item.discount_value > 0 && <p className="text-sm text-green-600 font-semibold">Total: {calculateItemTotal(item).toLocaleString('es-ES')}€</p>}
                                    </div>
                                )}
                                {availableBonos[item.id] && availableBonos[item.id]!.length > 0 && (
                                    <div className="mt-2">
                                        <button onClick={() => onUseBono(item.id, availableBonos[item.id]![0].client_bono_id)} className="w-full text-sm bg-blue-100 text-blue-800 font-semibold py-1 rounded-md hover:bg-blue-200">Usar Bono ({availableBonos[item.id]![0].remaining_sessions} rest.)</button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )) : <p className="text-center text-gray-400 py-8">Añade productos al ticket.</p>}
            </div>
            {items.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{subtotal.toLocaleString('es-ES')}€</span></div>
                    <div className="flex justify-between items-center text-gray-600">
                        <span>Descuento General</span>
                        <div className="flex gap-2 items-center"><input type="number" placeholder="€" onChange={(e) => onUpdateGeneralDiscount('fixed', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded-md text-sm"/><input type="number" placeholder="%" onChange={(e) => onUpdateGeneralDiscount('percentage', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded-md text-sm"/></div>
                    </div>
                    <div className="flex justify-between font-bold text-2xl border-t pt-2"><span>TOTAL</span><span>{total.toLocaleString('es-ES')}€</span></div>
                    <button onClick={onProceedToPayment} className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors">Proceder al Pago</button>
                </div>
            )}
        </div>
    );
};

const TpvPage: React.FC = () => {
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [ticketItems, setTicketItems] = useState<TicketItem[]>([]);
    const [generalDiscount, setGeneralDiscount] = useState<GeneralDiscount>({ type: 'fixed', value: 0 });
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [bonos, setBonos] = useState<Bono[]>([]);
    const [activeTab, setActiveTab] = useState<'services' | 'bonos'>('services');
    const [availableBonos, setAvailableBonos] = useState<Record<string, AvailableBono[] | null>>({});

    // Modal states & others
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [isPaymentTypeModalOpen, setIsPaymentTypeModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isNotePromptModalOpen, setIsNotePromptModalOpen] = useState(false);
    const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false);
    const [paymentType, setPaymentType] = useState<'completo' | 'aplazado'>('completo');
    const [serviceToAdd, setServiceToAdd] = useState<Service | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [cashierId, setCashierId] = useState<string>('228dc81f-3fab-47ba-9d7a-27ae0e4854f0');
    const [completedSaleData, setCompletedSaleData] = useState<CompletedSaleData | null>(null);
    const [pendingAppointments, setPendingAppointments] = useState<PendingAppointment[]>([]);
    const [isFutureAppointmentsVisible, setIsFutureAppointmentsVisible] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            supabase.from('professionals').select('id, name:full_name, color, email, phone, role, creationDate:created_at, status').then(({data, error}) => { if(error) console.error(error); else setProfessionals(data as Professional[]); });
            supabase.from('clients_with_debt_status').select('*').then(({data, error}) => { if(error) console.error(error); else setClients(data as Client[]); });
            supabase.from('services').select('*').then(({data, error}) => { if(error) console.error(error); else setServices(data as Service[]); });
            supabase.rpc('get_bono_definitions').then(({data, error}) => { if(error) console.error("Error fetching bonos", error); else setBonos(data || []); });
        };
        fetchData();
    }, []);

    const checkAvailableBonos = useCallback(async (items: TicketItem[], client: Client | null) => {
        if (!client) return;
        const bonoCheckPromises = items.map(async item => {
            if (item.type === 'service' && item.service_id) {
                const { data, error } = await supabase.rpc('get_client_bonos_for_service', { p_client_id: client.id, p_service_id: item.service_id });
                if (error) { console.error(`Error checking bonos for service ${item.service_id}:`, error); return { itemId: item.id, bonos: null }; }
                return { itemId: item.id, bonos: data };
            }
            return { itemId: item.id, bonos: null };
        });
        const results = await Promise.all(bonoCheckPromises);
        const newAvailableBonos = results.reduce((acc, result) => ({ ...acc, [result.itemId]: result.bonos }), {});
        setAvailableBonos(newAvailableBonos);
    }, []);

    useEffect(() => {
        checkAvailableBonos(ticketItems, selectedClient);
    }, [ticketItems, selectedClient, checkAvailableBonos]);

    const handleClientSelect = async (client: Client) => {
        setTicketItems([]);
        setSelectedClient(client);
        const { data, error } = await supabase.rpc('get_all_pending_appointments');
        if (error) setPendingAppointments([]);
        else setPendingAppointments((data as PendingAppointment[]).filter(app => app.client_id === client.id) || []);
    }

    const { pastAppointments, futureAppointments } = useMemo(() => {
        const now = new Date();
        return { pastAppointments: pendingAppointments.filter(app => new Date(app.start_time) <= now), futureAppointments: pendingAppointments.filter(app => new Date(app.start_time) > now) };
    }, [pendingAppointments]);

    const handleAddAppointmentToTicket = (appointment: PendingAppointment) => {
        if (!ticketItems.some(item => item.appointment_id === appointment.id)) {
            const newItem: TicketItem = { id: appointment.id, type: 'service', appointment_id: appointment.id, service_id: appointment.service_id, name: appointment.service_name, professional_id: appointment.professional_id, professional_name: appointment.professional_name, price: appointment.price, originalPrice: appointment.price, discount_type: null, discount_value: 0 };
            setTicketItems(prev => [...prev, newItem]);
        }
    };

    const handleAddServiceToTicket = (service: Service, professional: Professional) => {
        const newItem: TicketItem = { id: `${service.id}-${Date.now()}`, type: 'service', appointment_id: null, service_id: service.id, name: service.name, professional_id: professional.id, professional_name: professional.name, price: service.price, originalPrice: service.price, discount_type: null, discount_value: 0 };
        setTicketItems(prev => [...prev, newItem]);
    };

    const handleAddBonoToTicket = (bono: Bono) => {
        const newItem: TicketItem = { id: `bono-${bono.id}-${Date.now()}`, type: 'bono', name: bono.name, price: bono.price, originalPrice: bono.price, bono_definition_id: bono.id, discount_type: null, discount_value: 0 };
        setTicketItems(prev => [...prev, newItem]);
    };

    const handleUseBono = (ticketItemId: string, clientBonoId: string) => {
        setTicketItems(prev => prev.map(item => item.id === ticketItemId ? { ...item, price: 0, use_bono_id: clientBonoId } : item));
    };

    const handleCancelUseBono = (ticketItemId: string) => {
        setTicketItems(prev => prev.map(item => item.id === ticketItemId ? { ...item, price: item.originalPrice, use_bono_id: null } : item));
    };

    const handleRemoveFromTicket = (itemId: string) => setTicketItems(prev => prev.filter(item => item.id !== itemId));
    const handleUpdateItemDiscount = (itemId: string, type: 'percentage' | 'fixed', value: number) => setTicketItems(prev => prev.map(item => item.id === itemId ? { ...item, discount_type: type, discount_value: value } : item));
    const handleUpdateGeneralDiscount = (type: 'percentage' | 'fixed', value: number) => setGeneralDiscount({ type, value });
    const handleSelectService = (service: Service) => { setServiceToAdd(service); setIsProModalOpen(true); };
    const handleProfessionalSelect = (professional: Professional) => { if (serviceToAdd) handleAddServiceToTicket(serviceToAdd, professional); setIsProModalOpen(false); setServiceToAdd(null); };
    const handleSelectPaymentType = (type: 'completo' | 'aplazado') => { setPaymentType(type); setIsPaymentTypeModalOpen(false); setIsPaymentModalOpen(true); };

    const ticketTotal = useMemo(() => {
        const subtotal = ticketItems.reduce((sum, item) => {
            if (item.use_bono_id) return sum; // Price is 0, so it won't be added
            if (item.discount_type === 'percentage') return sum + item.price * (1 - item.discount_value / 100);
            if (item.discount_type === 'fixed') return sum + item.price - item.discount_value;
            return sum + item.price;
        }, 0);
        if (generalDiscount.type === 'percentage') return subtotal * (1 - generalDiscount.value / 100);
        if (generalDiscount.type === 'fixed') return subtotal - generalDiscount.value;
        return subtotal;
    }, [ticketItems, generalDiscount]);

    const handleProceedToPayment = () => {
        if (ticketTotal === 0 && ticketItems.length > 0) {
            // Si el total es 0 (todo pagado con bonos), se completa la venta directamente
            handlePaymentSuccess({ payments: [] });
        } else {
            setIsPaymentTypeModalOpen(true);
        }
    };

    const handlePaymentSuccess = async (paymentDetails: { payments: { method: string; amount: number }[] }) => {
        if (!selectedClient) return;
        const saleData = {
            client_id: selectedClient.id, cashier_id: cashierId, payments: paymentDetails.payments, notes: '', general_discount: generalDiscount,
            items: ticketItems.map(item => ({
                appointment_id: item.appointment_id,
                service_id: item.service_id,
                professional_id: item.professional_id,
                bono_definition_id: item.bono_definition_id,
                price: item.price,
                discount_type: item.discount_type,
                discount_value: item.discount_value,
                client_bono_to_use_id: item.use_bono_id, // Asegúrate que este campo se mapea correctamente
            }))
        };
        const { data, error } = await supabase.rpc('create_sale_v9', { p_sale_data: saleData });
        if (error) { showErrorToast('Hubo un error al registrar la venta.'); console.error(error); }
        else { setIsPaymentModalOpen(false); setCompletedSaleData(data as CompletedSaleData); setIsNotePromptModalOpen(true); }
    };

    const resetTpv = () => { setTicketItems([]); setSelectedClient(null); setGeneralDiscount({ type: 'fixed', value: 0 }); setCompletedSaleData(null); };
    const handleCloseNoteModalsAndReset = () => { showSuccessToast('Venta registrada con éxito.'); setIsNotePromptModalOpen(false); setIsAddNoteModalOpen(false); resetTpv(); };
    const handleConfirmAddNote = () => { setIsNotePromptModalOpen(false); setIsAddNoteModalOpen(true); };
    const handleClientChange = () => { setSelectedClient(null); setTicketItems([]); setPendingAppointments([]); setIsFutureAppointmentsVisible(false); }
    const handleEditAppointment = (appointment: PendingAppointment) => { /* ... as before ... */ };
    const handleSaveAppointment = async (updatedAppointment: Appointment) => { /* ... as before ... */ };

    const addedAppointmentIds = useMemo(() => ticketItems.map(item => item.appointment_id).filter(Boolean) as string[], [ticketItems]);

    return (
        <div>
            <PageHeader title="TPV - Terminal Punto de Venta" subtitle="Gestiona los cobros de servicios y la venta de bonos." />
            <div className="space-y-8">
                <div className={`p-8 rounded-xl shadow-sm transition-colors ${selectedClient?.has_debt ? 'bg-red-50' : 'bg-white'}`}>{!selectedClient ? <ClientSelector onClientSelect={handleClientSelect} /> : (<div><div className="flex justify-between items-center"><p className="text-sm text-gray-500">Cliente seleccionado</p><h3 className="text-2xl font-bold text-gray-800">{selectedClient.name}</h3></div><button onClick={handleClientChange} className="text-sm font-medium text-pink-600 hover:text-pink-800">Cambiar cliente</button></div>)}</div>
                {!selectedClient && <AllPendingAppointments />}
                {selectedClient && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-8 rounded-xl shadow-sm"><h3 className="text-xl font-bold text-gray-800 mb-4">Citas Pasadas Pendientes de Cobro</h3><PastAppointments appointments={pastAppointments} onAppointmentAdd={handleAddAppointmentToTicket} onAppointmentEdit={handleEditAppointment} addedAppointmentIds={addedAppointmentIds} /></div>
                            <div className="bg-white p-8 rounded-xl shadow-sm"><div onClick={() => setIsFutureAppointmentsVisible(!isFutureAppointmentsVisible)} className="cursor-pointer flex justify-between items-center"><h3 className="text-xl font-bold text-gray-800">Citas Futuras Pendientes de Cobro</h3><ChevronDownIcon className={`h-6 w-6 text-gray-600 transform transition-transform ${isFutureAppointmentsVisible ? 'rotate-180' : ''}`} /></div>{isFutureAppointmentsVisible && <div className="mt-4"><FutureAppointments appointments={futureAppointments} onAppointmentAdd={handleAddAppointmentToTicket} onAppointmentEdit={handleEditAppointment} addedAppointmentIds={addedAppointmentIds} /></div>}</div>
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <div className="border-b border-gray-200 mb-4"><nav className="-mb-px flex space-x-6"><button onClick={() => setActiveTab('services')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'services' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Añadir Servicio</button><button onClick={() => setActiveTab('bonos')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'bonos' ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>Vender Bono</button></nav></div>
                                {activeTab === 'services' ? <ServiceSelector onServiceSelect={handleSelectService} /> : <BonoSelector bonos={bonos} onBonoSelect={handleAddBonoToTicket} />}
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm lg:sticky lg:top-24"><h3 className="text-xl font-bold text-gray-800 mb-4">Ticket</h3><Ticket items={ticketItems} generalDiscount={generalDiscount} availableBonos={availableBonos} onRemove={handleRemoveFromTicket} onUpdateItemDiscount={handleUpdateItemDiscount} onUpdateGeneralDiscount={handleUpdateGeneralDiscount} onProceedToPayment={handleProceedToPayment} onUseBono={handleUseBono} onCancelUseBono={handleCancelUseBono} /></div>
                    </div>
                )}
            </div>
            <ProfessionalSelectorModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} professionals={professionals} onProfessionalSelect={handleProfessionalSelect} />
            <PaymentTypeModal isOpen={isPaymentTypeModalOpen} onClose={() => setIsPaymentTypeModalOpen(false)} onSelect={handleSelectPaymentType} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} totalAmount={ticketTotal} paymentType={paymentType} onPaymentSuccess={handlePaymentSuccess} />
            <TpvEditAppointmentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleSaveAppointment} appointment={editingAppointment} clients={clients} services={services} professionals={professionals} />
            <AddNotePromptModal isOpen={isNotePromptModalOpen} onClose={handleCloseNoteModalsAndReset} onConfirm={handleConfirmAddNote} />
            <AddServiceNoteModal isOpen={isAddNoteModalOpen} onClose={handleCloseNoteModalsAndReset} saleItems={completedSaleData?.sale_items || []} />
        </div>
    );
};

export default TpvPage;
