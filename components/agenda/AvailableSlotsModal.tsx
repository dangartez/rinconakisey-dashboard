
import React, { useState } from 'react';
import { XMarkIcon } from '../icons/Icons';

interface AvailableSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupedSlots: { [key: string]: { time: string; professional_id: string }[] };
  handleSelectDateTime: (date: Date, time: string, professional_id: string) => void;
  isLoading: boolean;
}

const AvailableSlotsModal: React.FC<AvailableSlotsModalProps> = ({ isOpen, onClose, groupedSlots, handleSelectDateTime, isLoading }) => {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 md:p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <div 
        className="bg-white md:rounded-lg shadow-xl w-full h-full md:max-w-lg md:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-secondary">Horas Disponibles</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {isLoading ? (
            <div className="text-center p-8">Buscando todas las horas disponibles...</div>
          ) : Object.keys(groupedSlots).length === 0 ? (
            <div className="text-center p-8 text-gray-500">No se han encontrado citas disponibles en la franja seleccionada.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSlots).map(([dateString, slots]) => (
                <div key={dateString}>
                  <h3 className="font-bold text-secondary text-lg mb-3 sticky top-0 bg-white py-2">
                    {new Date(dateString + 'T00:00:00Z').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {(slots as { time: string; professional_id: string }[]).map(({ time, professional_id }) => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTimeSlot(time); // Mark this time slot as selected
                          handleSelectDateTime(new Date(dateString + 'T00:00:00Z'), time, professional_id);
                          onClose(); // Close modal on selection
                        }}
                        className={`px-4 py-3 rounded-lg font-semibold transition ${selectedTimeSlot === time ? 'bg-pink-300 bg-opacity-70 text-pink-800' : 'bg-pink-600 text-white hover:bg-pink-700'}`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t text-right">
          <button 
            onClick={onClose}
            className="bg-gray-200 text-secondary py-2 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailableSlotsModal;
