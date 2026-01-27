import React, { useEffect } from 'react';
import { useStockMovements } from '../../hooks/useStockMovements';
import { ArrowRight, Calendar, User, Package, Loader2, ArrowRightLeft } from 'lucide-react';

const MovementHistory: React.FC = () => {
  const { movements, isLoading, loadMovements } = useStockMovements();

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  if (isLoading) return (
    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
        <Loader2 className="animate-spin mb-2" size={32}/>
        <p>Cargando historial...</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
         <ArrowRightLeft size={18} className="text-gray-500" />
         <h3 className="font-bold text-gray-700">Últimos Movimientos</h3>
      </div>
      
      <table className="w-full text-left">
        <thead className="bg-white border-b border-gray-100">
          <tr>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Fecha</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Tipo</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Ítem</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-center">Cant.</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Detalle</th>
            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Usuario</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {movements.map((mov: any) => (
            <tr key={mov.id} className="hover:bg-blue-50 transition-colors">
              <td className="px-6 py-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-gray-400"/>
                  <span className="font-mono text-xs">
                    {new Date(mov.created_at).toLocaleDateString()} {new Date(mov.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-[10px] font-bold border uppercase ${
                  mov.type === 'IN' ? 'bg-green-100 text-green-700 border-green-200' :
                  mov.type === 'OUT' ? 'bg-red-100 text-red-700 border-red-200' :
                  mov.type === 'MOVE' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                  'bg-gray-100 text-gray-700 border-gray-200'
                }`}>
                  {mov.type === 'IN' ? 'Alta' : mov.type === 'OUT' ? 'Baja' : mov.type === 'MOVE' ? 'Traslado' : mov.type}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                   <Package size={16} className="text-gray-400"/>
                   <span className="font-bold text-gray-800">{mov.item?.name || 'Ítem eliminado'}</span>
                </div>
              </td>
              <td className="px-6 py-4 font-black text-gray-800 text-center text-sm">{mov.quantity}</td>
              <td className="px-6 py-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">{mov.from?.name || '-'}</span>
                  <ArrowRight size={12} className="text-gray-400"/>
                  <span className="font-medium bg-gray-100 px-2 py-0.5 rounded text-xs">{mov.to?.name || '-'}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-xs text-gray-500">
                 <div className="flex items-center gap-1" title={mov.user?.email}>
                    <User size={12}/>
                    {mov.user?.full_name || mov.user?.email || 'Sistema'}
                 </div>
              </td>
            </tr>
          ))}
          {movements.length === 0 && (
            <tr><td colSpan={6} className="p-8 text-center text-gray-400 text-sm">No hay movimientos registrados aún.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default MovementHistory;