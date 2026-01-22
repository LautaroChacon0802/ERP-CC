import React, { useState, useEffect } from 'react';
import { HistoryLogEntry } from '../types';
import DataSheet from './DataSheet';
import { Clock, Calendar, LayoutGrid, Eye, Database, ChevronDown } from 'lucide-react';

interface Props {
  history: HistoryLogEntry[];
}

const HistorySheet: React.FC<Props> = ({ history }) => {
  // Estado para el ID seleccionado y el modo de vista (Matriz, Visual, Dispongo)
  const [selectedId, setSelectedId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'matrix' | 'visual' | 'system'>('visual');

  // EFECTO: Seleccionar automáticamente el tarifario más reciente al cargar
  useEffect(() => {
    if (history && history.length > 0 && !selectedId) {
      // Asumimos que el historial viene ordenado por fecha (el backend suele mandarlo así),
      // seleccionamos el primero (índice 0).
      setSelectedId(history[0].scenarioId);
    }
  }, [history]);

  // Si no hay historial, mostramos pantalla vacía
  if (!history || history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 bg-white rounded-lg border border-gray-200 mt-4">
        <Clock className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay historial de tarifarios cerrados.</p>
      </div>
    );
  }

  // Encontrar el objeto completo del tarifario seleccionado
  const selectedEntry = history.find(h => h.scenarioId === selectedId) || history[0];

  // Construimos un objeto "Scenario" temporal para que el componente DataSheet lo pueda leer.
  // Usamos los datos guardados en el historial (params y data calculada).
  const tempScenario = {
    id: selectedEntry.scenarioId,
    name: selectedEntry.name,
    season: selectedEntry.season,
    type: selectedEntry.scenarioType as any,
    status: selectedEntry.status,
    // AQUÍ ESTÁ LA CORRECCIÓN CLAVE:
    // Pasamos la categoría del registro histórico al visualizador.
    // Si es un registro viejo sin categoría, asumimos 'LIFT'.
    category: selectedEntry.category || 'LIFT', 
    createdAt: '', // No relevante para visualización
    closedAt: selectedEntry.closedAt,
    params: selectedEntry.params,
    coefficients: [], // No necesitamos coeficientes porque usamos la 'data' ya calculada
    calculatedData: selectedEntry.data
  };

  // Helper para mostrar etiqueta bonita
  const getCategoryLabel = (cat?: string) => {
    if (!cat || cat === 'LIFT') return 'MEDIOS DE ELEVACIÓN';
    if (cat === 'RENTAL_MOUNTAIN') return 'RENTAL BASE/MORADA';
    if (cat === 'RENTAL_CITY') return 'RENTAL CIUDAD';
    if (cat === 'RENTAL_ALPINO') return 'RENTAL ALPINO';
    return cat;
  };

  return (
    <div className="space-y-6 mt-4 animate-fadeIn">
      
      {/* --- PANEL DE CONTROL (HEADER) --- */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-end md:items-center">
        
        {/* SECCIÓN 1: SELECTOR DE TARIFARIO */}
        <div className="w-full md:w-1/2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                <Clock size={14} /> Seleccionar Versión Histórica
            </label>
            <div className="relative group">
                <select
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    className="appearance-none block w-full pl-4 pr-10 py-3 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-castor-red focus:border-castor-red bg-white text-gray-800 font-medium cursor-pointer hover:border-gray-400 transition-colors"
                >
                    {history.map((entry) => (
                        <option key={entry.scenarioId} value={entry.scenarioId}>
                            {/* Formato: AÑO | NOMBRE | FECHA DE CIERRE */}
                            {entry.season || '----'} | {entry.name} — {new Date(entry.closedAt).toLocaleDateString()}
                        </option>
                    ))}
                </select>
                {/* Icono de flecha personalizado */}
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-gray-500 group-hover:text-castor-red transition-colors">
                    <ChevronDown size={20} />
                </div>
            </div>
        </div>

        {/* SECCIÓN 2: SELECTOR DE VISTA (TABS) */}
        <div className="w-full md:w-auto">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 md:text-right">
                Modo de Visualización
            </label>
            <div className="flex bg-gray-100 p-1.5 rounded-lg border border-gray-200">
                <button
                    onClick={() => setViewMode('matrix')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                        viewMode === 'matrix' 
                        ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <LayoutGrid size={16} /> Matriz
                </button>
                <button
                    onClick={() => setViewMode('visual')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                        viewMode === 'visual' 
                        ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Eye size={16} /> Tarifario
                </button>
                <button
                    onClick={() => setViewMode('system')}
                    className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition-all ${
                        viewMode === 'system' 
                        ? 'bg-white text-purple-700 shadow-sm ring-1 ring-black/5' 
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    <Database size={16} /> Dispongo
                </button>
            </div>
        </div>
      </div>

      {/* --- ÁREA DE CONTENIDO --- */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Cabecera del Reporte */}
        <div className="px-6 py-4 border-b border-gray-100 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight">{selectedEntry.name}</h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1"><Calendar size={14} /> Temporada {selectedEntry.season}</span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="flex items-center gap-1"><Clock size={14} /> Cerrado el {new Date(selectedEntry.closedAt).toLocaleString()}</span>
                </div>
             </div>
             
             <div className="flex gap-2">
                 <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border bg-blue-50 text-blue-700 border-blue-200`}>
                    {getCategoryLabel(selectedEntry.category)}
                 </span>
                 <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-600 border border-gray-200">
                    CERRADO
                 </span>
             </div>
        </div>
        
        {/* Tabla de Datos (Reutilizamos DataSheet) */}
        <div className="flex-1 p-0">
            <DataSheet 
                scenario={tempScenario as any} 
                viewMode={viewMode} 
            />
        </div>
      </div>
    </div>
  );
};

export default HistorySheet;