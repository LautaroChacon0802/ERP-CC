import React, { useState, useMemo } from 'react';
import { HistoryLogEntry, ScenarioCategory, PricingRow, RentalItem } from '../types';
import { formatCurrency, formatDecimal } from '../utils';
import { getItemsByCategory } from '../constants';
import { GitCompare, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  history: HistoryLogEntry[];
  currentCategory: ScenarioCategory;
  activeScenarioName: string;
  activeScenarioData: PricingRow[];
}

const ComparisonSheet: React.FC<Props> = ({ 
    history, 
    currentCategory, 
    activeScenarioName,
    activeScenarioData 
}) => {
  const [compareId, setCompareId] = useState<string>('');

  // --- LÓGICA DE FILTRADO (Peras con Manzanas) ---
  const compatibleHistory = useMemo(() => {
    return history.filter(entry => {
        const entryCat = entry.category || 'LIFT';
        
        // Regla 1: Alpino solo con Alpino
        if (currentCategory === 'RENTAL_ALPINO') return entryCat === 'RENTAL_ALPINO';
        
        // Regla 2: Medios solo con Medios
        if (currentCategory === 'LIFT') return entryCat === 'LIFT';

        // Regla 3: Rentals de Esquí (Base, Morada, Ciudad) se pueden comparar entre sí
        // Esto permite comparar precios de la Base vs la Ciudad.
        const isSkiRental = (c: string) => ['RENTAL_MOUNTAIN', 'RENTAL_CITY'].includes(c);
        if (isSkiRental(currentCategory)) return isSkiRental(entryCat);

        return false;
    });
  }, [history, currentCategory]);

  const compareEntry = history.find(h => h.scenarioId === compareId);

  // Determinar qué columnas mostrar (Rental Items o LIFT columns)
  const isRental = currentCategory !== 'LIFT';
  const displayItems = isRental ? getItemsByCategory(currentCategory) : [];

  // Helper para calcular diferencia porcentual
  const getDiff = (curr: number, old: number) => {
    if (!old) return { val: '-', cls: 'text-gray-400' };
    const diff = ((curr - old) / old) * 100;
    const sign = diff > 0 ? '+' : '';
    const cls = diff > 0 ? 'text-red-600 font-bold' : diff < 0 ? 'text-green-600 font-bold' : 'text-gray-400';
    return { val: `${sign}${diff.toFixed(1)}%`, cls };
  };

  // Helper para renderizar celda de comparación
  const CompareCell = ({ curr, old, isCurrency = true }: { curr: number, old: number, isCurrency?: boolean }) => {
      const { val, cls } = getDiff(curr, old);
      return (
          <div className="flex flex-col items-end">
              <span className="font-bold text-gray-800">{isCurrency ? formatCurrency(curr) : formatDecimal(curr)}</span>
              <div className="flex gap-2 text-xs">
                  <span className="text-gray-400 line-through">{isCurrency ? formatCurrency(old) : formatDecimal(old)}</span>
                  <span className={cls}>{val}</span>
              </div>
          </div>
      );
  };

  if (compatibleHistory.length === 0) {
     return (
        <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-4">
            <AlertTriangle className="mx-auto mb-2 opacity-50" size={32} />
            <p>No hay tarifarios históricos compatibles para comparar con la categoría actual ({currentCategory}).</p>
        </div>
     );
  }

  return (
    <div className="p-6 bg-white shadow-sm rounded-lg min-h-[500px]">
      
      {/* HEADER DE COMPARACIÓN */}
      <div className="mb-6 flex flex-col md:flex-row items-center justify-between bg-slate-50 p-4 rounded-lg border border-slate-200 gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-full shadow-sm text-castor-red">
                <GitCompare size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-gray-800">Comparativa de Escenarios</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{activeScenarioName}</span>
                    <ArrowRight size={14} />
                    <span>Vs. Histórico</span>
                </div>
            </div>
        </div>
        
        <div className="w-full md:w-1/3">
            <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-castor-red focus:border-castor-red sm:text-sm"
            >
                <option value="" disabled>-- Seleccionar Histórico --</option>
                {compatibleHistory.map(h => (
                    <option key={h.scenarioId} value={h.scenarioId}>
                        {h.season} | {h.name} ({h.category || 'LIFT'})
                    </option>
                ))}
            </select>
        </div>
      </div>

      {compareEntry ? (
        <div className="overflow-x-auto border rounded-lg">
             <table className="min-w-full divide-y divide-gray-200 text-right text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-700 w-16 sticky left-0 bg-gray-100 z-10 border-r">Días</th>
                        
                        {isRental ? (
                            displayItems.map(item => (
                                <th key={item.id} className="px-4 py-3 font-bold text-gray-700 min-w-[140px]">
                                    {item.label}
                                </th>
                            ))
                        ) : (
                            <>
                                <th className="px-4 py-3 font-bold text-gray-700">Adulto Reg</th>
                                <th className="px-4 py-3 font-bold text-gray-700">Menor Reg</th>
                                <th className="px-4 py-3 font-bold text-gray-700">Adulto Promo</th>
                                <th className="px-4 py-3 font-bold text-gray-700">Menor Promo</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {activeScenarioData.map((currRow) => {
                        // Buscar fila correspondiente en el histórico (mismo día)
                        const oldRow = compareEntry.data.find(r => r.days === currRow.days);
                        
                        // Si no existe el día en el histórico, no comparamos
                        if (!oldRow) return null;

                        return (
                            <tr key={currRow.days} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-left font-bold text-gray-900 border-r sticky left-0 bg-white z-10">
                                    {currRow.days}
                                </td>

                                {isRental ? (
                                    displayItems.map(item => {
                                        const currVal = currRow.rentalItems?.[item.id]?.visual || 0;
                                        // Intentamos buscar el mismo item. 
                                        // Si estamos comparando Base vs Ciudad, el ID del item cambia (mnt_... vs cty_...)
                                        // Lógica avanzada: Mapeo de items equivalentes si son categorías distintas
                                        // Simplificación: Buscamos por coincidencia de sufijo (ej: _ski_jr_compl) o mostramos '-'
                                        
                                        let oldVal = 0;
                                        if (oldRow.rentalItems) {
                                            // 1. Busqueda directa
                                            if (oldRow.rentalItems[item.id]) {
                                                oldVal = oldRow.rentalItems[item.id].visual;
                                            } else {
                                                // 2. Búsqueda por equivalencia (Base vs Ciudad)
                                                // items IDs son: 'mnt_...' o 'cty_...'
                                                const suffix = item.id.substring(3); // remove prefix
                                                const equivalentKey = Object.keys(oldRow.rentalItems).find(k => k.endsWith(suffix));
                                                if (equivalentKey) oldVal = oldRow.rentalItems[equivalentKey].visual;
                                            }
                                        }

                                        return (
                                            <td key={item.id} className="px-4 py-3">
                                                <CompareCell curr={currVal} old={oldVal} />
                                            </td>
                                        );
                                    })
                                ) : (
                                    <>
                                        <td className="px-4 py-3"><CompareCell curr={currRow.adultRegularVisual} old={oldRow.adultRegularVisual} /></td>
                                        <td className="px-4 py-3"><CompareCell curr={currRow.minorRegularVisual} old={oldRow.minorRegularVisual} /></td>
                                        <td className="px-4 py-3"><CompareCell curr={currRow.adultPromoVisual} old={oldRow.adultPromoVisual} /></td>
                                        <td className="px-4 py-3"><CompareCell curr={currRow.minorPromoVisual} old={oldRow.minorPromoVisual} /></td>
                                    </>
                                )}
                            </tr>
                        );
                    })}
                </tbody>
             </table>
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 border rounded-lg border-dashed border-gray-200">
            <GitCompare size={48} className="mx-auto mb-4 opacity-20" />
            <p>Selecciona un tarifario del menú superior para ver las diferencias línea por línea.</p>
        </div>
      )}
    </div>
  );
};

export default ComparisonSheet;