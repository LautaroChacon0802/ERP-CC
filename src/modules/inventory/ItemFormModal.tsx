import React, { useState, useEffect } from 'react';
import { InventoryItem, StockCategory } from '../../types';
import { X, Save, Loader2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<InventoryItem>) => Promise<void>;
  initialData?: InventoryItem | null;
}

const CATEGORIES: StockCategory[] = [
  'AMENITIES', 'VAJILLA', 'BLANCOS', 'ELECTRO', 
  'EQUIPAMIENTO', 'LIMPIEZA', 'SPA', 'GIMNASIO'
];

const ItemFormModal: React.FC<Props> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: 'AMENITIES',
    min_stock: 0
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ name: '', sku: '', category: 'AMENITIES', min_stock: 0 });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    setIsSaving(true);
    await onSave(formData);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
          <h3 className="font-bold text-lg">{initialData ? 'Editar Artículo' : 'Nuevo Artículo'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Producto</label>
            <input 
              type="text" required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Toalla de Mano"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU / Código</label>
              <input 
                type="text"
                value={formData.sku || ''}
                onChange={e => setFormData({...formData, sku: e.target.value})}
                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stock Mínimo</label>
              <input 
                type="number" min="0"
                value={formData.min_stock}
                onChange={e => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
                className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
            <select 
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value as StockCategory})}
              className="w-full border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemFormModal;