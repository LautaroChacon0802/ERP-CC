import React, { useState } from 'react';
import { useStockManager } from '../../hooks/useStockManager';
import { Package, Plus, Search, Loader2, History, Download, LayoutDashboard, Edit2 } from 'lucide-react';
import LocationList from './LocationList';
import LocationDetail from './LocationDetail';
import MovementHistory from './MovementHistory';
import ItemFormModal from './ItemFormModal';
import InventoryDashboard from './InventoryDashboard';
import { InventoryItem } from '../../types';
import { InventoryService } from '../../api/inventory';
import { useToast } from '../../contexts/ToastContext';
import { PageHeader } from '../../components/ui/PageHeader';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
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
            "Ubicacion": s.location?.name,
            "Tipo": s.location?.type,
            "Categoria": s.item?.category,
            "Item": s.item?.name,
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

  const tabs = [
    { id: 'DASHBOARD' as const, label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { id: 'CATALOG' as const, label: 'Catalogo', icon: null },
    { id: 'LOCATIONS_LIST' as const, label: 'Ubicaciones', icon: null },
    { id: 'HISTORY' as const, label: 'Historial', icon: <History size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <PageHeader
        title="Gestion de Inventario"
        subtitle="Control de stock por ubicacion"
        icon={<Package size={20} />}
        onBack={onBack}
      >
        {/* Tab Navigation inside header */}
        <div className="flex bg-muted p-1 rounded-lg">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id === 'LOCATIONS_LIST' && selectedLocationId ? 'LOCATION_DETAIL' : tab.id)}
              className={`
                px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2
                ${(currentView === tab.id || (tab.id === 'LOCATIONS_LIST' && currentView === 'LOCATION_DETAIL'))
                  ? 'bg-card text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        
        {currentView === 'DASHBOARD' && (
            <InventoryDashboard items={items} locations={locations} onNavigate={setCurrentView} />
        )}

        {currentView === 'CATALOG' && (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                        <input 
                            type="text" 
                            placeholder="Buscar en catalogo..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                        />
                    </div>
                    <Button onClick={handleOpenCreate} icon={<Plus size={18} />}>
                        Nuevo Producto
                    </Button>
                </div>

                <Card>
                    {isLoading ? (
                        <div className="p-12 text-center flex flex-col items-center">
                            <Loader2 className="animate-spin mb-2 text-muted-foreground" size={32} />
                            <p className="text-muted-foreground">Cargando inventario...</p>
                        </div>
                    ) : filteredItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted border-b border-border">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase">SKU</th>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase">Nombre</th>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase">Categoria</th>
                                        <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase">Stock Min</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-muted-foreground uppercase">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredItems.map((item, idx) => (
                                        <tr key={item.id} className={`hover:bg-muted/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/30' : ''}`}>
                                            <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{item.sku || '-'}</td>
                                            <td className="px-6 py-4 font-semibold text-foreground">{item.name}</td>
                                            <td className="px-6 py-4"><Badge variant="primary">{item.category}</Badge></td>
                                            <td className="px-6 py-4 text-sm font-medium text-foreground">{item.min_stock}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => handleOpenEdit(item)} className="text-muted-foreground hover:text-accent p-2 hover:bg-accent/10 rounded-lg transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <EmptyState
                            icon={<Package size={48} />}
                            title="No se encontraron productos"
                            description="Intenta con otro termino de busqueda o crea un nuevo producto."
                            action={{ label: 'Nuevo Producto', onClick: handleOpenCreate }}
                        />
                    )}
                </Card>
            </div>
        )}

        {currentView === 'LOCATIONS_LIST' && (
            <div className="space-y-6 animate-slide-in-right">
                <div className="flex justify-end">
                    <Button 
                        onClick={handleExportStock} 
                        loading={isExporting}
                        variant="success"
                        icon={<Download size={18} />}
                    >
                        Exportar Inventario Completo
                    </Button>
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
