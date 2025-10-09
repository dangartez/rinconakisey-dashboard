import React, { useState, useEffect } from 'react';
import { Appointment, Client, Service, Professional } from '../../types';
import ComboBox from '../ui/ComboBox';

interface TpvEditAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedAppointment: Appointment) => void;
  appointment: Appointment | null;
  clients: Client[];
  services: Service[];
  professionals: Professional[];
}

const TpvEditAppointmentModal: React.FC<TpvEditAppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  appointment,
  clients,
  services,
  professionals,
}) => {
  // Form State
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  // Effect to initialize form when appointment data is available
  useEffect(() => {
    if (appointment) {
      const startDate = new Date(appointment.start_time);
      
      const year = startDate.getFullYear();
      const month = (startDate.getMonth() + 1).toString().padStart(2, '0');
      const day = startDate.getDate().toString().padStart(2, '0');
      
      const hours = startDate.getHours().toString().padStart(2, '0');
      const minutes = startDate.getMinutes().toString().padStart(2, '0');

      setSelectedClient(appointment.client);
      setSelectedService(appointment.service);
      setSelectedProfessionalId(appointment.professional.id);
      setDate(`${year}-${month}-${day}`);
      setTime(`${hours}:${minutes}`);
      setError('');
    }
  }, [appointment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment || !selectedClient || !selectedService || !selectedProfessionalId || !date || !time) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    const professional = professionals.find(p => p.id === selectedProfessionalId);
    if (!professional) {
        setError('Profesional inválido.');
        return;
    }

    const newStartTime = new Date(`${date}T${time}`);
    const newEndTime = new Date(newStartTime.getTime() + selectedService.duration * 60000);

    const updatedAppointment: Appointment = {
      ...appointment,
      client: selectedClient,
      service: selectedService,
      professional,
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
    };

    onSave(updatedAppointment);
  };

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300 animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Editar Servicio Pendiente</h2>
            <div className="space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                <ComboBox 
                    items={clients}
                    selectedValue={selectedClient}
                    onSelect={(item) => setSelectedClient(item as Client | null)}
                    placeholder="Buscar cliente..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Servicio</label>
                <ComboBox 
                    items={services}
                    selectedValue={selectedService}
                    onSelect={(item) => setSelectedService(item as Service | null)}
                    placeholder="Buscar servicio..."
                />
              </div>

              <div>
                <label htmlFor="professional-select" className="block text-sm font-medium text-gray-700 mb-1">Profesional</label>
                <select 
                  id="professional-select" 
                  value={selectedProfessionalId} 
                  onChange={e => setSelectedProfessionalId(e.target.value)} 
                  className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  {professionals.map(pro => <option key={pro.id} value={pro.id}>{pro.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="appointment-date" className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                  <input 
                    type="date" 
                    id="appointment-date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" 
                  />
                </div>
                <div>
                  <label htmlFor="appointment-time" className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                  <input 
                    type="time" 
                    id="appointment-time" 
                    value={time} 
                    onChange={e => setTime(e.target.value)} 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white" 
                  />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-pink-600 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TpvEditAppointmentModal;
