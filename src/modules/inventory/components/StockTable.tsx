import React from 'react';
import { InventoryStock } from '../../../types';
import { CATEGORY_ICONS } from '../../../constants';
import { Plus, Minus, ArrowRightLeft, AlertCircle } from 'lucide-react';

interface Props {
    stock: InventoryStock[];
    onUpdateStock: (itemId: string, delta: number) => void;
    onTransfer: (item: InventoryStock) => void;
    isUpdatingId: string | null;
}

const StockTable: React.FC<Props> = ({ stock, onUpdateStock, onTransfer, isUpdatingId }) => {
    // Lógica de Agrupación Visual
    const groupedStock = stock.reduce((acc, curr) => {
        const cat = curr.item?.category || 'OTROS';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(curr);
        return acc;
    }, {} as Record<string, InventoryStock[]>);

    const sortedCategories = Object.keys(groupedStock).sort();

    if (stock.length === 0) {
        return (
            <div className="p-12 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                <AlertCircle size={48} className="mx-auto mb-3 opacity-20" />
                <p>No hay stock asignado a esta ubicación.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {sortedCategories.map(cat => (
                <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Encabezado de Categoría */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-2">
                        <span className="text-xl">{CATEGORY_ICONS[cat] || '📦'}</span>
                        <h3 className="font-bold text-gray-700 text-sm tracking-wide">{cat}</h3>
                        <span className="ml-auto text-xs font-medium text-gray-400 bg-white px-2 py-0.5 rounded border border-gray-200">
                            {groupedStock[cat].length} ítems
                        </span>
                    </div>

                    {/* Filas */}
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-gray-100">
                            {groupedStock[cat].map((item) => (
                                <tr key={item.item_id} className="hover:bg-blue-50 transition-colors group">
                                    <td className="px-6 py-4 w-1/3">
                                        <div className="font-bold text-gray-900 text-sm">{item.item?.name}</div>
                                        {item.item?.sku && <div className="text-xs text-gray-400 font-mono">{item.item.sku}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-center w-32">
                                        <div className="flex items-center justify-center gap-1">
                                            <span className={`text-xl font-bold ${item.quantity < (item.item?.min_stock || 0) ? 'text-red-600' : 'text-gray-800'}`}>
                                                {item.quantity}
                                            </span>
                                            {item.quantity < (item.item?.min_stock || 0) && (
                                                <span title="Stock bajo" className="flex items-center text-red-500">
                                                    <AlertCircle size={14} />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onUpdateStock(item.item_id, -1)}
                                                disabled={isUpdatingId === item.item_id || item.quantity <= 0}
                                                className="p-1.5 rounded-md text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-30 transition-colors"
                                            ><Minus size={18} /></button>
                                            <button 
                                                onClick={() => onUpdateStock(item.item_id, 1)}
                                                disabled={isUpdatingId === item.item_id}
                                                className="p-1.5 rounded-md text-gray-500 hover:bg-green-100 hover:text-green-600 disabled:opacity-30 transition-colors"
                                            ><Plus size={18} /></button>
                                            <div className="w-px h-4 bg-gray-300 mx-2"></div>
                                            <button 
                                                onClick={() => onTransfer(item)}
                                                disabled={isUpdatingId === item.item_id || item.quantity <= 0}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 text-xs font-bold shadow-sm transition-all"
                                            >
                                                <ArrowRightLeft size={14} /> Mover
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
};

export default StockTable;