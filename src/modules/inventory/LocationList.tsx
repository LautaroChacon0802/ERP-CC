import React, { useState } from 'react';
import { useStockManager } from '../../hooks/useStockManager';
import { MapPin, Box, Loader2, Plus, X } from 'lucide-react';
import { InventoryService } from '../../api/inventory';
import { useToast } from '../../contexts/ToastContext';

interface Props {
    onSelectLocation: (locationId: string) => void;
}

const LocationList: React.FC<Props> = ({ onSelectLocation }) => {
    const { locations, isLoading, loadLocations } = useStockManager();
    const { notify } = useToast();
    
    // Estado Modal Creación
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newLocName, setNewLocName] = useState('');
    const [newLocType, setNewLocType] = useState<'CABIN' | 'DEPOSIT' | 'COMMON_AREA'>('CABIN');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateLocation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLocName) return;
        
        setIsCreating(true);
        try {
            await InventoryService.createLocation(newLocName, newLocType);
            notify("Ubicación creada exitosamente", "success");
            setIsCreateModalOpen(false);
            setNewLocName('');
            loadLocations(); // Recargar lista
        } catch (error) {
            console.error(error);
            notify("Error al crear ubicación", "error");
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading && locations.length === 0) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-400">
                <Loader2 className="animate-spin mr-2" /> Cargando ubicaciones...
            </div>
        );
    }

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {locations.map(loc => (
                    <div 
                        key={loc.id} 
                        onClick={() => onSelectLocation(loc.id)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-3 rounded-lg ${
                                    loc.type === 'DEPOSIT' ? 'bg-orange-100 text-orange-600' :
                                    loc.type === 'CABIN' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-teal-100 text-teal-600'
                                }`}>
                                    {loc.type === 'DEPOSIT' ? <Box size={24} /> : <MapPin size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{loc.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">{loc.type}</p>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-4 py-2 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                            Gestionar Stock
                        </button>
                    </div>
                ))}

                {/* Card "Nueva Ubicación" */}
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all min-h-[180px]"
                >
                    <Plus size={32} className="mb-2" />
                    <span className="font-bold">Nueva Ubicación</span>
                </button>
            </div>

            {/* Modal Creación */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Nueva Ubicación</h3>
                            <button onClick={() => setIsCreateModalOpen(false)}><X size={20}/></button>
                        </div>
                        <form onSubmit={handleCreateLocation} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                <input 
                                    type="text" required
                                    value={newLocName}
                                    onChange={e => setNewLocName(e.target.value)}
                                    className="w-full border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ej: Cabaña 05"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                <select 
                                    value={newLocType}
                                    onChange={e => setNewLocType(e.target.value as any)}
                                    className="w-full border-gray-300 rounded-lg p-2"
                                >
                                    <option value="CABIN">Cabaña</option>
                                    <option value="DEPOSIT">Depósito / Pañol</option>
                                    <option value="COMMON_AREA">Área Común (SPA/Gym)</option>
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isCreating || !newLocName}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center"
                            >
                                {isCreating ? <Loader2 className="animate-spin" /> : 'Crear Ubicación'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationList;