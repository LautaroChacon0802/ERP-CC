import React from 'react';
import { HistoryLogEntry } from '../types';
import { formatCurrency } from '../utils';

interface Props {
  history: HistoryLogEntry[];
}

const HistorySheet: React.FC<Props> = ({ history }) => {
  return (
    <div className="p-6 bg-white min-h-[500px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Log Histórico (Inmutable)</h2>
        <p className="text-sm text-gray-500">Registro de todos los escenarios cerrados y aprobados.</p>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
          <p className="text-gray-500">No hay escenarios cerrados aún.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {history.map((entry) => (
            <div key={entry.scenarioId} className="border rounded-lg overflow-hidden shadow-sm">
              <div className="bg-gray-100 px-4 py-3 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {entry.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {entry.season} | {entry.scenarioType} | Cerrado el: {new Date(entry.closedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-sm text-right flex flex-col items-end">
                  <div className="text-gray-700 font-medium">Aumento: {entry.params.increasePercentage}%</div>
                  <div className="text-gray-600 text-xs">Base: {formatCurrency(entry.params.baseRateAdult1Day)}</div>
                  <div className="text-gray-500 text-[10px] mt-1 bg-gray-200 px-1 rounded">
                    Redondeo: ${entry.params.roundingValue || 100}
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-right text-xs">
                   <thead className="bg-gray-50">
                     <tr>
                        <th className="px-2 py-1 text-left">Días</th>
                        <th className="px-2 py-1 text-gray-500">% Dto</th>
                        <th className="px-2 py-1 font-bold">Adulto Final</th>
                        <th className="px-2 py-1">Menor Final</th>
                        <th className="px-2 py-1 text-gray-500">Total Sist Ad</th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                      {entry.data.map(row => (
                        <tr key={row.days}>
                           <td className="px-2 py-1 text-left font-medium">{row.days}</td>
                           <td className="px-2 py-1 text-gray-400">{row.coefficient.toFixed(2)}%</td>
                           <td className="px-2 py-1 font-semibold">{formatCurrency(row.adultRegularVisual)}</td>
                           <td className="px-2 py-1">{formatCurrency(row.minorRegularVisual)}</td>
                           <td className="px-2 py-1 text-gray-500">{(row.adultRegularDailySystem * row.days).toFixed(4)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorySheet;