import React from 'react';
import { Scenario } from '../types';
import { formatCurrency, formatDecimal, format4Decimals } from '../utils'; 
import { Download, Table, FileText, Image } from 'lucide-react';
import { useExport } from '../hooks/useExport';
import { getItemsByCategory } from '../constants';

interface DataSheetProps {
  scenario: Scenario;
  viewMode: 'matrix' | 'visual' | 'system';
}

const DataSheet: React.FC<DataSheetProps> = ({ scenario, viewMode }) => {
  const { exportToExcel, exportToPdf, exportToJpeg } = useExport();
  const data = scenario.calculatedData || [];
  const hasData = data.length > 0;
  
  const cleanName = (scenario.name || 'tarifario').replace(/[^a-z0-9]/gi, '_');
  const TABLE_ID = "pricing-table-export";

  // Lógica de detección de categoría
  const category = scenario.category || 'LIFT';
  const isRental = category !== 'LIFT';

  // Clase para columna sticky
  const stickyColClass = "sticky left-0 bg-white z-10 text-left font-bold text-gray-900 border-r border-gray-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]";

  return (
    <div className="h-full flex flex-col">
      {/* HEADER ACTIONS */}
      <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Table size={16} />
          Vista: {viewMode === 'visual' ? 'Comercial' : viewMode === 'system' ? 'Sistema (Diario)' : 'Matriz de Cálculo'}
        </h3>
        
        <div className="flex gap-2">
            <button
              onClick={() => exportToPdf(TABLE_ID, cleanName)}
              disabled={!hasData}
              className="p-2 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-all disabled:opacity-50"
              title="Exportar PDF"
            >
              <FileText size={18} />
            </button>
            <button
              onClick={() => exportToJpeg(TABLE_ID, cleanName)}
              disabled={!hasData}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-all disabled:opacity-50"
              title="Exportar Imagen"
            >
              <Image size={18} />
            </button>
            <button
              onClick={() => exportToExcel(scenario)}
              disabled={!hasData}
              className={`
                flex items-center gap-2 px-4 py-2 text-sm font-medium rounded shadow-sm transition-colors
                ${hasData 
                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'}
              `}
            >
              <Download size={16} />
              Excel
            </button>
        </div>
      </div>

      {/* TABLE WRAPPER (ID para exportación) */}
      <div className="flex-1 overflow-auto bg-white" id={TABLE_ID}>
        <div className="bg-white p-4">
            <h2 className="text-xl font-bold mb-4 text-center hidden" id="print-title">{scenario.name} - Temporada {scenario.season}</h2>
            
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-6 text-sm text-yellow-800">
                <div className="flex flex-col">
                    <span className="text-xs text-yellow-600 uppercase font-semibold">% Aumento</span>
                    <span className="font-bold">{scenario.params.increasePercentage}%</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-yellow-600 uppercase font-semibold">Redondeo</span>
                    <span className="font-bold">${scenario.params.roundingValue}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs text-yellow-600 uppercase font-semibold">% Promo</span>
                    <span className="font-bold">{scenario.params.promoDiscountPercentage}%</span>
                </div>
            </div>

            {/* TABLA TRANSPUESTA */}
            <div className="overflow-x-auto pb-4">
              <table className="min-w-full divide-y divide-gray-200 border-separate border-spacing-0">
                <thead className="bg-gray-50">
                    <tr>
                      {/* Header Fijo: Concepto */}
                      <th className={`px-6 py-3 text-xs uppercase tracking-wider w-48 ${stickyColClass} text-gray-500`}>
                        Concepto
                      </th>
                      
                      {/* Columnas Dinámicas: Días */}
                      {data.map((row) => (
                        <th key={row.days} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                          {row.days} Días
                        </th>
                      ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    
                    {/* CASO B: RENTAL (EQUIPOS) */}
                    {isRental ? (
                      getItemsByCategory(category).map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          {/* Fila: Nombre del Item */}
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${stickyColClass}`}>
                            {item.label}
                          </td>
                          {/* Celdas: Precios por día */}
                          {data.map((row) => (
                            <td key={`${item.id}-${row.days}`} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(row.rentalItems?.[item.id]?.visual ?? 0)}
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      /* CASO A: LIFT (PASES) - Estrictamente 4 filas */
                      <>
                        {/* Fila 1: Adulto Regular */}
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${stickyColClass}`}>
                            Adulto (Regular)
                          </td>
                          {data.map((row) => (
                            <td key={`ar-${row.days}`} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(row.adultRegularVisual)}
                            </td>
                          ))}
                        </tr>

                        {/* Fila 2: Menor Regular */}
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${stickyColClass}`}>
                            Menor (Regular)
                          </td>
                          {data.map((row) => (
                            <td key={`mr-${row.days}`} className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                              {formatCurrency(row.minorRegularVisual)}
                            </td>
                          ))}
                        </tr>

                        {/* Fila 3: Adulto Promo */}
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-purple-700 ${stickyColClass}`}>
                            Adulto (Promo)
                          </td>
                          {data.map((row) => (
                            <td key={`ap-${row.days}`} className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-700 font-medium">
                              {formatCurrency(row.adultPromoVisual)}
                            </td>
                          ))}
                        </tr>

                        {/* Fila 4: Menor Promo */}
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-purple-700 ${stickyColClass}`}>
                            Menor (Promo)
                          </td>
                          {data.map((row) => (
                            <td key={`mp-${row.days}`} className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-700">
                              {formatCurrency(row.minorPromoVisual)}
                            </td>
                          ))}
                        </tr>
                      </>
                    )}
                </tbody>
              </table>
            </div>
            
            {!hasData && (
                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                    <p>No hay datos calculados disponibles.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default DataSheet;