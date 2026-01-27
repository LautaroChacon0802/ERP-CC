import React, { useState, useEffect } from 'react';
import { InventoryService } from '../../api/inventory';
import { InventoryItem } from '../../types';
import { X, Plus, Search, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (itemId: string, quantity: number) => Promise<void>;
  locationName: string;
}

const AddItemToLocationModal: React.FC<Props> = ({ isOpen, onClose, onAdd, locationName }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoadingItems(true);
      InventoryService.fetchCatalog()
        .then(setItems)
        .finally(() => setLoadingItems(false));
      
      setSelectedItemId('');
      setQuantity(1);
      setSearchTerm('');
    }
  }, [isOpen]);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity < 0) return;

    setIsSaving(true);
    await onAdd(selectedItemId, quantity);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg">Agregar a {locationName}</h3>
            <p className="text-xs text-slate-400">Asignar nuevo ítem a esta ubicación</p>
          </div>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar en catálogo..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loadingItems ? (
            <div className="text-center py-8 text-gray-400"><Loader2 className="animate-spin inline"/></div>
          ) : (
            filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex justify-between items-center ${
                  selectedItemId === item.id 
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="font-bold text-gray-800 text-sm">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.category} • SKU: {item.sku || 'N/A'}</div>
                </div>
                {selectedItemId === item.id && <div className="text-blue-600"><Plus size={16}/></div>}
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cantidad Inicial</label>
              <input 
                type="number" min="0"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                className="w-full border-gray-300 rounded-lg p-2 font-bold"
              />
            </div>
            <button 
              type="submit" 
              disabled={!selectedItemId || isSaving}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Plus size={18}/>}
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemToLocationModal;