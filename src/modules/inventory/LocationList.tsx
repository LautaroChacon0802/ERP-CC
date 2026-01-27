import React from 'react';
import { useStockManager } from '../../hooks/useStockManager';
import { MapPin, Box, Loader2 } from 'lucide-react';

interface Props {
    onSelectLocation: (locationId: string) => void;
}

const LocationList: React.FC<Props> = ({ onSelectLocation }) => {
    const { locations, isLoading } = useStockManager();

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64 text-gray-400">
                <Loader2 className="animate-spin mr-2" /> Cargando ubicaciones...
            </div>
        );
    }

    if (locations.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                <MapPin size={48} className="mx-auto mb-2 opacity-20" />
                <p>No hay ubicaciones registradas.</p>
            </div>
        );
    }

    return (
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
                    
                    <div className="space-y-2 border-t border-gray-100 pt-4">
                        {loc.capacity_meta && Object.entries(loc.capacity_meta).map(([key, val]) => (
                            <div key={key} className="flex justify-between text-sm text-gray-600">
                                <span className="capitalize">{key}:</span>
                                <span className="font-medium text-gray-900">{val}</span>
                            </div>
                        ))}
                        {(!loc.capacity_meta || Object.keys(loc.capacity_meta).length === 0) && (
                            <p className="text-xs text-gray-400 italic">Sin detalles de capacidad.</p>
                        )}
                    </div>

                    <button className="w-full mt-4 py-2 bg-gray-50 text-gray-700 text-sm font-bold rounded-lg group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                        Gestionar Stock
                    </button>
                </div>
            ))}
        </div>
    );
};

export default LocationList;