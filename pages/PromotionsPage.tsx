import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { supabase } from '../lib/supabaseClient';
import { Promotion } from '../types';
import NewPromotionModal from '../components/promotions/NewPromotionModal';
import EditPromotionModal from '../components/promotions/EditPromotionModal';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { TrashIcon } from '../components/icons/Icons';
import ToggleSwitch from '../components/ui/ToggleSwitch';

type NewPromotionData = Omit<Promotion, 'id' | 'image'> & {
    imageFile?: File;
};

interface ConfirmationState {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmButtonColor?: 'pink' | 'red';
}

const PromotionsPage: React.FC = () => {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationState>({
        isOpen: false, title: '', message: '', onConfirm: () => {}
    });

    useEffect(() => {
        fetchPromotions();
    }, []);

    const fetchPromotions = async () => {
        const { data, error } = await supabase
            .from('promotions')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching promotions:', error);
        } else if (data) {
            const formattedData = data.map(p => ({
                ...p,
                image: p.image_url,
                originalPrice: p.original_price,
                promoPrice: p.promo_price,
                isActive: p.is_active,
            }));
            setPromotions(formattedData as Promotion[]);
        }
    };


    const handleAddPromotion = async (data: NewPromotionData) => {
        let imageUrl: string | undefined = undefined;

        if (data.imageFile) {
            const filePath = `${Date.now()}-${data.imageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('promotions')
                .upload(filePath, data.imageFile);

            if (uploadError) {
                alert(`Error al subir la imagen: ${uploadError.message}`);
                return;
            }
            const { data: urlData } = supabase.storage.from('promotions').getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
        }

        const { error: insertError } = await supabase.from('promotions').insert({
            title: data.title,
            description: data.description,
            original_price: data.originalPrice,
            promo_price: data.promoPrice,
            is_active: data.isActive,
            image_url: imageUrl,
        });

        if (insertError) {
            alert(`Error al crear la promoción: ${insertError.message}`);
        } else {
            fetchPromotions();
            setIsNewModalOpen(false);
        }
    };
    
    const handleEditClick = (promo: Promotion) => {
        setEditingPromotion(promo);
    };

    const handleUpdatePromotion = async (updatedPromotion: Promotion, newImageFile?: File) => {
        let imageUrl = updatedPromotion.image;

        if (newImageFile) {
            const filePath = `${Date.now()}-${newImageFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('promotions')
                .upload(filePath, newImageFile);

            if (uploadError) {
                alert(`Error al subir la nueva imagen: ${uploadError.message}`);
                return;
            }
            const { data: urlData } = supabase.storage.from('promotions').getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
            // Ideally, you would also delete the old image from storage here
        }

        const { error } = await supabase.from('promotions').update({
            title: updatedPromotion.title,
            description: updatedPromotion.description,
            original_price: updatedPromotion.originalPrice,
            promo_price: updatedPromotion.promoPrice,
            is_active: updatedPromotion.isActive,
            image_url: imageUrl,
        }).eq('id', updatedPromotion.id);

        if (error) {
            alert(`Error al actualizar la promoción: ${error.message}`);
        } else {
            fetchPromotions();
            setEditingPromotion(null);
        }
    };

    const handleDeleteClick = (promo: Promotion) => {
        setConfirmation({
            isOpen: true,
            title: 'Eliminar Promoción',
            message: `¿Estás seguro de que quieres eliminar "${promo.title}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                // First, delete the database record
                const { error } = await supabase.from('promotions').delete().eq('id', promo.id);

                if (error) {
                    alert(`Error al eliminar la promoción: ${error.message}`);
                } else {
                    // If DB deletion is successful, delete the image from storage
                    if (promo.image) {
                        const bucketName = 'promotions';
                        const urlParts = promo.image.split(`/${bucketName}/`);
                        if (urlParts.length > 1) {
                            const imagePath = urlParts[1];
                            await supabase.storage.from(bucketName).remove([imagePath]);
                        }
                    }
                    fetchPromotions();
                }
                setConfirmation({ isOpen: false, title: '', message: '', onConfirm: () => {} });
            },
            confirmButtonColor: 'red',
        });
    };

    const handleToggleStatus = async (promoId: number, newStatus: boolean) => {
        const { error } = await supabase
            .from('promotions')
            .update({ is_active: newStatus })
            .eq('id', promoId);

        if (error) {
            alert('Error al cambiar el estado.');
        } else {
            // Optimistic update in UI, or re-fetch
            setPromotions(promotions.map(p => p.id === promoId ? { ...p, isActive: newStatus } : p));
        }
    };

    return (
        <>
            <div>
                <PageHeader 
                    title="Promociones"
                    subtitle="Crea y gestiona ofertas especiales para tus clientes"
                />
                <div className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Promociones</h2>
                        <button 
                            onClick={() => setIsNewModalOpen(true)}
                            className="bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-700 transition-colors">
                            Crear Promoción
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b-2 border-gray-100">
                                <tr>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Imagen</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Título</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Descripción</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Precio Original</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Precio Promoción</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Estado</th>
                                    <th className="p-4 text-sm font-semibold text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {promotions.map(promo => (
                                    <tr key={promo.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 align-middle">
                                        <td className="p-4">
                                            <img src={promo.image} alt={promo.title} className="h-12 w-12 rounded-md object-cover" />
                                        </td>
                                        <td className="p-4 text-gray-800 font-medium">{promo.title}</td>
                                        <td className="p-4 text-gray-600 max-w-xs">{promo.description}</td>
                                        <td className="p-4 text-gray-600 line-through">{promo.originalPrice}€</td>
                                        <td className="p-4 text-green-600 font-bold">{promo.promoPrice}€</td>
                                        <td className="p-4">
                                            <ToggleSwitch 
                                                enabled={promo.isActive}
                                                onChange={(newStatus) => handleToggleStatus(promo.id, newStatus)}
                                            />
                                        </td>
                                        <td className="p-4 whitespace-nowrap space-x-4 flex items-center">
                                            <button onClick={() => handleEditClick(promo)} className="text-pink-600 hover:underline text-sm font-medium">Editar</button>
                                            <button onClick={() => handleDeleteClick(promo)} className="text-gray-500 hover:text-red-600 p-1 rounded-full transition-colors" aria-label={`Eliminar ${promo.title}`}>
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <NewPromotionModal 
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                onSave={handleAddPromotion}
            />
            {editingPromotion && (
                 <EditPromotionModal
                    isOpen={!!editingPromotion}
                    onClose={() => setEditingPromotion(null)}
                    onSave={handleUpdatePromotion}
                    promotion={editingPromotion}
                />
            )}
             <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation({ ...confirmation, isOpen: false })}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                confirmButtonColor={confirmation.confirmButtonColor}
            />
        </>
    );
};

export default PromotionsPage;