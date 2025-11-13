import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

// Tipos de datos locales
interface Service {
  id: number;
  name: string;
  price: number;
}

interface Bono {
  id: number;
  name: string;
  type: 'five_plus_one' | 'special';
  price: number;
  total_sessions: number;
  services: Service[];
}

interface EditBonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  bonoToEdit: Bono | null;
}

const EditBonoModal: React.FC<EditBonoModalProps> = ({ isOpen, onClose, onSaveSuccess, bonoToEdit }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [totalSessions, setTotalSessions] = useState('1');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchServices = async () => {
        setIsLoading(true);
        const { data, error } = await supabase.from('services').select('id, name, price').order('name');
        if (error) console.error('Error fetching services:', error);
        else setServices(data || []);
        setIsLoading(false);
      };
      fetchServices();
    }
  }, [isOpen]);

  useEffect(() => {
    if (bonoToEdit) {
      setName(bonoToEdit.name);
      setPrice(bonoToEdit.price.toString());
      setTotalSessions(bonoToEdit.total_sessions.toString());
      setSelectedServices(bonoToEdit.services.map(s => s.id));
    } else {
      setName('');
      setPrice('0');
      setTotalSessions('1');
      setSelectedServices([]);
    }
  }, [bonoToEdit]);

  const handleMultiServiceChange = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    if (!bonoToEdit) return;

    if (!name.trim() || parseFloat(price) < 0 || parseInt(totalSessions) <= 0 || selectedServices.length === 0) {
        alert('Por favor, completa todos los campos requeridos. El precio no puede ser negativo.');
        return;
    }

    const payload = {
        p_bono_id: bonoToEdit.id,
        p_name: name,
        p_price: parseFloat(price),
        p_total_sessions: parseInt(totalSessions),
        p_service_ids: selectedServices
    };

    const { error } = await supabase.rpc('update_bono_definition', payload);

    if (error) {
        console.error('Error updating bono:', error);
        alert(`Error: ${error.message}`);
    } else {
        alert('¡Bono actualizado con éxito!');
        onSaveSuccess();
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Editar Bono</h2>
        
        {isLoading || !bonoToEdit ? <p>Cargando...</p> : (
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Bono</label>
                    <input type="text" value={bonoToEdit.type === 'five_plus_one' ? '5+1' : 'Especial'} disabled className="w-full p-2 border border-gray-300 rounded-md bg-gray-100" />
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Servicios Incluidos</label>
                        <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 grid grid-cols-2 gap-2">
                            {services.map(s => (
                                <label key={s.id} className={`flex items-center space-x-2 p-2 rounded-md ${bonoToEdit.type === 'five_plus_one' ? 'cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100'}`}>
                                    <input type="checkbox" checked={selectedServices.includes(s.id)} onChange={() => handleMultiServiceChange(s.id)} disabled={bonoToEdit.type === 'five_plus_one'} className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500 disabled:cursor-not-allowed" />
                                    <span>{s.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Bono</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Total (€)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Sesiones Totales</label>
                            <input type="number" value={totalSessions} onChange={e => setTotalSessions(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                    </div>
                    {bonoToEdit.type === 'five_plus_one' && <p className='text-xs text-gray-500 text-center'>Los bonos 5+1 no permiten modificar sus propiedades directamente. Para cambiar el precio o servicio, crea un nuevo bono de tipo 'Especial'.</p>}
                </div>
            </div>
        )}

        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors">Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

export default EditBonoModal;