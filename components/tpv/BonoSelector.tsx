import React from 'react';

// Usaremos un tipo genérico por ahora, que coincida con lo que devuelve la DB.
interface Bono {
  id: number;
  name: string;
  price: number;
  // Añadimos más campos si son necesarios para la UI
}

interface BonoSelectorProps {
  bonos: Bono[];
  onBonoSelect: (bono: Bono) => void;
}

const BonoSelector: React.FC<BonoSelectorProps> = ({ bonos, onBonoSelect }) => {
  return (
    <div className="space-y-2">
      <input 
        type="text" 
        placeholder="Buscar bono por nombre..." 
        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 transition"
        // La lógica de búsqueda se puede añadir más adelante
      />
      <div className="max-h-60 overflow-y-auto">
        {bonos.map(bono => (
          <div 
            key={bono.id} 
            onClick={() => onBonoSelect(bono)}
            className="p-3 hover:bg-pink-50 rounded-lg cursor-pointer flex justify-between items-center"
          >
            <span className="font-medium text-gray-800">{bono.name}</span>
            <span className="text-gray-600 font-semibold">{bono.price} €</span>
          </div>
        ))}
        {bonos.length === 0 && (
            <p className='text-center text-gray-400 py-4'>No hay bonos para mostrar.</p>
        )}
      </div>
    </div>
  );
};

export default BonoSelector;
