import React, { useMemo } from 'react';
import { Scenario, ScenarioStatus, DateRange } from '../types';
import { Calendar, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { validateScenarioDates } from '../utils';

interface Props {
  scenario: Scenario;
  onUpdateParams: (params: Partial<Scenario['params']>) => void;
}

// Sub-component for rendering a list of date ranges to prevent focus loss issues
const DateRangeSection = ({
  title,
  ranges,
  onAdd,
  onRemove,
  onUpdate,
  isReadOnly,
  colorClass,
  headerColor
}: {
  title: string;
  ranges: DateRange[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: 'start' | 'end', value: string) => void;
  isReadOnly: boolean;
  colorClass: string;
  headerColor: string;
}) => {
  return (
    <div className={`border-l-4 pl-4 md:pl-6 ${colorClass} mt-2`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`font-bold text-sm uppercase ${headerColor}`}>
          {title}
        </h4>
        {!isReadOnly && (
          <button
            onClick={onAdd}
            className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
          >
            <Plus size={12} /> Agregar Periodo
          </button>
        )}
      </div>

      <div className="space-y-3">
        {ranges && ranges.map((range, idx) => (
          <div key={range.id} className="flex items-end gap-2 p-3 bg-gray-50/50 rounded-md border border-gray-200 relative group transition-colors hover:bg-white hover:shadow-sm">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Inicio ({idx + 1})</label>
              <input
                type="date"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs py-1.5 ${isReadOnly ? 'bg-gray-100' : 'bg-white'}`}
                value={range.start}
                disabled={isReadOnly}
                onChange={(e) => onUpdate(range.id, 'start', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Fin ({idx + 1})</label>
              <input
                type="date"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs py-1.5 ${isReadOnly ? 'bg-gray-100' : 'bg-white'}`}
                value={range.end}
                disabled={isReadOnly}
                onChange={(e) => onUpdate(range.id, 'end', e.target.value)}
              />
            </div>
            {!isReadOnly && (
              <button
                onClick={() => onRemove(range.id)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded mb-0.5 transition-all"
                title="Eliminar rango"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
        {(!ranges || ranges.length === 0) && (
          <div className="text-center p-3 border border-dashed border-gray-300 rounded-lg bg-gray-50">
            <p className="text-xs text-gray-500 italic">No hay rangos definidos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ParametersSheet: React.FC<Props> = ({ scenario, onUpdateParams }) => {
  const isReadOnly = scenario.status === ScenarioStatus.CLOSED;

  // Real-time validation
  const dateError = useMemo(() => validateScenarioDates(scenario.params), [scenario.params]);

  const handleChange = (field: keyof Scenario['params'], value: string) => {
    if (isReadOnly) return;
    // Handle top-level fields (dates or numbers)
    const isDate = field === 'validFrom' || field === 'validTo';
    const finalValue = isDate ? value : (parseFloat(value) || 0);
    onUpdateParams({ [field]: finalValue });
  };

  // --- Date Range Handlers ---
  const handleAddRange = (field: 'regularSeasons' | 'promoSeasons') => {
    if (isReadOnly) return;
    const currentList = scenario.params[field] || [];
    const newId = `${field.charAt(0)}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newList = [...currentList, { id: newId, start: '', end: '' }];
    onUpdateParams({ [field]: newList });
  };

  const handleRemoveRange = (field: 'regularSeasons' | 'promoSeasons', rangeId: string) => {
    if (isReadOnly) return;
    const currentList = scenario.params[field] || [];
    const newList = currentList.filter(r => r.id !== rangeId);
    onUpdateParams({ [field]: newList });
  };

  const handleUpdateRange = (field: 'regularSeasons' | 'promoSeasons', rangeId: string, subField: 'start' | 'end', val: string) => {
    if (isReadOnly) return;
    const currentList = scenario.params[field] || [];
    const newList = currentList.map(r => r.id === rangeId ? { ...r, [subField]: val } : r);
    onUpdateParams({ [field]: newList });
  };

  return (
    <div className="p-6 bg-white shadow-sm rounded-lg max-w-4xl mx-auto mt-6 mb-12">
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">Parámetros del Escenario</h2>

      {dateError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r animate-pulse">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Error en Fechas</h3>
            <p className="text-red-700 text-sm">{dateError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
            <label className="block text-sm font-medium text-blue-900">Tarifa Adulto 1 Día (Base)</label>
            <p className="text-xs text-blue-700 mb-2">Base inicial para el cálculo (Editable).</p>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                disabled={isReadOnly}
                value={scenario.params.baseRateAdult1Day}
                onChange={(e) => handleChange('baseRateAdult1Day', e.target.value)}
                className={`focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-lg border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-100 text-gray-500' : 'bg-white text-gray-900'}`}
              />
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-md border border-orange-100">
            <label className="block text-sm font-medium text-orange-900">% Aumento Proyectado</label>
            <p className="text-xs text-orange-700 mb-2">Se aplica sobre la tarifa base.</p>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="number"
                step="0.1"
                disabled={isReadOnly}
                value={scenario.params.increasePercentage}
                onChange={(e) => handleChange('increasePercentage', e.target.value)}
                className="focus:ring-orange-500 focus:border-orange-500 block w-full pr-12 sm:text-lg border-gray-300 rounded-md"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-md border border-green-100">
              <label className="block text-sm font-medium text-green-900">% Dto. Promo</label>
              <p className="text-xs text-green-700 mb-2">Temp Baja.</p>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  disabled={isReadOnly}
                  value={scenario.params.promoDiscountPercentage}
                  onChange={(e) => handleChange('promoDiscountPercentage', e.target.value)}
                  className="focus:ring-green-500 focus:border-green-500 block w-full pr-8 sm:text-lg border-gray-300 rounded-md"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-md border border-purple-100">
              <label className="block text-sm font-medium text-purple-900">% Dto. Menor</label>
              <p className="text-xs text-purple-700 mb-2">Usualmente 30%.</p>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  type="number"
                  step="0.1"
                  disabled={isReadOnly}
                  value={scenario.params.minorDiscountPercentage}
                  onChange={(e) => handleChange('minorDiscountPercentage', e.target.value)}
                  className="focus:ring-purple-500 focus:border-purple-500 block w-full pr-8 sm:text-lg border-gray-300 rounded-md"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <label className="block text-sm font-medium text-gray-700">Múltiplo de Redondeo</label>
            <p className="text-xs text-gray-500 mb-2">Adulto (Cielo), Menor (Piso).</p>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                disabled={isReadOnly}
                value={scenario.params.roundingValue}
                onChange={(e) => handleChange('roundingValue', e.target.value)}
                className="focus:ring-gray-500 focus:border-gray-500 block w-full pl-7 sm:text-lg border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="text-gray-600" /> Configuración de Fechas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* VIGENCIA GENERAL */}
          <div className="col-span-1 md:col-span-2 bg-slate-50 p-5 rounded-lg border border-slate-200">
            <h4 className="font-bold text-sm text-slate-700 uppercase mb-4 tracking-wide border-b pb-2">Vigencia General del Tarifario</h4>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Inicio Vigencia</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={scenario.params.validFrom}
                  onChange={(e) => handleChange('validFrom', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fin Vigencia</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={scenario.params.validTo}
                  onChange={(e) => handleChange('validTo', e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* SEASONS */}
          <DateRangeSection
            title="Temporada Regular"
            ranges={scenario.params.regularSeasons}
            onAdd={() => handleAddRange('regularSeasons')}
            onRemove={(id) => handleRemoveRange('regularSeasons', id)}
            onUpdate={(id, field, val) => handleUpdateRange('regularSeasons', id, field, val)}
            isReadOnly={isReadOnly}
            colorClass="border-castor-red"
            headerColor="text-castor-red"
          />

          <DateRangeSection
            title="Temporada Promocional"
            ranges={scenario.params.promoSeasons}
            onAdd={() => handleAddRange('promoSeasons')}
            onRemove={(id) => handleRemoveRange('promoSeasons', id)}
            onUpdate={(id, field, val) => handleUpdateRange('promoSeasons', id, field, val)}
            isReadOnly={isReadOnly}
            colorClass="border-castor-blue"
            headerColor="text-castor-blue"
          />
        </div>
      </div>

    </div>
  );
};

export default ParametersSheet;