import React, { useMemo } from 'react';
import { Scenario, ScenarioStatus, DateRange, ScenarioType } from '../types';
import { Calendar, AlertCircle, Plus, Trash2, Tag } from 'lucide-react';
import { validateScenarioDates } from '../utils';
import { getItemsByCategory } from '../constants';

interface Props {
  scenario: Scenario;
  onUpdateParams: (params: Partial<Scenario['params']>) => void;
}

// Sub-component for rendering a list of date ranges
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
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs py-1.5 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                value={range.start}
                disabled={isReadOnly}
                onChange={(e) => onUpdate(range.id, 'start', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-gray-500 mb-1 uppercase tracking-wide">Fin ({idx + 1})</label>
              <input
                type="date"
                className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-xs py-1.5 ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
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
  // -------------------------------------------------------------------------
  // 1. DEFINICIÓN DE SOLO LECTURA
  // Si el estado es CLOSED o el tipo es FINAL, se bloquea la edición.
  // -------------------------------------------------------------------------
  const isReadOnly = scenario.status === ScenarioStatus.CLOSED || scenario.type === ScenarioType.FINAL;
  
  const category = scenario.category || 'LIFT';
  const isRental = category !== 'LIFT';
  
  // Obtener items si es rental
  const rentalItems = useMemo(() => isRental ? getItemsByCategory(category) : [], [category, isRental]);

  // Real-time validation
  const dateError = useMemo(() => validateScenarioDates(scenario.params), [scenario.params]);

  const handleChange = (field: keyof Scenario['params'], value: string) => {
    if (isReadOnly) return;
    const isDate = field === 'validFrom' || field === 'validTo';
    const finalValue = isDate ? value : (parseFloat(value) || 0);
    onUpdateParams({ [field]: finalValue });
  };

  // -------------------------------------------------------------------------
  // 2. CORRECCIÓN DEL HANDLER (Fix TS2872)
  // Eliminamos el "|| {}" redundante.
  // -------------------------------------------------------------------------
  const handleRentalPriceChange = (itemId: string, value: string) => {
    if (isReadOnly) return;
    
    // Spread siempre crea un objeto, no es necesario "|| {}"
    const currentPrices = { ...scenario.params.rentalBasePrices };
    
    currentPrices[itemId] = parseFloat(value) || 0;
    onUpdateParams({ rentalBasePrices: currentPrices });
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
    <div className="p-6 bg-white shadow-sm rounded-lg max-w-5xl mx-auto mt-6 mb-12">
      <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center gap-2">
         Configuración de Parámetros <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-normal uppercase">{category.replace('_', ' ')}</span>
         {isReadOnly && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded border border-red-200">Solo Lectura</span>}
      </h2>

      {dateError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r animate-pulse">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Error en Fechas</h3>
            <p className="text-red-700 text-sm">{dateError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

        {/* COLUMNA 1: PRECIOS BASE (Dinámica según categoría) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* CASO 1: PASES (LIFT) */}
            {!isRental && (
                <div className={`bg-blue-50 p-5 rounded-lg border border-blue-100 shadow-sm ${isReadOnly ? 'opacity-90' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="text-blue-600" size={18} />
                        <h3 className="font-bold text-blue-900">Tarifa Base (Pase Diario)</h3>
                    </div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Precio Adulto 1 Día (Base de cálculo)</label>
                    <div className="relative rounded-md shadow-sm max-w-xs">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                            type="number"
                            disabled={isReadOnly}
                            value={scenario.params.baseRateAdult1Day}
                            onChange={(e) => handleChange('baseRateAdult1Day', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={`block w-full pl-7 pr-12 text-lg font-bold border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                        />
                    </div>
                </div>
            )}

            {/* CASO 2: RENTAL (Lista de Artículos) */}
            {isRental && (
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                        <Tag className="text-slate-600" size={18} />
                        <h3 className="font-bold text-slate-800">Precios Base por Artículo (Unitario)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* --------------------------------------------------------------- */}
                        {/* PARTE 2: ACTUALIZACIÓN DEL MAP EN JSX                           */}
                        {/* Aquí se generan los inputs y se bloquean si isReadOnly es true  */}
                        {/* --------------------------------------------------------------- */}
                        {rentalItems.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded border border-gray-200 hover:border-blue-300 transition-colors">
                                <label className="block text-xs font-bold text-gray-600 mb-1 truncate" title={item.label}>
                                    {item.label}
                                </label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-xs">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        
                                        // AQUI ESTÁ EL CANDADO VISUAL
                                        disabled={isReadOnly}
                                        
                                        value={scenario.params.rentalBasePrices?.[item.id] || 0}
                                        onChange={(e) => handleRentalPriceChange(item.id, e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                        
                                        // ESTILOS CONDICIONALES
                                        className={`block w-full pl-6 pr-2 py-1 text-sm font-semibold border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                                        
                                        placeholder="0.00"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-[10px]">{item.pricingUnit === 'HOUR' ? '/hora' : '/día'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-3 italic">
                        * Ingrese el valor base unitario. El sistema aplicará aumentos y coeficientes automáticamente.
                    </p>
                </div>
            )}
        </div>

        {/* COLUMNA 2: AJUSTES GLOBALES */}
        <div className="space-y-4">
            
            <div className={`bg-orange-50 p-4 rounded-md border border-orange-100 ${isReadOnly ? 'opacity-80' : ''}`}>
                <label className="block text-sm font-bold text-orange-900 mb-1">% Aumento Proyectado</label>
                <p className="text-xs text-orange-700 mb-2">Aplica sobre todos los precios base.</p>
                <div className="relative rounded-md shadow-sm">
                    <input
                        type="number"
                        step="0.1"
                        disabled={isReadOnly}
                        value={scenario.params.increasePercentage}
                        onChange={(e) => handleChange('increasePercentage', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`block w-full pr-12 text-lg font-bold border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                </div>
            </div>

            <div className={`bg-gray-50 p-4 rounded-md border border-gray-200 ${isReadOnly ? 'opacity-80' : ''}`}>
                <label className="block text-sm font-bold text-gray-700 mb-1">Múltiplo de Redondeo</label>
                <p className="text-xs text-gray-500 mb-2">Ajuste final del precio visual.</p>
                <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        disabled={isReadOnly}
                        value={scenario.params.roundingValue}
                        onChange={(e) => handleChange('roundingValue', e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className={`block w-full pl-7 text-lg border-gray-300 rounded-md focus:ring-gray-500 focus:border-gray-500 ${isReadOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}`}
                    />
                </div>
            </div>

            {/* Descuentos de Promo/Menor */}
            {!isRental && (
                <div className="grid grid-cols-2 gap-4">
                    <div className={`bg-green-50 p-3 rounded border border-green-100 ${isReadOnly ? 'opacity-80' : ''}`}>
                        <label className="block text-xs font-bold text-green-900 mb-1">% Dto. Promo</label>
                        <input
                            type="number"
                            step="0.1"
                            disabled={isReadOnly}
                            value={scenario.params.promoDiscountPercentage}
                            onChange={(e) => handleChange('promoDiscountPercentage', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={`block w-full border-gray-300 rounded-md shadow-sm text-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                    </div>
                    <div className={`bg-purple-50 p-3 rounded border border-purple-100 ${isReadOnly ? 'opacity-80' : ''}`}>
                        <label className="block text-xs font-bold text-purple-900 mb-1">% Dto. Menor</label>
                        <input
                            type="number"
                            step="0.1"
                            disabled={isReadOnly}
                            value={scenario.params.minorDiscountPercentage}
                            onChange={(e) => handleChange('minorDiscountPercentage', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className={`block w-full border-gray-300 rounded-md shadow-sm text-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        />
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="text-gray-600" /> Configuración de Fechas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Fin Vigencia</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={scenario.params.validTo}
                  onChange={(e) => handleChange('validTo', e.target.value)}
                  className={`block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
            </div>
          </div>

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