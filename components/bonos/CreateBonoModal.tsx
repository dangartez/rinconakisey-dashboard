import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

interface Service {
  id: number;
  name: string;
  price: number;
}

interface CreateBonoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const CreateBonoModal: React.FC<CreateBonoModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [bonoType, setBonoType] = useState<'special' | 'five_plus_one'>('special');
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [totalSessions, setTotalSessions] = useState('1');
  const [selectedServices, setSelectedServices] = useState<number[]>([]);
  const [singleService, setSingleService] = useState<string>('');

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
      // Reset form on open
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName('');
    setPrice('0');
    setTotalSessions('1');
    setSelectedServices([]);
    setSingleService('');
    setBonoType('special');
  }

  const handleBonoTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'special' | 'five_plus_one';
    setBonoType(type);
    // Reset fields when type changes
    setName('');
    setPrice('0');
    setTotalSessions(type === 'special' ? '1' : '6');
    setSelectedServices([]);
    setSingleService('');
  };

  const handleSingleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSingleService(serviceId);
    if (serviceId) {
      const service = services.find(s => s.id === parseInt(serviceId));
      if (service) {
        setName(`Bono 5+1 ${service.name}`);
        setPrice((service.price * 5).toString());
        setSelectedServices([service.id]);
      }
    } else {
      setName('');
      setPrice('0');
      setSelectedServices([]);
    }
  };

  const handleMultiServiceChange = (serviceId: number) => {
    setSelectedServices(prev => 
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleSave = async () => {
    // Validation
    if (!name.trim() || parseFloat(price) <= 0 || parseInt(totalSessions) <= 0 || selectedServices.length === 0) {
        alert('Por favor, completa todos los campos requeridos.');
        return;
    }

    const payload = {
        p_name: name,
        p_type: bonoType,
        p_price: parseFloat(price),
        p_total_sessions: parseInt(totalSessions),
        p_service_ids: selectedServices
    };

    const { error } = await supabase.rpc('create_bono_definition', payload);

    if (error) {
        console.error('Error creating bono:', error);
        alert(`Error: ${error.message}`);
    } else {
        alert('¡Bono creado con éxito!');
        onSaveSuccess(); // This will trigger a refetch in the parent
        onClose(); // Close the modal
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-start pt-16 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-3xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Crear Nuevo Bono</h2>
        
        {isLoading ? <p>Cargando...</p> : (
            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Bono</label>
                    <select value={bonoType} onChange={handleBonoTypeChange} className="w-full p-2 border border-gray-300 rounded-md">
                        <option value="special">Especial (Personalizado)</option>
                        <option value="five_plus_one">5+1</option>
                    </select>
                </div>

                <div className="border-t border-gray-200 pt-6 space-y-6">
                    {bonoType === 'five_plus_one' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona el Servicio para el 5+1</label>
                            <select value={singleService} onChange={handleSingleServiceChange} className="w-full p-2 border border-gray-300 rounded-md">
                                <option value="">-- Elige un servicio --</option>
                                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Servicios Incluidos</label>
                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2 grid grid-cols-2 gap-2">
                                {services.map(s => (
                                    <label key={s.id} className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100">
                                        <input type="checkbox" checked={selectedServices.includes(s.id)} onChange={() => handleMultiServiceChange(s.id)} className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500" />
                                        <span>{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Bono</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} disabled={bonoType === 'five_plus_one'} className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Precio Total (€)</label>
                            <input type="number" value={price} onChange={e => setPrice(e.target.value)} disabled={bonoType === 'five_plus_one'} className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Sesiones Totales</label>
                            <input type="number" value={totalSessions} onChange={e => setTotalSessions(e.target.value)} disabled={bonoType === 'five_plus_one'} className="w-full p-2 border border-gray-300 rounded-md disabled:bg-gray-100" />
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-end space-x-4 mt-8">
          <button onClick={onClose} className="bg-gray-200 text-gray-800 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-300 transition-colors">Cancelar</button>
          <button onClick={handleSave} className="bg-pink-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors">Guardar Bono</button>
        </div>
      </div>
    </div>
  );
};

export default CreateBonoModal;
