import React, { useState } from 'react';
import { useStockManager } from '../../hooks/useStockManager';
import { Package, MapPin, Plus, Search, Filter, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LocationList from './LocationList';
import LocationDetail from './LocationDetail';

// Tipos de vista extendidos
type InventoryView = 'CATALOG' | 'LOCATIONS_LIST' | 'LOCATION_DETAIL';

const InventoryModule: React.FC = () => {
  const navigate = useNavigate();
  const { items, isLoading } = useStockManager();
  
  // Estado de navegación interna
  const [currentView, setCurrentView] = useState<InventoryView>('CATALOG');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado simple para el catálogo
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers de Navegación
  const handleSelectLocation = (id: string) => {
      setSelectedLocationId(id);
      setCurrentView('LOCATION_DETAIL');
  };

  const handleBackToLocations = () => {
      setSelectedLocationId(null);
      setCurrentView('LOCATIONS_LIST');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* HEADER */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                    <Package size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Gestión de Inventario</h1>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button 
                onClick={() => setCurrentView('CATALOG')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'CATALOG' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Catálogo Maestro
            </button>
            <button 
                onClick={() => setCurrentView(selectedLocationId ? 'LOCATION_DETAIL' : 'LOCATIONS_LIST')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView !== 'CATALOG' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Ubicaciones
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* VISTA CATÁLOGO (Mantengo código previo, simplificado visualmente aquí) */}
        {currentView === 'CATALOG' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                {/* Actions Bar */}
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar por nombre, SKU o categoría..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
                            <Filter size={18} /> Filtros
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">
                            <Plus size={18} /> Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {isLoading ? (
                        <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                            <Loader2 className="animate-spin mb-2" size={32} />
                            <p>Cargando inventario...</p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoría</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Mínimo</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{item.sku || '-'}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                            {item.description && <p className="text-xs text-gray-400">{item.description}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded border border-blue-100">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {item.is_serialized ? 'Unitario' : 'Granel'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">
                                            {item.min_stock}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-12 text-center text-gray-400">
                            <Package size={48} className="mx-auto mb-3 opacity-20" />
                            <p>No se encontraron productos.</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* VISTAS DE UBICACIONES */}
        {currentView === 'LOCATIONS_LIST' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <LocationList onSelectLocation={handleSelectLocation} />
            </div>
        )}

        {currentView === 'LOCATION_DETAIL' && selectedLocationId && (
            <LocationDetail 
                locationId={selectedLocationId} 
                onBack={handleBackToLocations} 
            />
        )}

      </main>
    </div>
  );
};

export default InventoryModule;