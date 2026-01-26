import React from 'react';
import { Scenario } from '../types';
import { formatCurrency, formatDecimal, format4Decimals } from '../utils'; // Importar format4Decimals
import { Download, Table, FileText, Image } from 'lucide-react';
import { useExport } from '../hooks/useExport';

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

  const renderHeaders = () => {
    if (viewMode === 'visual') {
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adulto (Venta)</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menor (Venta)</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">Promo Adulto</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-purple-600 uppercase tracking-wider">Promo Menor</th>
        </>
      );
    }
    if (viewMode === 'system') {
      return (
        <>
          <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Ad. Diario (Sis)</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider">Mn. Diario (Sis)</th>
        </>
      );
    }
    return (
      <>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adulto (Raw)</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Adulto (Final)</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menor (Raw)</th>
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Menor (Final)</th>
      </>
    );
  };

  const renderRows = (row: any) => {
    if (viewMode === 'visual') {
      return (
        <>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(row.adultRegularVisual)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.minorRegularVisual)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-medium">{formatCurrency(row.adultPromoVisual)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700">{formatCurrency(row.minorPromoVisual)}</td>
        </>
      );
    }
    if (viewMode === 'system') {
      return (
        <>
          {/* FIX: Usar 4 decimales para valores de sistema */}
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-700">{format4Decimals(row.adultRegularDailySystem)}</td>
          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-700">{format4Decimals(row.minorRegularDailySystem)}</td>
        </>
      );
    }
    return (
      <>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDecimal(row.adultRegularRaw)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{formatCurrency(row.adultRegularVisual)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatDecimal(row.minorRegularRaw)}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(row.minorRegularVisual)}</td>
      </>
    );
  };

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
        <div className="bg-white p-4"> {/* Padding extra para que el PDF se vea bien */}
            <h2 className="text-xl font-bold mb-4 text-center hidden" id="print-title">{scenario.name} - Temporada {scenario.season}</h2>
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Días</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Coef</th>
                {renderHeaders()}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row) => (
                <tr key={row.days} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.days}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.coefficient}</td>
                    {renderRows(row)}
                </tr>
                ))}
            </tbody>
            </table>
            
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