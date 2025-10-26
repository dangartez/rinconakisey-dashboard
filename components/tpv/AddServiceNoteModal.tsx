import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';

interface SaleItemInfo {
  id: number;
  service_name: string;
}

interface AddServiceNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleItems: SaleItemInfo[];
}

type View = 'FORM' | 'PROMPT';

const AddServiceNoteModal: React.FC<AddServiceNoteModalProps> = ({ isOpen, onClose, saleItems }) => {
  const [view, setView] = useState<View>('FORM');
  const [selectedSaleItemId, setSelectedSaleItemId] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableServices, setAvailableServices] = useState<SaleItemInfo[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAvailableServices(saleItems);
      if (saleItems.length === 1) {
        setSelectedSaleItemId(saleItems[0].id);
      } else {
        setSelectedSaleItemId(null);
      }
      setNote('');
      setIsFavorite(false);
      setView('FORM'); // Reset view on open
    }
  }, [isOpen, saleItems]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!selectedSaleItemId) {
      showErrorToast('Por favor, selecciona un servicio.');
      return;
    }
    setIsSaving(true);
    const { error } = await supabase
      .from('sale_items')
      .update({ notes: note, is_favorite: isFavorite })
      .eq('id', selectedSaleItemId);

    setIsSaving(false);
    if (error) {
      showErrorToast(`Error al guardar la nota: ${error.message}`);
      return;
    }

    showSuccessToast('Nota guardada con éxito');

    const remainingServices = availableServices.filter(item => item.id !== selectedSaleItemId);

    if (remainingServices.length > 0) {
      setView('PROMPT'); // Si quedan servicios, preguntamos si quiere continuar
    } else {
      onClose(); // Si era el último, cerramos el modal directamente
    }
  };

  const handleContinue = () => {
    const remainingServices = availableServices.filter(item => item.id !== selectedSaleItemId);

    if (remainingServices.length > 0) {
      setAvailableServices(remainingServices);
      setNote('');
      setIsFavorite(false);
      setSelectedSaleItemId(remainingServices.length === 1 ? remainingServices[0].id : null);
      setView('FORM'); // Go back to the form
    } else {
      onClose(); // No more services left
    }
  };

  const handleStop = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-scaleUp" onClick={e => e.stopPropagation()}>
        {view === 'FORM' && (
          <>
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Añadir Nota de Servicio</h2>
              
              {availableServices.length > 1 ? (
                <div className="mb-4">
                  <label htmlFor="service-select" className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                  <select
                    id="service-select"
                    value={selectedSaleItemId || ''}
                    onChange={(e) => setSelectedSaleItemId(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="" disabled>Selecciona un servicio...</option>
                    {availableServices.map(item => (
                      <option key={item.id} value={item.id}>{item.service_name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-pink-50 rounded-lg">
                    <p className="text-sm font-medium text-pink-800">Nota para: <span className='font-bold'>{availableServices[0]?.service_name}</span></p>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="service-note" className="block text-sm font-medium text-gray-700 mb-1">Nota</label>
                <textarea
                  id="service-note"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Escribe aquí los detalles técnicos del servicio, como productos, colores, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  id="favorite-note"
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                />
                <label htmlFor="favorite-note" className="ml-2 block text-sm text-gray-900">
                  Marcar como nota favorita
                </label>
              </div>
            </div>

            <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
              <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={isSaving || !selectedSaleItemId}
                className="px-8 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? 'Guardando...' : 'Guardar Nota'}
              </button>
            </div>
          </>
        )}

        {view === 'PROMPT' && (
          <>
            <div className="p-8 text-center">
              {/* <h2 className="text-2xl font-bold text-gray-800 mb-4">Nota Guardada</h2> */}
              <p className="text-gray-600 my-4 text-lg">¿Quieres añadir otra nota?</p>
            </div>
            <div className="bg-gray-100 px-8 py-4 rounded-b-2xl flex justify-center items-center space-x-4">
              <button onClick={handleStop} className="px-8 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">NO</button>
              <button onClick={handleContinue} className="px-8 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors">SÍ</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddServiceNoteModal;

