import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface EditNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: { id: string; note: string } | null;
  onNoteUpdated: () => void;
}

const EditNoteModal: React.FC<EditNoteModalProps> = ({ isOpen, onClose, note, onNoteUpdated }) => {
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setNoteText(note.note);
    } else {
      setNoteText('');
    }
  }, [note]);

  const handleSave = async () => {
    if (!note) return;

    setIsSaving(true);
    const { error } = await supabase
      .from('client_notes')
      .update({ note: noteText })
      .eq('id', note.id);

    setIsSaving(false);

    if (error) {
      alert('Error al actualizar la nota. Inténtalo de nuevo.');
      console.error('Error updating note:', error);
    } else {
      onNoteUpdated();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="p-8 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Editar Nota</h2>
        </div>
        <div className="p-8">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition"
            placeholder="Escribe tu nota aquí..."
          />
        </div>
        <div className="bg-gray-100 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-4 border-t">
          <button type="button" onClick={onClose} disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} disabled={isSaving} className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:bg-pink-400">
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditNoteModal;
