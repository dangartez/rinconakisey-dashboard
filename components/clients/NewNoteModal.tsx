import React, { useState, useEffect } from 'react';
import { Professional } from '../../types';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: { content: string; is_favorite: boolean; professional_id: string }) => void;
  clientName: string;
  professionals: Professional[];
}

const NewNoteModal: React.FC<NewNoteModalProps> = ({ isOpen, onClose, onSave, clientName, professionals }) => {
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // If professionals are available, default to the first one
      if (professionals.length > 0) {
        setSelectedProfessionalId(professionals[0].id);
      }
    } else {
      // Reset state when modal closes
      setTimeout(() => {
        setContent('');
        setIsFavorite(false);
        setSelectedProfessionalId('');
        setError('');
      }, 200);
    }
  }, [isOpen, professionals]);

  const handleSave = () => {
    if (!content.trim()) {
      setError('El contenido de la nota no puede estar vacío.');
      return;
    }
    if (!selectedProfessionalId) {
      setError('Debes seleccionar un profesional.');
      return;
    }
    onSave({ content, is_favorite: isFavorite, professional_id: selectedProfessionalId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-scaleUp" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nueva Nota</h2>
          <p className="text-gray-500 mb-6">Para el cliente: <span className="font-semibold text-gray-700">{clientName}</span></p>
          
          <div className="space-y-4">
            <div>
                <label htmlFor="professional-select-note" className="block text-sm font-medium text-gray-700 mb-1">Autor de la nota</label>
                <select 
                  id="professional-select-note" 
                  value={selectedProfessionalId} 
                  onChange={e => setSelectedProfessionalId(e.target.value)} 
                  className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
                </select>
            </div>
            <div>
              <label htmlFor="note-content" className="block text-sm font-medium text-gray-700 mb-1">Contenido de la nota</label>
              <textarea
                id="note-content"
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe aquí los detalles importantes..."
              />
            </div>
            <div className="flex items-center">
              <input
                id="is-favorite"
                type="checkbox"
                className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                checked={isFavorite}
                onChange={(e) => setIsFavorite(e.target.checked)}
              />
              <label htmlFor="is-favorite" className="ml-2 block text-sm text-gray-900">Marcar como nota favorita</label>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
          <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={handleSave} className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">
            Guardar Nota
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewNoteModal;
