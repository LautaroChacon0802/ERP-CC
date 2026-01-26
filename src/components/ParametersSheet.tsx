import React, { useMemo } from 'react';
import { Scenario, ScenarioStatus, DateRange, ScenarioType } from '../types';
import { Calendar, AlertCircle, Plus, Trash2, Tag, Lock } from 'lucide-react';
import { validateScenarioDates } from '../utils';
import { getItemsByCategory } from '../constants';

interface Props {
  scenario: Scenario;
  onUpdateParams: (params: Partial<Scenario['params']>) => void;
}

// Helper component para rangos de fechas (simplificado para el ejemplo)
const DateRangeSection = ({
  title, ranges, onAdd, onRemove, onUpdate, isReadOnly, colorClass, headerColor
}: any) => {
  return (
    <div className={`border-l-4 pl-4 md:pl-6 ${colorClass} mt-2`}>
      <div className="flex justify-between items-center mb-3">
        <h4 className={`font-bold text-sm uppercase ${headerColor}`}>{title}</h4>
        {!isReadOnly && (
          <button onClick={onAdd} className="text-xs flex items-center gap-1 bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-gray-600 shadow-sm">
            <Plus size={12} /> Agregar
          </button>
        )}
      </div>
      <div className="space-y-3">
        {ranges?.map((range: any, idx: number) => (
          <div key={range.id} className="flex gap-2 p-2 bg-gray-50 border rounded relative">
             <input type="date" disabled={isReadOnly} value={range.start} onChange={(e) => onUpdate(range.id, 'start', e.target.value)} className={`text-xs border rounded p-1 ${isReadOnly ? 'bg-gray-200' : 'bg-white'}`} />
             <input type="date" disabled={isReadOnly} value={range.end} onChange={(e) => onUpdate(range.id, 'end', e.target.value)} className={`text-xs border rounded p-1 ${isReadOnly ? 'bg-gray-200' : 'bg-white'}`} />
             {!isReadOnly && <button onClick={() => onRemove(range.id)} className="text-red-400"><Trash2 size={14}/></button>}
          </div>
        ))}
        {(!ranges || ranges.length === 0) && <p className="text-xs text-gray-400 italic">Sin rangos definidos.</p>}
      </div>
    </div>
  );
};

const ParametersSheet: React.FC<Props> = ({ scenario, onUpdateParams }) => {
  // =========================================================================
  // LOGICA DE PERMISOS UI
  // =========================================================================
  const isReadOnly = useMemo(() => {
    // 1. Regla de Estado: Si está cerrado o es Final -> Bloqueado
    if (scenario.status === ScenarioStatus.CLOSED) return true;
    if (scenario.type === ScenarioType.FINAL) return true;
    
    // 2. Aquí podrías agregar lógica de usuario en el futuro
    // const { user } = useAuth();
    // if (user.role !== 'ADMIN' && scenario.status === 'LOCKED') return true;
    
    return false;
  }, [scenario.status, scenario.type]);

  const category = scenario.category || 'LIFT';
  const isRental = category !== 'LIFT';
  const rentalItems = useMemo(() => isRental ? getItemsByCategory(category) : [], [category, isRental]);
  const dateError = useMemo(() => validateScenarioDates(scenario.params), [scenario.params]);

  // Handlers seguros
  const handleChange = (field: keyof Scenario['params'], value: string) => {
    if (isReadOnly) return;
    const isDate = field === 'validFrom' || field === 'validTo';
    const finalValue = isDate ? value : (parseFloat(value) || 0);
    onUpdateParams({ [field]: finalValue });
  };

  const handleRentalPriceChange = (itemId: string, value: string) => {
    if (isReadOnly) return;
    const currentPrices = { ...scenario.params.rentalBasePrices };
    currentPrices[itemId] = parseFloat(value) || 0;
    onUpdateParams({ rentalBasePrices: currentPrices });
  };

  // Generic Date Range Handlers (simplificado)
  const handleUpdateRange = (field: string, id: string, subField: string, val: string) => {
     if (isReadOnly) return;
     const list = (scenario.params as any)[field] || [];
     const newList = list.map((r: any) => r.id === id ? { ...r, [subField]: val } : r);
     onUpdateParams({ [field]: newList });
  };

  // ... (Add and Remove handlers would be similar) ...
  const handleAddRange = (field: 'regularSeasons' | 'promoSeasons') => {
    if (isReadOnly) return;
    const currentList = scenario.params[field] || [];
    const newId = `${field.charAt(0)}-${Date.now()}`;
    onUpdateParams({ [field]: [...currentList, { id: newId, start: '', end: '' }] });
  };

  const handleRemoveRange = (field: 'regularSeasons' | 'promoSeasons', id: string) => {
    if (isReadOnly) return;
    const currentList = scenario.params[field] || [];
    onUpdateParams({ [field]: currentList.filter(r => r.id !== id) });
  };

  return (
    <div className="p-6 bg-white shadow-sm rounded-lg max-w-5xl mx-auto mt-6 mb-12">
      {/* HEADER DE ESTADO */}
      <div className="flex justify-between items-center mb-6 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           Configuración de Parámetros 
           <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-normal uppercase">{category.replace('_', ' ')}</span>
        </h2>
        {isReadOnly && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1 rounded border border-red-200">
            <Lock size={14} />
            <span className="text-xs font-bold uppercase">Solo Lectura (Cerrado)</span>
          </div>
        )}
      </div>

      {dateError && (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start gap-3 rounded-r">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-800 font-bold text-sm">Configuración Incompleta</h3>
            <p className="text-red-700 text-sm">{dateError}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* COLUMNA 1: PRECIOS */}
        <div className="lg:col-span-2 space-y-6">
            {!isRental && (
                <div className={`bg-blue-50 p-5 rounded-lg border border-blue-100 ${isReadOnly ? 'opacity-75 grayscale' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Tag className="text-blue-600" size={18} />
                        <h3 className="font-bold text-blue-900">Tarifa Base (Pase Diario)</h3>
                    </div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Precio Adulto 1 Día</label>
                    <input
                        type="number"
                        disabled={isReadOnly}
                        value={scenario.params.baseRateAdult1Day}
                        onChange={(e) => handleChange('baseRateAdult1Day', e.target.value)}
                        className={`block w-full text-lg font-bold border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'}`}
                    />
                </div>
            )}

            {isRental && (
                <div className={`bg-slate-50 p-5 rounded-lg border border-slate-200 ${isReadOnly ? 'opacity-80' : ''}`}>
                    <h3 className="font-bold text-slate-800 mb-4">Precios Base por Artículo</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {rentalItems.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded border border-gray-200">
                                <label className="block text-xs font-bold text-gray-600 mb-1">{item.label}</label>
                                <div className="relative">
                                    <span className="absolute left-2 top-1.5 text-gray-400 text-xs">$</span>
                                    <input
                                        type="number"
                                        disabled={isReadOnly}
                                        value={scenario.params.rentalBasePrices?.[item.id] || 0}
                                        onChange={(e) => handleRentalPriceChange(item.id, e.target.value)}
                                        className={`block w-full pl-6 text-sm font-semibold border-gray-300 rounded ${isReadOnly ? 'bg-gray-100 text-gray-500' : ''}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* COLUMNA 2: AJUSTES */}
        <div className="space-y-4">
            <div className={`bg-orange-50 p-4 rounded-md border border-orange-100 ${isReadOnly ? 'opacity-75' : ''}`}>
                <label className="block text-sm font-bold text-orange-900 mb-1">% Aumento</label>
                <input
                    type="number"
                    step="0.1"
                    disabled={isReadOnly}
                    value={scenario.params.increasePercentage}
                    onChange={(e) => handleChange('increasePercentage', e.target.value)}
                    className={`block w-full font-bold border-gray-300 rounded-md ${isReadOnly ? 'bg-gray-200' : 'bg-white'}`}
                />
            </div>
            {/* ... Resto de inputs (redondeo, etc) con la misma lógica disabled={isReadOnly} ... */}
        </div>
      </div>

      {/* FECHAS */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="text-gray-600" /> Configuración de Fechas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Componentes DateRangeSection usan isReadOnly internamente */}
             <DateRangeSection 
                title="Temporada Regular" 
                ranges={scenario.params.regularSeasons} 
                onAdd={() => handleAddRange('regularSeasons')}
                onRemove={(id: string) => handleRemoveRange('regularSeasons', id)}
                onUpdate={(id: string, f: string, v: string) => handleUpdateRange('regularSeasons', id, f, v)}
                isReadOnly={isReadOnly} 
                colorClass="border-castor-red" headerColor="text-castor-red" 
             />
             <DateRangeSection 
                title="Temporada Promocional" 
                ranges={scenario.params.promoSeasons} 
                onAdd={() => handleAddRange('promoSeasons')}
                onRemove={(id: string) => handleRemoveRange('promoSeasons', id)}
                onUpdate={(id: string, f: string, v: string) => handleUpdateRange('promoSeasons', id, f, v)}
                isReadOnly={isReadOnly} 
                colorClass="border-castor-blue" headerColor="text-castor-blue" 
             />
        </div>
      </div>
    </div>
  );
};

export default ParametersSheet;