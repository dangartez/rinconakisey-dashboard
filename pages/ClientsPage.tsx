
import { Client, Appointment, Professional } from '../types'; // Import Professional
import NewClientModal from '../components/clients/NewClientModal';
import EditClientModal from '../components/clients/EditClientModal';
import ClientHistoryModal from '../components/clients/ClientHistoryModal';
import NewNoteModal from '../components/clients/NewNoteModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { DocumentPlusIcon } from '../components/icons/Icons';

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonText?: string;
    confirmButtonColor?: 'pink' | 'red' | 'green';
    singleButton?: boolean;
}

import React, { useState, useMemo, useEffect } from 'react';
import { supabase, supabaseAdmin } from '../lib/supabaseClient';

const ClientsPage: React.FC = () => {
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    
    const [clients, setClients] = useState<Client[]>([]);
    const [professionals, setProfessionals] = useState<Professional[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    const [selectedClientForEdit, setSelectedClientForEdit] = useState<Client | null>(null);
    const [selectedClientForHistory, setSelectedClientForHistory] = useState<Client | null>(null);
    const [selectedClientForNote, setSelectedClientForNote] = useState<Client | null>(null);

    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    useEffect(() => {
        const fetchData = async () => {
            const { data: clientsData, error: clientsError } = await supabase.from('clients').select('id, user_id, full_name, phone, email, nickname, created_at, claim_code').order('created_at', { ascending: false });
            if (clientsError) console.error('Error fetching clients:', clientsError);
            else setClients(clientsData?.map(c => ({...c, name: c.full_name, registrationDate: new Date(c.created_at).toLocaleDateString('es-ES')})) as Client[] || []);

            const { data: profData, error: profError } = await supabase.from('professionals').select('id, full_name').order('full_name');
            if (profError) console.error('Error fetching professionals:', profError);
            else setProfessionals(profData?.map(p => ({...p, name: p.full_name})) as Professional[] || []);
        };
        fetchData();
    }, []);

    const filteredClients = useMemo(() => {
        if (!searchTerm.trim()) return clients;
        const lowercasedFilter = searchTerm.toLowerCase();
        return clients.filter(client =>
            (client.name || '').toLowerCase().includes(lowercasedFilter) ||
            (client.phone || '').includes(lowercasedFilter) ||
            (client.email || '').toLowerCase().includes(lowercasedFilter) ||
            (client.nickname || '').toLowerCase().includes(lowercasedFilter)
        );
    }, [searchTerm, clients]);

    const handleAddClient = async (data: { 
        clientData: Omit<Client, 'id' | 'registrationDate'> & { password?: string };
        noteData: { content: string; is_favorite: boolean; professional_id: string };
    }) => {
        const { clientData, noteData } = data;
        const { name, email, password, phone, nickname } = clientData;
        let userId: string | null = null;

        if (email && password) {
            if (!supabaseAdmin) return alert('Error: El cliente de administración de Supabase no está configurado.');
            const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true });
            if (authError) return alert(`Error al crear la cuenta de usuario: ${authError.message}`);
            userId = authData.user.id;
        }

        const { data: newClient, error: clientError } = await supabase.from('clients').insert({ user_id: userId, full_name: name, email, phone, nickname }).select().single();
        if (clientError) return alert(`Error al crear el perfil del cliente: ${clientError.message}`);

        if (noteData.content.trim() && noteData.professional_id) {
            const { error: noteError } = await supabase.from('client_notes').insert({ client_id: newClient.id, professional_id: noteData.professional_id, note: noteData.content, is_favorite: noteData.is_favorite });
            if (noteError) alert(`El cliente se creó, pero hubo un error al guardar la nota: ${noteError.message}`);
        }

        setIsNewModalOpen(false);
        fetchClients();
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
                    <div className="mb-6">
                         <input type="text" placeholder="Buscar por nombre, teléfono, email" className="w-full max-w-md px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
                                    <tr key={client.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-800 font-medium">{client.name}</td>
                                        <td className="p-4 text-gray-600"><div>{client.phone}</div><div className="text-xs text-gray-500">{client.email}</div></td>
                                        <td className="p-4 text-gray-600">{client.registrationDate}</td>
                                        <td className="p-4 text-gray-600">{client.nickname}</td>
                                        <td className="p-4 whitespace-nowrap flex items-center gap-3">
                                            <button onClick={() => handleOpenNoteModal(client)} title="Añadir Nota" className="text-gray-500 hover:text-blue-600"><DocumentPlusIcon className="h-6 w-6" /></button>
                                            <button onClick={() => handleHistoryClick(client)} className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">Ver Historial</button>
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
            {selectedClientForHistory && <ClientHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} client={selectedClientForHistory} />}
            {selectedClientForNote && <NewNoteModal isOpen={isNoteModalOpen} onClose={() => setIsNoteModalOpen(false)} onSave={handleSaveNote} clientName={selectedClientForNote.name} professionals={professionals} />}
            <ConfirmationModal isOpen={confirmation.isOpen} onClose={() => setConfirmation({ ...confirmation, isOpen: false })} onConfirm={confirmation.onConfirm} {...confirmation} />
        </>
    );
};

export default ClientsPage;
