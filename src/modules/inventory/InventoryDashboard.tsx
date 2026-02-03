import React, { useEffect, useState } from 'react';
import { InventoryItem, InventoryLocation, DashboardMetrics } from '../../types';
import { useStockMovements } from '../../hooks/useStockMovements';
import { InventoryService } from '../../api/inventory';
import { Package, MapPin, AlertTriangle, Activity, ArrowRight } from 'lucide-react';

interface Props {
    // Props opcionales para compatibilidad, pero el dashboard ahora es autónomo en datos
    items?: InventoryItem[]; 
    locations?: InventoryLocation[];
    onNavigate: (view: any) => void;
}

const InventoryDashboard: React.FC<Props> = ({ onNavigate }) => {
    const { movements, loadMovements, isLoading: loadingMoves } = useStockMovements();
    
    // Estado local para métricas optimizadas
    const [metrics, setMetrics] = useState<DashboardMetrics>({ 
        totalItems: 0, 
        totalLocations: 0, 
        alertCount: 0 
    });
    const [recentMoves, setRecentMoves] = useState<any[]>([]);

    useEffect(() => {
        // 1. Cargar métricas ligeras (COUNTs)
        InventoryService.getDashboardMetrics()
            .then(setMetrics)
            .catch(err => console.error("Error loading metrics:", err));
        
        // 2. Cargar últimos movimientos
        loadMovements();
    }, [loadMovements]);

    useEffect(() => {
        if (movements.length > 0) {
            setRecentMoves(movements.slice(0, 5));
        }
    }, [movements]);

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div 
                    onClick={() => onNavigate('CATALOG')} 
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Package size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-800">{metrics.totalItems}</span>
                    </div>
                    <h3 className="font-bold text-gray-700">Artículos en Catálogo</h3>
                    <p className="text-sm text-gray-500 mt-1">Total de SKUs registrados</p>
                </div>

                <div 
                    onClick={() => onNavigate('LOCATIONS_LIST')} 
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-100 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <MapPin size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-800">{metrics.totalLocations}</span>
                    </div>
                    <h3 className="font-bold text-gray-700">Ubicaciones Activas</h3>
                    <p className="text-sm text-gray-500 mt-1">Depósitos y puntos de venta</p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
                            <AlertTriangle size={24} />
                        </div>
                        <span className="text-3xl font-black text-gray-800">{metrics.alertCount}</span>
                    </div>
                    <h3 className="font-bold text-gray-700">Items con Alertas</h3>
                    <p className="text-sm text-gray-500 mt-1">Configurados con stock mínimo</p>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Activity size={18} className="text-gray-500" />
                        Actividad Reciente
                    </h3>
                    <button 
                        onClick={() => onNavigate('HISTORY')}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        Ver todo <ArrowRight size={12} />
                    </button>
                </div>
                
                <div className="divide-y divide-gray-100">
                    {loadingMoves && recentMoves.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Cargando actividad...</div>
                    ) : recentMoves.length > 0 ? (
                        recentMoves.map(mov => (
                            <div key={mov.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${
                                        mov.type === 'IN' ? 'bg-green-500' : 
                                        mov.type === 'OUT' ? 'bg-red-500' : 'bg-blue-500'
                                    }`}></div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">
                                            {mov.item?.name || 'Ítem desconocido'} 
                                            <span className="font-normal text-gray-500"> ({mov.quantity})</span>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {mov.type === 'MOVE' 
                                                ? `De ${mov.from?.name} a ${mov.to?.name}`
                                                : `${mov.type === 'IN' ? 'Alta en' : 'Baja en'} ${mov.to?.name || mov.from?.name || 'Sistema'}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-600">{new Date(mov.created_at).toLocaleDateString()}</p>
                                    <p className="text-[10px] text-gray-400">{new Date(mov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-400 text-sm">No hay movimientos recientes.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InventoryDashboard;