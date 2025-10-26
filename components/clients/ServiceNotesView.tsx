import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { StarIcon, PencilIcon, TrashIcon } from '../icons/Icons';
import ConfirmationModal from '../ui/ConfirmationModal';
import EditServiceNoteModal from './EditServiceNoteModal';

interface ServiceNote {
    id: number;
    note: string;
    is_favorite: boolean;
    created_at: string;
    service_name: string;
    professional_name: string;
}

interface ServiceNotesViewProps {
    clientId: string;
}

const ServiceNotesView: React.FC<ServiceNotesViewProps> = ({ clientId }) => {
    const [notes, setNotes] = useState<ServiceNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [noteToDelete, setNoteToDelete] = useState<number | null>(null);
    const [noteToEdit, setNoteToEdit] = useState<ServiceNote | null>(null);

    useEffect(() => {
        fetchServiceNotes();
    }, [clientId]);

    const fetchServiceNotes = async () => {
        setIsLoading(true);
        setError(null);
        const { data, error } = await supabase.rpc('get_service_notes_for_client', { p_client_id: clientId });

        if (error) {
            console.error("Error fetching service notes:", error);
            setError("No se pudieron cargar las notas de servicio.");
        } else {
            setNotes(data || []);
        }
        setIsLoading(false);
    };

    const filteredNotes = useMemo(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        return notes.filter(note => 
            note.note.toLowerCase().includes(lowercasedTerm) ||
            note.service_name.toLowerCase().includes(lowercasedTerm) ||
            note.professional_name.toLowerCase().includes(lowercasedTerm)
        );
    }, [notes, searchTerm]);

    const favoriteNotes = useMemo(() => filteredNotes.filter(n => n.is_favorite), [filteredNotes]);
    const normalNotes = useMemo(() => filteredNotes.filter(n => !n.is_favorite), [filteredNotes]);

    const handleToggleFavorite = async (noteId: number, isCurrentlyFavorite: boolean) => {
        const { error } = await supabase.from('sale_items').update({ is_favorite: !isCurrentlyFavorite }).eq('id', noteId);
        if (error) {
            alert("Error al actualizar el estado de favorito.");
        } else {
            fetchServiceNotes(); // Refresh data
        }
    };

    const handleDelete = (noteId: number) => {
        setNoteToDelete(noteId);
    };

    const handleEdit = (note: ServiceNote) => {
        setNoteToEdit(note);
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;
        const { error } = await supabase.from('sale_items').delete().eq('id', noteToDelete);
        if (error) {
            alert("Error al borrar la nota.");
        } else {
            fetchServiceNotes(); // Refresh data
        }
        setNoteToDelete(null);
    };

    if (isLoading) return <div className="text-center p-16">Cargando notas de servicio...</div>;
    if (error) return <div className="text-center p-16 text-red-500">{error}</div>;

    return (
        <div className="p-8">
            <input 
                type="text"
                placeholder="Buscar por servicio, profesional o contenido de la nota..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 mb-6"
            />

            {filteredNotes.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No se encontraron notas para este cliente.</p>
            ) : (
                <div className="space-y-6">
                    <NoteList title="Notas Favoritas" notes={favoriteNotes} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} onEdit={handleEdit} />
                    <NoteList title="Otras Notas" notes={normalNotes} onToggleFavorite={handleToggleFavorite} onDelete={handleDelete} onEdit={handleEdit} />
                </div>
            )}

            <ConfirmationModal 
                isOpen={noteToDelete !== null}
                onClose={() => setNoteToDelete(null)}
                onConfirm={confirmDelete}
                title="Confirmar Borrado"
                message="¿Estás seguro de que quieres borrar esta nota de servicio? Esta acción no se puede deshacer."
            />

            <EditServiceNoteModal 
                isOpen={noteToEdit !== null}
                onClose={() => setNoteToEdit(null)}
                note={noteToEdit}
                onNoteUpdated={fetchServiceNotes}
            />
        </div>
    );
};

interface NoteListProps {
    title: string;
    notes: ServiceNote[];
    onToggleFavorite: (noteId: number, isFavorite: boolean) => void;
    onDelete: (noteId: number) => void;
    onEdit: (note: ServiceNote) => void;
}

const NoteList: React.FC<NoteListProps> = ({ title, notes, onToggleFavorite, onDelete, onEdit }) => {
    if (notes.length === 0) return null;

    return (
        <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
            <div className="space-y-3">
                {notes.map(note => (
                    <div key={note.id} className={`p-4 rounded-lg border flex justify-between items-start ${note.is_favorite ? 'bg-yellow-50/70 border-yellow-200' : 'bg-white'}`}>
                        <div>
                            <p className="font-semibold text-gray-600">{note.service_name}</p>
                            <p className="text-gray-700 pr-4 my-1">{note.note}</p>
                            <p className="text-xs text-gray-400 mt-2">Por {note.professional_name} - {new Date(note.created_at).toLocaleString('es-ES')}</p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                            <button onClick={() => onEdit(note)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                <PencilIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onDelete(note.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                <TrashIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onToggleFavorite(note.id, note.is_favorite)} className="p-1 text-gray-400 hover:text-yellow-500 transition-colors">
                                <StarIcon className={`h-5 w-5 ${note.is_favorite ? 'text-yellow-400' : ''}`} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ServiceNotesView;
