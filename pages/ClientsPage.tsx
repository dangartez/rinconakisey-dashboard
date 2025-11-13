
import { Client, Appointment, Professional } from '../types'; // Import Professional
import NewClientModal from '../components/clients/NewClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import ClientHistoryModal from '../components/clients/ClientHistoryModal';
import NewNoteModal from '../components/clients/NewNoteModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { NoteAddIcon } from '../components/icons/Icons';

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonText?: string;
    confirmButtonColor?: 'pink' | 'red' | 'green';
    singleButton?: boolean;
}

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';

const ClientsPage: React.FC = () => {
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    
    const [clients, setClients] = useState<Client[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debtFilter, setDebtFilter] = useState<'ALL' | 'WITH_DEBT'>('ALL'); // Estado para el filtro de deuda
    const [bonoFilter, setBonoFilter] = useState<'ALL' | 'WITH_BONO'>('ALL'); // Estado para el filtro de bonos

    const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
    const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
    const [selectedClientForNote, setSelectedClientForNote] = useState<Client | null>(null);

    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    const fetchData = useCallback(async () => {
        const { data: clientsData, error: clientsError } = await supabase.from('clients_with_bono_status').select('*').order('created_at', { ascending: false });
        if (clientsError) console.error('Error fetching clients:', clientsError);
        else setClients(clientsData?.map(c => ({...c, name: c.full_name, registrationDate: new Date(c.created_at).toLocaleDateString('es-ES')})) as Client[] || []);

        const { data: profData, error: profError } = await supabase.from('professionals').select('id, full_name').order('full_name');
        if (profError) console.error('Error fetching professionals:', profError);
        else setProfessionals(profData?.map(p => ({...p, name: p.full_name})) as Professional[] || []);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredClients = useMemo(() => {
        let tempClients = clients;

        // Aplicar filtro de deuda
        if (debtFilter === 'WITH_DEBT') {
            tempClients = tempClients.filter(client => client.has_debt);
        }

        // Aplicar filtro de bonos
        if (bonoFilter === 'WITH_BONO') {
            tempClients = tempClients.filter(client => client.has_bono);
        }

        // Aplicar filtro de búsqueda
        if (!searchTerm.trim()) return tempClients;
        
        const lowercasedFilter = searchTerm.toLowerCase();
        return tempClients.filter(client =>
            (client.name || '').toLowerCase().includes(lowercasedFilter) ||
            (client.phone || '').includes(lowercasedFilter) ||
            (client.email || '').toLowerCase().includes(lowercasedFilter) ||
            (client.nickname || '').toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, clients, debtFilter, bonoFilter]); // Añadir bonoFilter a las dependencias

    const handleAddClient = async (data: { 
        clientData: Omit<Client, 'id' | 'registrationDate'> & { password?: string };
        noteData: { content: string; is_favorite: boolean; professional_id: string };
    }) => {
        const { clientData, noteData } = data;
        const { name, email, password, phone, nickname } = clientData;
        let userId: string | null = null;

        // 1. Check for duplicate phone number (mandatory field)
        const { data: existingPhone, error: phoneCheckError } = await supabase
            .from('clients')
            .select('id')
            .eq('phone', phone)
            .single();

        if (existingPhone) {
            alert('Error: Ya existe un cliente con este número de teléfono.');
            return;
        }

        // 2. Check for duplicate email (optional field)
        if (email) {
            const { data: existingEmail, error: emailCheckError } = await supabase
                .from('clients')
                .select('id')
                .eq('email', email)
                .single();

            if (existingEmail) {
                alert('Error: Ya existe un cliente con este correo electrónico.');
                return;
            }
        }

        // 3. If email is provided, create the auth user
        if (email && password) {
            if (!supabaseAdmin) {
                alert('Error: El cliente de administración de Supabase no está configurado.');
                return;
            }
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
            if (authError) {
                if (authError.message.includes('duplicate key value')) {
                     alert('Error: Este correo electrónico ya está registrado en el sistema. Puede pertenecer a otro usuario.');
                } else {
                    alert(`Error al crear la cuenta de usuario: ${authError.message}`);
                }
                return;
            }
            userId = authData.user.id;
        }

        // 4. Create the client profile
        const { data: newClient, error: clientError } = await supabase.from('clients').insert({ user_id: userId, full_name: name, email: email || null, phone, nickname }).select().single();
        if (clientError) {
            alert(`Error al crear el perfil del cliente: ${clientError.message}`);
            return;
        }

        // 5. Add initial note if provided
        if (noteData.content.trim() && noteData.professional_id) {
            const { error: noteError } = await supabase.from('client_notes').insert({ client_id: newClient.id, professional_id: noteData.professional_id, note: noteData.content, is_favorite: noteData.is_favorite });
            if (noteError) {
                alert(`El cliente se creó, pero hubo un error al guardar la nota: ${noteError.message}`);
            }
        }

        setIsNewModalOpen(false);
        window.location.reload(); // Reload to show the new client
        setConfirmation({ isOpen: true, title: 'Cliente Guardado', message: 'El nuevo cliente se ha guardado correctamente.', onConfirm: () => setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }), confirmButtonColor: 'green', confirmButtonText: 'Aceptar', singleButton: true });
    };

    const handleSaveNote = async (note: { content: string; is_favorite: boolean; professional_id: string }) => {
        if (!selectedClientForNote || !note.professional_id) return alert('No se ha seleccionado un cliente o profesional.');

        const { error } = await supabase.from('client_notes').insert({ client_id: selectedClientForNote.id, professional_id: note.professional_id, note: note.content, is_favorite: note.is_favorite });

        if (error) {
            alert(`Error al guardar la nota: ${error.message}`);
        } else {
            setIsNoteModalOpen(false);
            setConfirmation({ isOpen: true, title: 'Nota Guardada', message: 'La nota se ha guardado correctamente.', onConfirm: () => setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} }), confirmButtonText: 'Aceptar', singleButton: true });
        }
    };

    const handleEditClick = (client: Client) => { setSelectedClientForEdit(client); setIsEditModalOpen(true); };
    const handleHistoryClick = (client: Client) => { setSelectedClientForHistory(client); setIsHistoryModalOpen(true); };
    const handleOpenNoteModal = (client: Client) => { setSelectedClientForNote(client); setIsNoteModalOpen(true); };
    const handleUpdateClient = async (updatedClient: Client) => { /* ... */ };
    const handleDeleteClient = async (client: Client) => { /* ... */ };
    const handleShowClaimCode = (client: Client) => { /* ... */ };

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800">Clientes</h1>
                        <p className="text-gray-500 mt-1">Gestiona la información y el historial de tus clientes.</p>
                    </div>
                    <button onClick={() => setIsNewModalOpen(true)} className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm">Nuevo Cliente</button>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => { setDebtFilter('ALL'); setBonoFilter('ALL'); }}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${debtFilter === 'ALL' && bonoFilter === 'ALL' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                Todos los Clientes
                            </button>
                            <button 
                                onClick={() => { setDebtFilter('WITH_DEBT'); setBonoFilter('ALL'); }}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${debtFilter === 'WITH_DEBT' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                Clientes con Deuda
                            </button>
                            <button 
                                onClick={() => { setBonoFilter('WITH_BONO'); setDebtFilter('ALL'); }}
                                className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${bonoFilter === 'WITH_BONO' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                Clientes con Bonos
                            </button>
                        </div>
                        <div className="w-full max-w-md">
                            <input type="text" placeholder="Buscar por nombre, teléfono, email..." className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b-2 border-gray-100">
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Nombre</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Contacto</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Fecha de Alta</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Apodo</th>
                                    <th className="p-4 text-sm font-semibold text-gray-600 tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClients.map(client => (
                                <tr key={client.id} className={`border-b border-gray-100 last:border-b-0 transition-colors ${client.has_debt ? 'bg-red-50 hover:bg-red-100' : client.has_bono ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50/50'}`}>
                                        <td className="p-4 text-gray-800 font-medium">{client.name}</td>
                                        <td className="p-4 text-gray-600"><div>{client.phone}</div><div className="text-xs text-gray-500">{client.email}</div></td>
                                        <td className="p-4 text-gray-600">{client.registrationDate}</td>
                                        <td className="p-4 text-gray-600">{client.nickname}</td>
                                        <td className="p-4 whitespace-nowrap flex items-center gap-3">
                                            <button onClick={() => handleOpenNoteModal(client)} title="Añadir Nota" className="text-gray-500 hover:text-blue-600"><NoteAddIcon className="h-6 w-6" /></button>
                                            <button onClick={() => handleHistoryClick(client)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">Ver Ficha</button>
                                            <button onClick={() => handleEditClick(client)} className="text-pink-600 hover:text-pink-700 hover:underline text-sm font-medium">Editar</button>
                                            {/* Other buttons omitted for brevity */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <NewClientModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSave={handleAddClient} professionals={professionals} />
            {selectedClientForEdit && <EditClientModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSave={handleUpdateClient} client={selectedClientForEdit} />}
            {selectedClientForHistory && <ClientHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} client={selectedClientForHistory} onDataChange={fetchData} />}
            {selectedClientForNote && <NewNoteModal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} onSave={handleSaveNote} clientName={selectedClientForNote.name} professionals={professionals} />}
            <ConfirmationModal isOpen={confirmation.isOpen} onClose={() => setConfirmation({ ...confirmation, isOpen: false })} onConfirm={confirmation.onConfirm} {...confirmation} />
        </>
    );
};

export default ClientsPage;
