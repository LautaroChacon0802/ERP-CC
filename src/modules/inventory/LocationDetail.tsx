import React, { useEffect, useState, useCallback } from 'react';
import { InventoryService } from '../../api/inventory';
import { InventoryStock } from '../../types';
import { ArrowLeft, Loader2, Plus, Minus, PackagePlus, AlertCircle, ArrowRightLeft, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useStockManager } from '../../hooks/useStockManager';
import { useStockMovements } from '../../hooks/useStockMovements';
import { useAuth } from '../../contexts/AuthContext';
import AddItemToLocationModal from './AddItemToLocationModal';

interface Props {
    locationId: string;
    onBack: () => void;
}

const LocationDetail: React.FC<Props> = ({ locationId, onBack }) => {
    const { notify } = useToast();
    const { user } = useAuth(); // Necesario para el log
    const { locations } = useStockManager();
    const { registerTransfer } = useStockMovements();

    const [stock, setStock] = useState<InventoryStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [locationName, setLocationName] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    const [transferItem, setTransferItem] = useState<any>(null);
    const [transferQty, setTransferQty] = useState(1);
    const [targetLocationId, setTargetLocationId] = useState('');

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const locs = await InventoryService.fetchLocations();
            const currentLoc = locs.find(l => l.id === locationId);
            if (currentLoc) setLocationName(currentLoc.name);

            const stockData = await InventoryService.fetchStockByLocation(locationId);
            setStock(stockData);
        } catch (error) {
            console.error(error);
            notify("Error cargando datos", "error");
        } finally {
            setIsLoading(false);
        }
    }, [locationId, notify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUpdateStock = async (itemId: string, delta: number) => {
        if (!user?.id) {
            notify("Error de sesión: Usuario no identificado", "error");
            return;
        }

        setIsUpdating(itemId);
        try {
            // FIX: Usar adjustStockWithLog para trazabilidad
            const newQty = await InventoryService.adjustStockWithLog(
                locationId, 
                itemId, 
                delta, 
                user.id, 
                'Ajuste rápido manual'
            );

            setStock(prev => {
                const idx = prev.findIndex(s => s.item_id === itemId);
                if (idx >= 0) {
                    const newStock = [...prev];
                    newStock[idx] = { ...newStock[idx], quantity: newQty };
                    return newStock;
                }
                return prev;
            });
        } catch (error) {
            notify("Error al actualizar stock", "error");
        } finally {
            setIsUpdating(null);
        }
    };

    // Callback para el modal de alta inicial
    const handleAddItem = async (itemId: string, quantity: number) => {
        if (!user?.id) return;
        try {
            // FIX: Usar adjustStockWithLog para alta inicial
            await InventoryService.adjustStockWithLog(
                locationId,
                itemId,
                quantity, // Cantidad positiva = IN
                user.id,
                'Alta inicial en ubicación'
            );
            
            notify("Ítem agregado exitosamente", "success");
            loadData();
        } catch (error) {
            console.error(error);
            notify("Error al agregar ítem", "error");
        }
    };

    const openTransferModal = (item: any) => {
        setTransferItem(item);
        setTransferQty(1);
        setTargetLocationId('');
        setIsTransferModalOpen(true);
    };

    const handleTransfer = async () => {
        if (!transferItem || !targetLocationId || transferQty <= 0) {
            notify("Datos incompletos", "warning");
            return;
        }
        if (transferQty > transferItem.quantity) {
            notify("Stock insuficiente", "error");
            return;
        }

        setIsUpdating(transferItem.item_id);
        try {
            const success = await registerTransfer(
                transferItem.item_id,
                locationId,
                targetLocationId,
                transferQty,
                user?.id || ''
            );

            if (success) {
                notify("Traslado registrado", "success");
                setIsTransferModalOpen(false);
                loadData();
            } else {
                notify("Error al trasladar", "error");
            }
        } catch (e) {
            notify("Error de conexión", "error");
        } finally {
            setIsUpdating(null);
        }
    };

    if (isLoading && !stock.length) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Loader2 className="animate-spin mb-4" size={48} />
                <p>Cargando inventario...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{locationName || 'Ubicación'}</h2>
                        <p className="text-sm text-gray-500">Control de Existencias</p>
                    </div>
                </div>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-all"
                >
                    <PackagePlus size={18} /> Agregar Ítem
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {stock.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Artículo</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Cantidad</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stock.map((item) => (
                                <tr key={item.item_id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{item.item?.name}</div>
                                        {item.item?.sku && <div className="text-xs text-gray-400 font-mono">{item.item.sku}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md border border-gray-200">
                                            {item.item?.category}
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
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                                            ><Minus size={16} /></button>
                                            <button 
                                                onClick={() => handleUpdateStock(item.item_id, 1)}
                                                disabled={isUpdating === item.item_id}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-200 disabled:opacity-50"
                                            ><Plus size={16} /></button>
                                            <div className="w-px h-6 bg-gray-300 mx-2"></div>
                                            <button 
                                                onClick={() => openTransferModal(item)}
                                                disabled={isUpdating === item.item_id || item.quantity <= 0}
                                                className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-100 text-xs font-bold disabled:opacity-50"
                                            >
                                                <ArrowRightLeft size={14} /> Mover
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
                        <p>No hay stock asignado.</p>
                        <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-blue-600 underline">Agregar primer ítem</button>
                    </div>
                )}
            </div>

            {/* Modales */}
            {isTransferModalOpen && transferItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2"><ArrowRightLeft size={18}/> Trasladar Stock</h3>
                            <button onClick={() => setIsTransferModalOpen(false)}><X size={18}/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Artículo</label>
                                <div className="font-bold text-gray-800">{transferItem.item?.name}</div>
                                <div className="text-xs text-gray-500">Disponible: {transferItem.quantity}</div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad a Mover</label>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={transferItem.quantity}
                                    value={transferQty}
                                    onChange={(e) => setTransferQty(Math.min(parseInt(e.target.value) || 0, transferItem.quantity))}
                                    className="w-full border-gray-300 rounded-lg p-2 text-lg font-bold"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Destino</label>
                                <select 
                                    value={targetLocationId}
                                    onChange={(e) => setTargetLocationId(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg p-2"
                                >
                                    <option value="">Seleccionar Ubicación...</option>
                                    {locations.filter(l => l.id !== locationId).map(loc => (
                                        <option key={loc.id} value={loc.id}>{loc.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={handleTransfer}
                                disabled={!targetLocationId || transferQty <= 0}
                                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 shadow-md"
                            >
                                Confirmar Traslado
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AddItemToLocationModal 
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddItem}
                locationName={locationName}
            />
        </div>
    );
};

export default LocationDetail;