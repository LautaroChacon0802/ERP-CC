import React, { useState } from 'react';
import { useStockManager } from '../../hooks/useStockManager';
// FIX: Se agregó 'Edit2' a los imports
import { Package, Plus, Search, Filter, Loader2, ArrowLeft, History, Download, LayoutDashboard, Edit2 } from 'lucide-react';
import LocationList from './LocationList';
import LocationDetail from './LocationDetail';
import MovementHistory from './MovementHistory';
import ItemFormModal from './ItemFormModal';
import InventoryDashboard from './InventoryDashboard';
import { InventoryItem } from '../../types';
import { InventoryService } from '../../api/inventory';
import { useToast } from '../../contexts/ToastContext';
import * as XLSX from 'xlsx';

type InventoryView = 'DASHBOARD' | 'CATALOG' | 'LOCATIONS_LIST' | 'LOCATION_DETAIL' | 'HISTORY';

interface Props {
    onBack?: () => void;
}

const InventoryModule: React.FC<Props> = ({ onBack }) => {
  const { items, locations, isLoading, loadCatalog } = useStockManager();
  const { notify } = useToast();
  
  const [currentView, setCurrentView] = useState<InventoryView>('DASHBOARD');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectLocation = (id: string) => {
      setSelectedLocationId(id);
      setCurrentView('LOCATION_DETAIL');
  };

  const handleBackToLocations = () => {
      setSelectedLocationId(null);
      setCurrentView('LOCATIONS_LIST');
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsItemModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (itemData: Partial<InventoryItem>) => {
    try {
      if (editingItem) {
        await InventoryService.updateItem(editingItem.id, itemData);
        notify("Producto actualizado correctamente", "success");
      } else {
        await InventoryService.createItem(itemData as any);
        notify("Producto creado correctamente", "success");
      }
      await loadCatalog();
    } catch (error) {
      console.error(error);
      notify("Error al guardar producto", "error");
    }
  };

  const handleExportStock = async () => {
    setIsExporting(true);
    try {
        const fullStock = await InventoryService.fetchAllStock();
        const exportData = fullStock.map(s => ({
            "Ubicación": s.location?.name,
            "Tipo": s.location?.type,
            "Categoría": s.item?.category,
            "Ítem": s.item?.name,
            "SKU": s.item?.sku || '-',
            "Cantidad": s.quantity
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventario Total");
        ws['!cols'] = [{wch: 25}, {wch: 15}, {wch: 15}, {wch: 30}, {wch: 15}, {wch: 10}];

        const dateStr = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Inventario_CC_${dateStr}.xlsx`);
        notify("Reporte generado exitosamente", "success");
    } catch (error) {
        notify("Error al generar reporte", "error");
    } finally {
        setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
                onClick={() => onBack ? onBack() : window.location.href = '/'} 
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
                <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-700">
                    <Package size={20} />
                </div>
                <h1 className="text-xl font-bold text-gray-800">Gestión de Inventario</h1>
            </div>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-lg overflow-x-auto">
            <button 
                onClick={() => setCurrentView('DASHBOARD')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${currentView === 'DASHBOARD' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <LayoutDashboard size={16} /> Dashboard
            </button>
            <button 
                onClick={() => setCurrentView('CATALOG')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'CATALOG' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Catálogo
            </button>
            <button 
                onClick={() => setCurrentView(selectedLocationId ? 'LOCATION_DETAIL' : 'LOCATIONS_LIST')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${currentView === 'LOCATIONS_LIST' || currentView === 'LOCATION_DETAIL' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                Ubicaciones
            </button>
            <button 
                onClick={() => setCurrentView('HISTORY')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${currentView === 'HISTORY' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
                <History size={16}/> Historial
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {currentView === 'DASHBOARD' && (
            <InventoryDashboard items={items} locations={locations} onNavigate={setCurrentView} />
        )}

        {currentView === 'CATALOG' && (
            <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar en catálogo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleOpenCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-sm">
                            <Plus size={18} /> Nuevo Producto
                        </button>
                    </div>
                </div>

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
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">SKU</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Categoría</th>
                                    <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Stock Min</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{item.sku || '-'}</td>
                                        <td className="px-6 py-4 font-bold text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded">{item.category}</span></td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.min_stock}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full transition-colors">
                                                <Edit2 size={16} />
                                            </button>
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

        {currentView === 'LOCATIONS_LIST' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex justify-end">
                    <button onClick={handleExportStock} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-sm disabled:opacity-50">
                        {isExporting ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                        Exportar Inventario Completo
                    </button>
                </div>
                <LocationList onSelectLocation={handleSelectLocation} />
            </div>
        )}

        {currentView === 'LOCATION_DETAIL' && selectedLocationId && (
            <LocationDetail locationId={selectedLocationId} onBack={handleBackToLocations} />
        )}

        {currentView === 'HISTORY' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                <MovementHistory />
            </div>
        )}

        <ItemFormModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSave={handleSaveItem} initialData={editingItem} />
      </main>
    </div>
  );
};

export default InventoryModule;