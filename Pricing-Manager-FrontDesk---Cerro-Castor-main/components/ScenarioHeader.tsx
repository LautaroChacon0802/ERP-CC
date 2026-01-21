import React from 'react';
import { Scenario, ScenarioStatus } from '../types';
import { Plus, Copy, Lock, Edit2 } from 'lucide-react';

interface Props {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  onRenameScenario: (name: string) => void;
  onCreateScenario: () => void;
  onDuplicateScenario: () => void;
  onCloseScenario: () => void;
}

const ScenarioHeader: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onRenameScenario,
  onCreateScenario,
  onDuplicateScenario,
  onCloseScenario
}) => {
  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const isClosed = activeScenario?.status === ScenarioStatus.CLOSED;

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm mb-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Selector & Name Editor */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto">
          
          <div className="flex flex-col">
            <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Seleccionar Escenario</label>
            <select
              value={activeScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="block w-64 pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md border"
            >
              {scenarios.map(s => (
                <option key={s.id} value={s.id}>
                  {s.season} - {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>

          {activeScenario && (
            <div className="flex flex-col w-full md:w-72">
                 <label className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">
                    Nombre del Tarifario { !isClosed && <span className="text-blue-600 ml-1">(Editable)</span> }
                 </label>
                 <div className="relative rounded-md shadow-sm">
                    <input
                        type="text"
                        value={activeScenario.name}
                        disabled={isClosed}
                        onChange={(e) => onRenameScenario(e.target.value)}
                        className={`
                            block w-full sm:text-sm rounded-md transition-colors
                            ${isClosed 
                                ? 'bg-gray-100 text-gray-500 border-gray-300 cursor-not-allowed' 
                                : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500 border'}
                        `}
                    />
                    {!isClosed && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Edit2 className="h-4 w-4 text-gray-400" />
                        </div>
                    )}
                 </div>
            </div>
          )}

          <div className="mt-6 md:mt-4 md:ml-2">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${isClosed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {isClosed ? 'CERRADO (SOLO LECTURA)' : 'BORRADOR (EDITABLE)'}
             </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 md:mt-0">
          <button
            onClick={onCreateScenario}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo
          </button>
          
          {activeScenario && (
             <>
               <button
                onClick={onDuplicateScenario}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                disabled={!isClosed} 
                title={!isClosed ? "Cierre el escenario actual para crear una copia" : "Duplicar escenario"}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicar
              </button>

              {!isClosed && (
                <button
                  onClick={onCloseScenario}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none shadow-sm"
                >
                  <Lock className="h-4 w-4 mr-1" />
                  Cerrar y Guardar
                </button>
              )}
             </>
          )}
        </div>
      </div>
      
      {activeScenario && (
        <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-4">
            <span><strong>ID:</strong> {activeScenario.id}</span>
            <span><strong>Tipo:</strong> {activeScenario.type}</span>
            <span><strong>Base Origen:</strong> {activeScenario.baseScenarioId ? scenarios.find(s=>s.id === activeScenario.baseScenarioId)?.name : 'N/A'}</span>
            <span><strong>Creado:</strong> {new Date(activeScenario.createdAt).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
};

export default ScenarioHeader;