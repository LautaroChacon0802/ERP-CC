import React from 'react';
import { Scenario, ScenarioStatus } from '../types';
import { Plus, Copy, Save, XCircle } from 'lucide-react';

interface Props {
  scenarios: Scenario[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  onRenameScenario: (name: string) => void;
  onUpdateSeason?: (season: number) => void; // Nuevo prop para editar año
  onCreateScenario: () => void;
  onDuplicateScenario: () => void;
  onCloseScenario: () => void;
  onDiscardDraft?: () => void; // Nuevo prop para cancelar
}

const ScenarioHeader: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onRenameScenario,
  onUpdateSeason,
  onCreateScenario,
  onDuplicateScenario,
  onCloseScenario,
  onDiscardDraft
}) => {
  const activeScenario = scenarios.find(s => s.id === activeScenarioId);
  const isDraft = activeScenario?.status === ScenarioStatus.DRAFT;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* SECCIÓN IZQUIERDA: SELECTOR Y EDICIÓN */}
        <div className="flex-1 w-full md:w-auto flex flex-col gap-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Seleccionar Escenario
            </label>
            
            <div className="flex gap-2">
                <select
                    value={activeScenarioId}
                    onChange={(e) => onSelectScenario(e.target.value)}
                    className="block w-full md:w-64 border-gray-300 rounded-md shadow-sm focus:ring-castor-red focus:border-castor-red sm:text-sm"
                >
                    <option value="" disabled>-- Elegir --</option>
                    {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                           {s.season > 0 ? s.season : '----'} | {s.name || '(Sin Nombre)'} {s.status === ScenarioStatus.DRAFT ? '(BORRADOR)' : ''}
                        </option>
                    ))}
                </select>

                <button
                    onClick={onCreateScenario}
                    disabled={scenarios.some(s => s.status === ScenarioStatus.DRAFT)} // Bloquear si ya hay un borrador
                    className="flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-castor-red hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Nuevo Borrador"
                >
                    <Plus size={16} className="mr-1" /> Nuevo
                </button>
            </div>

            {/* BARRA DE EDICIÓN DEL BORRADOR (Solo visible si es Draft) */}
            {isDraft && activeScenario && (
                <div className="flex items-center gap-2 mt-2 animate-fadeIn bg-yellow-50 p-2 rounded border border-yellow-200">
                    <div className="w-24">
                         <label className="block text-[10px] text-gray-500 font-bold mb-1">AÑO</label>
                         <input
                            type="number"
                            placeholder="Ej: 2026"
                            // Si es 0 mostramos vacío, si no, el valor
                            value={activeScenario.season === 0 ? '' : activeScenario.season}
                            onChange={(e) => onUpdateSeason && onUpdateSeason(parseInt(e.target.value) || 0)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm font-bold text-center h-9"
                            autoFocus // Foco automático al crear
                         />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] text-gray-500 font-bold mb-1">NOMBRE DEL TARIFARIO</label>
                        <input
                            type="text"
                            placeholder="Ej: Preventa Junio (Escribe un nombre)"
                            value={activeScenario.name}
                            onChange={(e) => onRenameScenario(e.target.value)}
                            className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm h-9"
                        />
                    </div>
                </div>
            )}
        </div>

        {/* SECCIÓN DERECHA: ACCIONES */}
        <div className="flex gap-2 w-full md:w-auto justify-end items-end h-full mt-auto">
            {isDraft ? (
                <>
                    {/* BOTÓN CANCELAR */}
                    <button
                        onClick={onDiscardDraft}
                        className="flex items-center px-4 py-2 border border-red-200 text-sm font-bold rounded-md text-red-600 bg-white hover:bg-red-50 shadow-sm transition-colors h-10"
                        title="Descartar borrador y volver atrás"
                    >
                        <XCircle size={16} className="mr-2" />
                        Cancelar
                    </button>

                    <button
                        onClick={onCloseScenario}
                        className="flex items-center px-4 py-2 border border-transparent text-sm font-bold rounded-md text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors h-10"
                        title="Guardar definitivamente en Base de Datos"
                    >
                        <Save size={16} className="mr-2" />
                        Cerrar y Guardar
                    </button>
                </>
            ) : (
                activeScenario && (
                    <button
                        onClick={onDuplicateScenario}
                        className="flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 shadow-sm transition-colors h-10"
                    >
                        <Copy size={16} className="mr-2 text-gray-500" />
                        Clonar Escenario
                    </button>
                )
            )}
        </div>
      </div>
    </div>
  );
};

export default ScenarioHeader;