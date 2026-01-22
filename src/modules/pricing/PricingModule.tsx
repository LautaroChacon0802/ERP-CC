import React, { useEffect } from 'react';
import { useScenarioManager } from '../../hooks/useScenarioManager';
import ScenarioHeader from '../../components/ScenarioHeader';
import SheetTabs from '../../components/SheetTabs';
import ParametersSheet from '../../components/ParametersSheet';
import CoefficientsSheet from '../../components/CoefficientsSheet';
import DataSheet from '../../components/DataSheet';
import HistorySheet from '../../components/HistorySheet';
import ComparisonSheet from '../../components/ComparisonSheet';
import ToastSystem from '../../components/ToastSystem';
import { Loader2, ArrowLeft, Layers } from 'lucide-react';
import CastorLogo from '../../components/CastorLogo';
import { SCENARIO_CATEGORIES } from '../../constants';

interface Props {
    onBack: () => void;
}

const PricingModule: React.FC<Props> = ({ onBack }) => {
  const {
    filteredScenarios, // Usamos la lista filtrada
    selectedCategory,
    setSelectedCategory,
    activeScenarioId,
    activeScenario,
    history,
    isLoading,
    loadingMessage,
    activeTab,
    toasts,
    removeToast,
    setActiveTab,
    setActiveScenarioId,
    createScenario,
    duplicateScenario,
    renameScenario,
    updateSeason,
    discardDraft,
    closeScenario,
    updateParams,
    updateCoefficient
  } = useScenarioManager();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      
      <ToastSystem toasts={toasts} removeToast={removeToast} />

      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-castor-red animate-spin mb-4" />
          <p className="text-lg font-semibold text-gray-700">{loadingMessage}</p>
        </div>
      )}

      {/* HEADER PRINCIPAL */}
      <header className="bg-castor-red text-white shadow-lg border-b-4 border-slate-900 z-20">
        <div className="p-4 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
                onClick={onBack}
                className="bg-red-800 hover:bg-red-900 p-2 rounded text-white transition-colors"
                title="Volver al Menú"
             >
                <ArrowLeft size={24} />
             </button>
             <div className="bg-white p-2 rounded-lg shadow-sm flex items-center justify-center">
               <CastorLogo className="h-16 w-auto" />
             </div>
             <div>
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">MATRIZ TARIFARIA</h1>
                <p className="text-xs text-white/80 font-medium tracking-wide">Gestión Comercial y Tarifaria</p>
             </div>
          </div>
          <div className="text-right hidden md:block">
            <span className="block text-sm font-semibold text-white/90">Módulo Pricing</span>
          </div>
        </div>
        
        {/* BARRA DE NAVEGACIÓN DE CATEGORÍAS */}
        <div className="bg-slate-900 text-white/80">
            <div className="max-w-7xl mx-auto flex overflow-x-auto">
                {SCENARIO_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`
                            flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-4
                            ${selectedCategory === cat.id 
                                ? 'bg-slate-800 text-white border-castor-red' 
                                : 'border-transparent hover:bg-slate-800 hover:text-white text-gray-400'}
                        `}
                    >
                        {selectedCategory === cat.id && <Layers size={14} className="text-castor-red" />}
                        {cat.label}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col max-w-7xl mx-auto w-full z-10">
        
        {/* HEADER DEL ESCENARIO (SELECTOR) */}
        {/* Le pasamos 'filteredScenarios' para que el dropdown solo muestre los de la categoría actual */}
        <ScenarioHeader 
          scenarios={filteredScenarios} 
          activeScenarioId={activeScenarioId}
          onSelectScenario={setActiveScenarioId}
          onRenameScenario={renameScenario}
          onUpdateSeason={updateSeason}
          onCreateScenario={createScenario}
          onDuplicateScenario={duplicateScenario}
          onCloseScenario={closeScenario}
          onDiscardDraft={discardDraft}
        />

        {activeScenario ? (
          <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <SheetTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="flex-1 overflow-auto bg-gray-50">
              {activeTab === 'params' && (
                <ParametersSheet 
                  scenario={activeScenario} 
                  onUpdateParams={updateParams} 
                />
              )}
              {activeTab === 'coef' && (
                <CoefficientsSheet 
                  scenario={activeScenario}
                  onUpdateCoefficient={updateCoefficient}
                />
              )}
              {/* Estas vistas las actualizaremos en la ETAPA 4 para soportar múltiples columnas */}
              {activeTab === 'matrix' && (
                <DataSheet scenario={activeScenario} viewMode="matrix" />
              )}
              {activeTab === 'visual' && (
                <DataSheet scenario={activeScenario} viewMode="visual" />
              )}
              {activeTab === 'system' && (
                <DataSheet scenario={activeScenario} viewMode="system" />
              )}
              
              {/* El historial ahora debería filtrar también, pero por ahora muestra todo. 
                  En una futura mejora podemos pasarle 'category' al HistorySheet */}
              {activeTab === 'history' && (
                <HistorySheet history={history} />
              )}
              {activeTab === 'compare' && (
                <ComparisonSheet history={history} />
              )}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
               <Layers size={48} className="mb-4 opacity-20" />
               <p className="text-lg font-medium">No hay tarifarios cargados en {SCENARIO_CATEGORIES.find(c => c.id === selectedCategory)?.label}.</p>
               <p className="text-sm">Crea uno nuevo usando el botón "+ Nuevo" de arriba.</p>
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default PricingModule;