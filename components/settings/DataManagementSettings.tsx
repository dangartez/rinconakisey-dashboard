import React, { useRef } from 'react';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from '../icons/Icons';

const DataManagementSettings: React.FC = () => {
    const importRef = useRef<HTMLInputElement>(null);

    const handleExport = (dataType: string) => {
        alert(`Exportando ${dataType}... (simulado)`);
        // Real export logic would go here
    };
    
    const handleImportClick = () => {
        importRef.current?.click();
    };
    
    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            alert(`Importando clientes desde ${file.name}... (simulado)`);
            // Real import logic would go here
        }
    };
    
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Datos</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Exportar Datos</h3>
                    <p className="text-sm text-gray-500 mb-4">Descarga copias de seguridad de tu información en formato CSV.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <button onClick={() => handleExport('clientes')} className="flex items-center justify-center space-x-2 w-full bg-white p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                            <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-700">Exportar Clientes</span>
                        </button>
                         <button onClick={() => handleExport('citas')} className="flex items-center justify-center space-x-2 w-full bg-white p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                            <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-700">Exportar Citas</span>
                        </button>
                         <button onClick={() => handleExport('servicios')} className="flex items-center justify-center space-x-2 w-full bg-white p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                            <ArrowDownTrayIcon className="h-5 w-5 text-gray-500" />
                            <span className="font-medium text-gray-700">Exportar Servicios</span>
                        </button>
                    </div>
                </div>

                 <div className="pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">Importar Clientes</h3>
                    <p className="text-sm text-gray-500 mb-4">Añade clientes de forma masiva subiendo un archivo CSV.</p>
                    <input type="file" accept=".csv" ref={importRef} onChange={handleFileImport} className="hidden" />
                    <button onClick={handleImportClick} className="w-full max-w-sm flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        <ArrowUpTrayIcon className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-700">Seleccionar archivo CSV para importar</span>
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default DataManagementSettings;
