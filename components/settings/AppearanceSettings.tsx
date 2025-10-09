import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AppearanceSettings as AppearanceSettingsType } from '../../types';
import ToggleSwitch from '../ui/ToggleSwitch';

const colorOptions = {
    pink: { name: 'Rosa', class: 'bg-pink-500' },
    blue: { name: 'Azul', class: 'bg-blue-500' },
    green: { name: 'Verde', class: 'bg-green-500' },
    purple: { name: 'Púrpura', class: 'bg-purple-500' },
};

const AppearanceSettings: React.FC = () => {
    const [settings, setSettings] = useState<AppearanceSettingsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchAppearanceSettings = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('business_settings')
                .select('brand_color, theme_mode')
                .eq('id', 1)
                .single();

            if (error) {
                console.error("Error fetching appearance settings", error);
            } else {
                setSettings({
                    brandColor: data.brand_color,
                    mode: data.theme_mode,
                });
            }
            setIsLoading(false);
        };
        fetchAppearanceSettings();
    }, []);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        const updates = {
            brand_color: settings.brandColor,
            theme_mode: settings.mode,
        };

        const { error } = await supabase.from('business_settings').update(updates).eq('id', 1);
        
        setIsSaving(false);
        if (error) {
            alert('Error al guardar los ajustes.');
            console.error(error);
        } else {
            alert('Ajustes de apariencia guardados con éxito.');
        }
    };
    
    if (isLoading || !settings) {
        return <div>Cargando...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Personalización y Apariencia</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Color de la Marca</h3>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries(colorOptions).map(([key, value]) => (
                            <button
                                key={key}
                                onClick={() => setSettings(p => ({...p!, brandColor: key as any}))}
                                className={`flex items-center space-x-3 p-3 border-2 rounded-lg transition-colors ${settings.brandColor === key ? 'border-pink-500' : 'border-gray-200'}`}
                            >
                                <div className={`w-6 h-6 rounded-full ${value.class}`}></div>
                                <span className="font-medium text-gray-700">{value.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t">
                     <h3 className="text-lg font-semibold text-gray-700 mb-3">Modo de Visualización</h3>
                     <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                        <div>
                            <h4 className="font-medium text-gray-800">Modo Oscuro</h4>
                            <p className="text-sm text-gray-500">Reduce el brillo para una menor fatiga visual.</p>
                        </div>
                        <ToggleSwitch enabled={settings.mode === 'dark'} onChange={(val) => setSettings(p => ({...p!, mode: val ? 'dark' : 'light'}))} />
                     </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button onClick={handleSave} disabled={isSaving} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm disabled:bg-pink-300 disabled:cursor-wait">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AppearanceSettings;