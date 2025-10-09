
import React from 'react';
import PageHeader from '../components/ui/PageHeader';

const ContabilidadPage: React.FC = () => {
  return (
    <div>
      <PageHeader title="Contabilidad" subtitle="Próximamente: Herramientas para gestionar la facturación y finanzas." />
      <div className="p-8 bg-white rounded-xl shadow-sm">
        <div className="text-center p-16 text-gray-500">
          <h3 className="text-2xl font-bold">En Construcción</h3>
          <p className="mt-2">Esta sección está siendo desarrollada y estará disponible pronto.</p>
        </div>
      </div>
    </div>
  );
};

export default ContabilidadPage;
