import React from 'react';
import { Scenario, ScenarioStatus } from '../types';
import { 
  ChevronDown, 
  Copy, 
  Trash2, 
  Save, 
  Edit3, 
  Plus
} from 'lucide-react';

interface ScenarioHeaderProps {
  scenarios: Scenario[];
  activeScenario: Scenario | undefined;
  onSelectScenario: (id: string) => void;
  onCreateScenario: () => void;
  onCloneScenario: () => void;
  onRenameScenario: (name: string) => void;
  onUpdateSeason: (season: number) => void;
  onDiscardDraft: () => void;
  onCloseScenario: () => void;
}

const ScenarioHeader: React.FC<ScenarioHeaderProps> = ({
  scenarios,
  activeScenario,
  onSelectScenario,
  onCreateScenario,
  onCloneScenario,
  onRenameScenario,
  onUpdateSeason,
  onDiscardDraft,
  onCloseScenario
}) => {
  return (
    <div className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Left Section: Selector & New Button */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        
        {/* NUEVO BOTÓN SOLICITADO */}
        <button
            onClick={onCreateScenario}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm text-sm font-medium"
        >
            <Plus size={16} />
            Nuevo
        </button>

        <div className="relative flex-1 md:flex-none">
          <select
            value={activeScenario?.id || ''}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="block w-full md:w-64 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="" disabled>Seleccionar escenario...</option>
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || '(Sin Nombre)'} — {s.season} [{s.status === ScenarioStatus.DRAFT ? 'Borrador' : 'Final'}]
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Section: Actions */}
      {activeScenario && (
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          <div className="flex flex-col md:flex-row gap-2 mr-4">
             <input 
                type="text" 
                value={activeScenario.name} 
                onChange={(e) => onRenameScenario(e.target.value)}
                placeholder="Nombre del Tarifario"
                disabled={activeScenario.status === ScenarioStatus.CLOSED}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-40 md:w-48"
             />
             <input 
                type="number" 
                value={activeScenario.season || ''} 
                onChange={(e) => onUpdateSeason(Number(e.target.value))}
                placeholder="Año"
                disabled={activeScenario.status === ScenarioStatus.CLOSED}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-20"
             />
          </div>

          <button
            onClick={onCloneScenario}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Clonar Escenario"
          >
            <Copy size={18} />
          </button>

          {activeScenario.status === ScenarioStatus.DRAFT && (
            <>
                <div className="h-6 w-px bg-gray-300 mx-2" />
                
                <button
                    onClick={onDiscardDraft}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded text-sm font-medium transition-colors"
                >
                    <Trash2 size={16} />
                    Descartar
                </button>

                <button
                    onClick={onCloseScenario}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm text-sm font-medium transition-colors"
                >
                    <Save size={16} />
                    Publicar
                </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ScenarioHeader;