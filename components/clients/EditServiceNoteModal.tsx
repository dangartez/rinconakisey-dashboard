import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface ServiceNote {
    id: number;
    note: string;
}

interface EditServiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: ServiceNote | null;
  onNoteUpdated: () => void;
}

const EditServiceNoteModal: React.FC<EditServiceNoteModalProps> = ({ isOpen, onClose, note, onNoteUpdated }) => {
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setNoteContent(note.note);
    } else {
      setNoteContent('');
    }
  }, [note]);

  if (!isOpen || !note) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('sale_items')
      .update({ notes: noteContent })
      .eq('id', note.id);
    
    setIsSaving(false);
    if (error) {
      alert(`Error al actualizar la nota: ${error.message}`);
    } else {
      onNoteUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Editar Nota de Servicio</h2>
          <textarea
            rows={5}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
        </div>
        <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-8 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditServiceNoteModal;
