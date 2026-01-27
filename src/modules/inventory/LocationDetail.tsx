import React, { useEffect, useState } from 'react';
import { InventoryService } from '../../api/inventory';
import { InventoryStock } from '../../types';
import { ArrowLeft, Loader2, Plus, Minus, PackagePlus, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

interface Props {
    locationId: string;
    onBack: () => void;
}

const LocationDetail: React.FC<Props> = ({ locationId, onBack }) => {
    const { notify } = useToast();
    const [stock, setStock] = useState<InventoryStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locationName, setLocationName] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Cargar datos iniciales
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Cargar nombre de ubicación (para el título)
                // (Podríamos pasarlo por props, pero es más seguro traerlo fresco si queremos persistencia futura)
                const locations = await InventoryService.fetchLocations();
                const currentLoc = locations.find(l => l.id === locationId);
                if (currentLoc) setLocationName(currentLoc.name);

                // 2. Cargar stock
                const stockData = await InventoryService.fetchStockByLocation(locationId);
                setStock(stockData);
            } catch (error) {
                console.error(error);
                notify("Error cargando datos de ubicación", "error");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [locationId]);

    const handleUpdateStock = async (itemId: string, delta: number) => {
        setIsUpdating(itemId);
        try {
            const newQty = await InventoryService.updateStock(locationId, itemId, delta);
            
            // Actualización optimista local
            setStock(prev => {
                const existingIndex = prev.findIndex(s => s.item_id === itemId);
                if (existingIndex >= 0) {
                    const newStock = [...prev];
                    newStock[existingIndex] = { ...newStock[existingIndex], quantity: newQty };
                    return newStock;
                }
                // Si no existía en la lista visual (caso raro si solo mostramos lo que hay), recargar
                return prev;
            });
            
            // Si el stock llegó a 0 y queremos quitarlo de la vista, podríamos filtrar aquí.
            // Por ahora lo dejamos en 0 para que el usuario vea que se agotó.

        } catch (error) {
            console.error(error);
            notify("Error al actualizar stock", "error");
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Cargando inventario...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header Detalle */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{locationName || 'Ubicación'}</h2>
                        <p className="text-sm text-gray-500">Control de Existencias</p>
                    </div>
                </div>
                <button 
                    onClick={() => notify("Funcionalidad 'Agregar Nuevo Ítem' en construcción", "info")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                    <PackagePlus size={18} />
                    Agregar Ítem
                </button>
            </div>

            {/* Tabla de Stock */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {stock.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Artículo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Cantidad</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones R rápidas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stock.map((item) => (
                                <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{item.item?.name || 'Ítem Desconocido'}</div>
                                        {item.item?.sku && <div className="text-xs text-gray-400 font-mono">{item.item.sku}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md border border-gray-200">
                                            {item.item?.category || 'GENERAL'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-lg font-bold ${item.quantity < (item.item?.min_stock || 0) ? 'text-red-600' : 'text-gray-900'}`}>
                                            {item.quantity}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => handleUpdateStock(item.item_id, -1)}
                                                disabled={isUpdating === item.item_id || item.quantity <= 0}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                title="Restar 1"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateStock(item.item_id, 1)}
                                                disabled={isUpdating === item.item_id}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                                title="Sumar 1"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-12 text-center text-gray-400">
                        <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
                        <p className="text-lg font-medium">Esta ubicación no tiene stock asignado.</p>
                        <p className="text-sm">Usa el botón "Agregar Ítem" para comenzar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationDetail;