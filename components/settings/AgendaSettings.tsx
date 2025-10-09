import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { AgendaSettings as AgendaSettingsType } from '../../types';
import ToggleSwitch from '../ui/ToggleSwitch';

const AgendaSettings: React.FC = () => {
    const [settings, setSettings] = useState<AgendaSettingsType | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchAgendaSettings = async () => {
            setIsLoading(true);
            const { data: settingsData, error: settingsError } = await supabase
                .from('business_settings')
                .select('default_interval, min_booking_notice_hours')
                .eq('id', 1)
                .single();

            const { data: hoursData, error: hoursError } = await supabase
                .from('business_hours')
                .select('*')
                .order('id');

            if (settingsError || hoursError) {
                console.error("Error fetching agenda settings", settingsError || hoursError);
            } else {
                setSettings({
                    defaultInterval: settingsData.default_interval,
                    minBookingNotice: settingsData.min_booking_notice_hours,
                    businessHours: hoursData.map(h => ({
                        day: h.day_name,
                        isOpen: h.is_open,
                        openTime: h.open_time_1 || '',
                        closeTime: h.close_time_1 || '',
                        openTime2: h.open_time_2 || '',
                        closeTime2: h.close_time_2 || '',
                    }))
                });
            }
            setIsLoading(false);
        };
        fetchAgendaSettings();
    }, []);

    const handleHourChange = (day: string, field: 'openTime' | 'closeTime' | 'openTime2' | 'closeTime2', value: string) => {
        if (!settings) return;
        setSettings(prev => ({
            ...prev!,
            businessHours: prev!.businessHours.map(h => h.day === day ? { ...h, [field]: value } : h)
        }));
    };

    const handleOpenToggle = (day: string, isOpen: boolean) => {
        if (!settings) return;
        setSettings(prev => ({
            ...prev!,
            businessHours: prev!.businessHours.map(h => h.day === day ? { ...h, isOpen } : h)
        }));
    };
    
    const handleIntervalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!settings) return;
        setSettings(prev => ({ ...prev!, defaultInterval: parseInt(e.target.value) as 15 | 30 | 60 }));
    };
    
    const handleNoticeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!settings) return;
        setSettings(prev => ({ ...prev!, minBookingNotice: parseInt(e.target.value) || 0 }));
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        const payload = {
            default_interval: settings.defaultInterval,
            min_booking_notice_hours: settings.minBookingNotice,
            business_hours: settings.businessHours.map((h, index) => ({
                id: index + 1,
                is_open: h.isOpen,
                open_time_1: h.openTime || null,
                close_time_1: h.closeTime || null,
                open_time_2: h.openTime2 || null,
                close_time_2: h.closeTime2 || null,
            }))
        };

        const { error } = await supabase.rpc('update_agenda_settings', { p_settings: payload });

        setIsSaving(false);
        if (error) {
            alert('Error al guardar los ajustes de la agenda.');
            console.error(error);
        } else {
            alert('Ajustes de agenda guardados con éxito.');
        }
    };

    if (isLoading || !settings) {
        return <div>Cargando...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Horarios y Reservas</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Horario Comercial</h3>
                    <div className="space-y-3">
                        {settings.businessHours.map(hour => (
                            <div key={hour.day} className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 p-3 rounded-lg bg-gray-50">
                                <span className="font-medium text-gray-800">{hour.day}</span>
                                <div className="flex items-center justify-center gap-x-4 gap-y-2 flex-wrap">
                                    {/* Morning Shift */}
                                    <div className="flex items-center space-x-2">
                                        <input type="time" value={hour.openTime} onChange={e => handleHourChange(hour.day, 'openTime', e.target.value)} disabled={!hour.isOpen} className="bg-white p-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-200" />
                                        <span>-</span>
                                        <input type="time" value={hour.closeTime} onChange={e => handleHourChange(hour.day, 'closeTime', e.target.value)} disabled={!hour.isOpen} className="bg-white p-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-200" />
                                    </div>
                                    {/* Afternoon Shift */}
                                    <div className="flex items-center space-x-2">
                                        <input type="time" value={hour.openTime2 || ''} onChange={e => handleHourChange(hour.day, 'openTime2', e.target.value)} disabled={!hour.isOpen} className="bg-white p-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-200" />
                                        <span>-</span>
                                        <input type="time" value={hour.closeTime2 || ''} onChange={e => handleHourChange(hour.day, 'closeTime2', e.target.value)} disabled={!hour.isOpen} className="bg-white p-1 border border-gray-300 rounded-md text-sm disabled:bg-gray-200" />
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                    <span className={`text-sm font-medium ${hour.isOpen ? 'text-green-600' : 'text-red-600'}`}>{hour.isOpen ? 'Abierto' : 'Cerrado'}</span>
                                    <ToggleSwitch enabled={hour.isOpen} onChange={(val) => handleOpenToggle(hour.day, val)} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                        <label htmlFor="defaultInterval" className="block text-sm font-medium text-gray-700 mb-1">Intervalo de tiempo por defecto</label>
                        <select id="defaultInterval" value={settings.defaultInterval} onChange={handleIntervalChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                            <option value="15">15 minutos</option>
                            <option value="30">30 minutos</option>
                            <option value="60">60 minutos</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="minBookingNotice" className="block text-sm font-medium text-gray-700 mb-1">Antelación mínima para reservas (horas)</label>
                        <input type="number" id="minBookingNotice" value={settings.minBookingNotice} onChange={handleNoticeChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
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

export default AgendaSettings;