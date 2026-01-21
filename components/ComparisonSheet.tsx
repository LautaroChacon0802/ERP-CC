import React, { useState, useMemo } from 'react';
import { HistoryLogEntry, PricingRow } from '../types';
import { formatCurrency, formatDecimal } from '../utils';
import { ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  history: HistoryLogEntry[];
}

const ComparisonSheet: React.FC<Props> = ({ history }) => {
  // State for selected scenarios
  const [selectedIdA, setSelectedIdA] = useState<string>('');
  const [selectedIdB, setSelectedIdB] = useState<string>('');

  // Memoized lookups
  const scenarioA = useMemo(() => history.find(h => h.scenarioId === selectedIdA), [history, selectedIdA]);
  const scenarioB = useMemo(() => history.find(h => h.scenarioId === selectedIdB), [history, selectedIdB]);

  // Comparison Logic
  const comparisonData = useMemo(() => {
    if (!scenarioA || !scenarioB) return [];

    // Map rows by days to align them
    const mapA = new Map<number, PricingRow>(scenarioA.data.map(r => [r.days, r]));
    const mapB = new Map<number, PricingRow>(scenarioB.data.map(r => [r.days, r]));
    
    // Get all unique days from both (usually they are the same, but for safety)
    const allDays = Array.from(new Set([...Array.from(mapA.keys()), ...Array.from(mapB.keys())])).sort((a, b) => a - b);

    return allDays.map(days => {
      const rowA = mapA.get(days);
      const rowB = mapB.get(days);

      const priceA = rowA?.adultRegularVisual || 0;
      const priceB = rowB?.adultRegularVisual || 0;

      const diffVal = priceB - priceA;
      const diffPercent = priceA !== 0 ? (diffVal / priceA) * 100 : 0;

      return {
        days,
        priceA,
        priceB,
        diffVal,
        diffPercent,
        existsInBoth: rowA && rowB
      };
    });
  }, [scenarioA, scenarioB]);

  if (history.length < 2) {
    return (
      <div className="p-10 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg m-6">
        <p className="text-gray-500 text-lg">Se necesitan al menos 2 escenarios en el historial para realizar una comparación.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-[500px]">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           Comparador de Escenarios
        </h2>
        <p className="text-sm text-gray-500">Analice la variación de precios entre dos versiones históricas.</p>
      </div>

      {/* SELECTORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-8 bg-gray-50 p-4 rounded-lg border">
        
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Escenario Base (A)</label>
          <select 
            value={selectedIdA} 
            onChange={e => setSelectedIdA(e.target.value)}
            className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Seleccionar --</option>
            {history.map(h => (
              <option key={h.scenarioId} value={h.scenarioId} disabled={h.scenarioId === selectedIdB}>
                {h.season} | {h.name}
              </option>
            ))}
          </select>
          {scenarioA && (
             <div className="text-xs text-gray-500 mt-1">
                Base Adulto: {formatCurrency(scenarioA.params.baseRateAdult1Day)}
             </div>
          )}
        </div>

        <div className="flex justify-center">
            <div className="bg-white p-2 rounded-full border shadow-sm">
                <ArrowRight className="text-gray-400" />
            </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Escenario Comparado (B)</label>
          <select 
            value={selectedIdB} 
            onChange={e => setSelectedIdB(e.target.value)}
            className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Seleccionar --</option>
            {history.map(h => (
              <option key={h.scenarioId} value={h.scenarioId} disabled={h.scenarioId === selectedIdA}>
                {h.season} | {h.name}
              </option>
            ))}
          </select>
           {scenarioB && (
             <div className="text-xs text-gray-500 mt-1">
                Base Adulto: {formatCurrency(scenarioB.params.baseRateAdult1Day)}
             </div>
          )}
        </div>

      </div>

      {/* COMPARISON TABLE */}
      {scenarioA && scenarioB && (
        <div className="overflow-x-auto border rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Días</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider border-l border-gray-200">
                    {scenarioA.name}
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    {scenarioB.name}
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider bg-gray-200 border-l border-white">
                    Diferencia $
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-gray-800 uppercase tracking-wider bg-gray-200">
                    Variación %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
              {comparisonData.map((row) => {
                 const isPositive = row.diffVal > 0;
                 const isNegative = row.diffVal < 0;
                 const textColor = isPositive ? 'text-green-600' : isNegative ? 'text-castor-red' : 'text-gray-400';
                 const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

                 return (
                  <tr key={row.days} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 text-left">
                      {row.days}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600 border-l">
                      {formatCurrency(row.priceA)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-gray-900 font-medium">
                      {formatCurrency(row.priceB)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${textColor} bg-gray-50 border-l`}>
                      {row.diffVal > 0 ? '+' : ''}{formatCurrency(row.diffVal)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${textColor} bg-gray-50`}>
                      <div className="flex items-center justify-end gap-1">
                        {row.diffPercent !== 0 && <Icon size={14} />}
                        {row.diffPercent > 0 ? '+' : ''}{formatDecimal(row.diffPercent)}%
                      </div>
                    </td>
                  </tr>
                 );
              })}
            </tbody>
            {/* Footer Summary */}
             <tfoot className="bg-gray-100 border-t border-gray-300">
                <tr>
                    <td colSpan={3} className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">
                        Promedio de Aumento Total
                    </td>
                    <td colSpan={2} className="px-6 py-3 text-center text-sm font-bold text-gray-800">
                        {(() => {
                            const totalPct = comparisonData.reduce((acc, curr) => acc + curr.diffPercent, 0);
                            const avg = totalPct / comparisonData.length;
                            return `~ ${formatDecimal(avg)}%`;
                        })()}
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComparisonSheet;