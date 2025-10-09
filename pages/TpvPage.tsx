import React, { useState, useMemo, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import ClientSelector from '../components/tpv/ClientSelector';
import PendingAppointments, { PendingAppointment } from '../components/tpv/PendingAppointments';
import ServiceSelector from '../components/tpv/ServiceSelector';
import ProfessionalSelectorModal from '../components/tpv/ProfessionalSelectorModal';
import PaymentModal from '../components/tpv/PaymentModal';
import PaymentTypeModal from '../components/tpv/PaymentTypeModal';
import AllPendingAppointments from '../components/tpv/AllPendingAppointments';
import TpvEditAppointmentModal from '../components/tpv/TpvEditAppointmentModal'; // Import new modal
import { Client, Service, Professional, Appointment } from '../types';
import { supabase } from '../lib/supabaseClient';

// --- TYPES ---
export interface TicketItem {
    id: string;
    appointment_id: string | null;
    service_id: number;
    service_name: string;
    professional_id: string;
    professional_name: string;
    price: number;
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number;
}

export interface GeneralDiscount {
    type: 'percentage' | 'fixed';
    value: number;
}

// --- COMPONENTS ---
const Ticket: React.FC<{ 
    items: TicketItem[], 
    generalDiscount: GeneralDiscount,
    onRemove: (id: string) => void,
    onUpdateItemDiscount: (id: string, type: 'percentage' | 'fixed', value: number) => void,
    onUpdateGeneralDiscount: (type: 'percentage' | 'fixed', value: number) => void,
    onProceedToPayment: () => void
}> = ({ items, generalDiscount, onRemove, onUpdateItemDiscount, onUpdateGeneralDiscount, onProceedToPayment }) => {
    
    const calculateItemTotal = (item: TicketItem) => {
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
                                <p className="font-medium">{item.service_name}</p>
                                <p className="text-sm text-gray-500">con {item.professional_name}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <p className={`font-semibold ${item.discount_value > 0 ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.price.toLocaleString('es-ES')}€</p>
                                <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700 font-bold">X</button>
                            </div>
                        </div>
                        <div className="mt-2 flex gap-2 items-center">
                            <input type="number" placeholder="Dto. €" onChange={(e) => onUpdateItemDiscount(item.id, 'fixed', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded-md text-sm"/>
                            <input type="number" placeholder="Dto. %" onChange={(e) => onUpdateItemDiscount(item.id, 'percentage', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 border rounded-md text-sm"/>
                            {item.discount_value > 0 && <p className="text-sm text-green-600 font-semibold">Total: {calculateItemTotal(item).toLocaleString('es-ES')}€</p>}
                        </div>
                    </div>
                )) : <p className="text-center text-gray-400 py-8">Añade servicios al ticket.</p>}
            </div>
            {items.length > 0 && (
                <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-gray-600">
                            <span>Subtotal</span>
                            <span>{subtotal.toLocaleString('es-ES')}€</span>
                        </div>
                        <div className="flex justify-between items-center text-gray-600">
                            <span>Descuento General</span>
                            <div className="flex gap-2 items-center">
                                <input type="number" placeholder="€" onChange={(e) => onUpdateGeneralDiscount('fixed', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded-md text-sm"/>
                                <input type="number" placeholder="%" onChange={(e) => onUpdateGeneralDiscount('percentage', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 border rounded-md text-sm"/>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-between font-bold text-2xl border-t pt-2">
                        <span>TOTAL</span>
                        <span>{total.toLocaleString('es-ES')}€</span>
                    </div>
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
    
    // Global data
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Modal states
    const [isProModalOpen, setIsProModalOpen] = useState(false);
    const [isPaymentTypeModalOpen, setIsPaymentTypeModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const [paymentType, setPaymentType] = useState<'completo' | 'aplazado'>('completo');
    const [serviceToAdd, setServiceToAdd] = useState<Service | null>(null);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [cashierId, setCashierId] = useState<string>('228dc81f-3fab-47ba-9d7a-27ae0e4854f0'); // Hardcoded for now

    useEffect(() => {
        const fetchData = async () => {
            const { data: professionalsData, error: professionalsError } = await supabase.from('professionals').select('id, name:full_name, color, email, phone, role, creationDate:created_at, status');
            if (professionalsError) console.error("Error fetching professionals", professionalsError);
            else setProfessionals(professionalsData as Professional[]);

            const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*, name:full_name');
            if (clientsError) console.error("Error fetching clients", clientsError);
            else setClients(clientsData as Client[]);

            const { data: servicesData, error: servicesError } = await supabase.from('services').select('*');
            if (servicesError) console.error("Error fetching services", servicesError);
            else setServices(servicesData as Service[]);
        };
        fetchData();
    }, []);

    const handleAddAppointmentToTicket = (appointment: PendingAppointment) => {
        if (!ticketItems.some(item => item.appointment_id === appointment.id)) {
            const newItem: TicketItem = { id: appointment.id, appointment_id: appointment.id, service_id: appointment.service_id, service_name: appointment.service_name, professional_id: appointment.professional_id, professional_name: appointment.professional_name, price: appointment.price, discount_type: null, discount_value: 0 };
            setTicketItems(prev => [...prev, newItem]);
        }
    };

    const handleAddServiceToTicket = (service: Service, professional: Professional) => {
        const newItem: TicketItem = { id: `${service.id}-${Date.now()}`, appointment_id: null, service_id: service.id, service_name: service.name, professional_id: professional.id, professional_name: professional.name, price: service.price, discount_type: null, discount_value: 0 };
        setTicketItems(prev => [...prev, newItem]);
    };

    const handleRemoveFromTicket = (itemId: string) => setTicketItems(prev => prev.filter(item => item.id !== itemId));
    const handleUpdateItemDiscount = (itemId: string, type: 'percentage' | 'fixed', value: number) => setTicketItems(prev => prev.map(item => item.id === itemId ? { ...item, discount_type: type, discount_value: value } : item));
    const handleUpdateGeneralDiscount = (type: 'percentage' | 'fixed', value: number) => setGeneralDiscount({ type, value });

    const handleSelectService = (service: Service) => {
        setServiceToAdd(service);
        setIsProModalOpen(true);
    };

    const handleProfessionalSelect = (professional: Professional) => {
        if (serviceToAdd) handleAddServiceToTicket(serviceToAdd, professional);
        setIsProModalOpen(false);
        setServiceToAdd(null);
    };

    const handleSelectPaymentType = (type: 'completo' | 'aplazado') => {
        setPaymentType(type);
        setIsPaymentTypeModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    const handlePaymentSuccess = async (paymentDetails: any) => {
        if (!selectedClient) return;

        const saleData = {
            client_id: selectedClient.id,
            cashier_id: cashierId,
            payment_method: paymentDetails.method,
            amount_paid: paymentDetails.amount_paid,
            change_given: paymentDetails.change,
            notes: '', // Placeholder for sale notes
            general_discount: generalDiscount,
            items: ticketItems.map(item => ({
                appointment_id: item.appointment_id,
                service_id: item.service_id,
                professional_id: item.professional_id,
                price: item.price,
                discount_type: item.discount_type,
                discount_value: item.discount_value
            }))
        };

        const { data, error } = await supabase.rpc('create_sale', { p_sale_data: saleData });

        if (error) {
            console.error('Error creating sale:', error);
            alert('Hubo un error al registrar la venta.');
        } else {
            alert(`Venta registrada con éxito.`);
            setIsPaymentModalOpen(false);
            setTicketItems([]);
            setSelectedClient(null);
        }
    };

    const handleClientSelect = (client: Client) => {
        setTicketItems([]);
        setSelectedClient(client);
    }

    const handleClientChange = () => {
        setSelectedClient(null);
        setTicketItems([]);
    }

    const handleEditAppointment = (appointment: PendingAppointment) => {
        // We need the full appointment object, but PendingAppointment is a summary.
        // Let's find the full objects.
        const fullAppointment: Appointment = {
            id: appointment.id,
            start_time: appointment.start_time,
            end_time: '', // This will be recalculated in the modal
            client: clients.find(c => c.id === selectedClient?.id)!,
            service: services.find(s => s.id === appointment.service_id)!,
            professional: professionals.find(p => p.id === appointment.professional_id)!,
            status: 'Pendiente' // Assuming it's pending
        }
        setEditingAppointment(fullAppointment);
        setIsEditModalOpen(true);
    };

    const handleSaveAppointment = async (updatedAppointment: Appointment) => {
        const { error } = await supabase
            .from('appointments')
            .update({
                client_id: updatedAppointment.client.id,
                service_id: updatedAppointment.service.id,
                professional_id: updatedAppointment.professional.id,
                start_time: updatedAppointment.start_time,
                end_time: updatedAppointment.end_time,
            })
            .eq('id', updatedAppointment.id);

        if (error) {
            alert(`Error al actualizar la cita: ${error.message}`);
        } else {
            setIsEditModalOpen(false);
            setEditingAppointment(null);

            // Smart Refresh Logic
            if (selectedClient && selectedClient.id !== updatedAppointment.client.id) {
                setSelectedClient(updatedAppointment.client);
                setTicketItems([]); // Clear ticket for the new client
            } else {
                // If client is the same, we might need to refresh pending appointments
                // For simplicity, we can just re-select the client to trigger a refresh
                const currentClient = selectedClient;
                setSelectedClient(null);
                setTimeout(() => setSelectedClient(currentClient), 0);
            }
        }
    };

    const addedAppointmentIds = useMemo(() => ticketItems.map(item => item.appointment_id).filter(Boolean) as string[], [ticketItems]);
    const ticketTotal = useMemo(() => {
        const subtotal = ticketItems.reduce((sum, item) => {
            if (item.discount_type === 'percentage') return sum + item.price * (1 - item.discount_value / 100);
            if (item.discount_type === 'fixed') return sum + item.price - item.discount_value;
            return sum + item.price;
        }, 0);
        if (generalDiscount.type === 'percentage') return subtotal * (1 - generalDiscount.value / 100);
        if (generalDiscount.type === 'fixed') return subtotal - generalDiscount.value;
        return subtotal;
    }, [ticketItems, generalDiscount]);

    return (
        <div>
            <PageHeader title="TPV - Terminal Punto de Venta" subtitle="Gestiona los cobros de servicios y la venta de bonos." />
            <div className="space-y-8">
                <div className="p-8 bg-white rounded-xl shadow-sm">
                    {!selectedClient ? <ClientSelector onClientSelect={handleClientSelect} /> : (
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-gray-500">Cliente seleccionado</p>
                                <h3 className="text-2xl font-bold text-gray-800">{selectedClient.name}</h3>
                            </div>
                            <button onClick={handleClientChange} className="text-sm font-medium text-pink-600 hover:text-pink-800">Cambiar cliente</button>
                        </div>
                    )}
                </div>

                {!selectedClient && <AllPendingAppointments />}

                {selectedClient && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Servicios Pendientes de Cobro</h3>
                                <PendingAppointments 
                                    clientId={selectedClient.id} 
                                    onAppointmentAdd={handleAddAppointmentToTicket} 
                                    onAppointmentEdit={handleEditAppointment}
                                    addedAppointmentIds={addedAppointmentIds} 
                                />
                            </div>
                            <div className="bg-white p-8 rounded-xl shadow-sm">
                                <h3 className="text-xl font-bold text-gray-800 mb-4">Añadir Servicio Manualmente</h3>
                                <ServiceSelector onServiceSelect={handleSelectService} />
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-xl shadow-sm lg:sticky lg:top-24">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Ticket</h3>
                            <Ticket items={ticketItems} generalDiscount={generalDiscount} onRemove={handleRemoveFromTicket} onUpdateItemDiscount={handleUpdateItemDiscount} onUpdateGeneralDiscount={handleUpdateGeneralDiscount} onProceedToPayment={() => setIsPaymentTypeModalOpen(true)} />
                        </div>
                    </div>
                )}
            </div>
            <ProfessionalSelectorModal isOpen={isProModalOpen} onClose={() => setIsProModalOpen(false)} professionals={professionals} onProfessionalSelect={handleProfessionalSelect} />
            <PaymentTypeModal isOpen={isPaymentTypeModalOpen} onClose={() => setIsPaymentTypeModalOpen(false)} onSelect={handleSelectPaymentType} />
            <PaymentModal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} totalAmount={ticketTotal} paymentType={paymentType} onPaymentSuccess={handlePaymentSuccess} />
            <TpvEditAppointmentModal 
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleSaveAppointment}
                appointment={editingAppointment}
                clients={clients}
                services={services}
                professionals={professionals}
            />
        </div>
    );
};

export default TpvPage;
