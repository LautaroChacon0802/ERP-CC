
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
import { Loader2, ArrowLeft } from 'lucide-react';
import CastorLogo from '../../components/CastorLogo';
import { runPricingTests } from '../../qa/pricingTests';

interface Props {
    onBack: () => void;
}

const PricingModule: React.FC<Props> = ({ onBack }) => {
  const {
    scenarios,
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
    closeScenario,
    updateParams,
    updateCoefficient
  } = useScenarioManager();

  useEffect(() => {
    console.log("Running QA Integrity Checks...");
    runPricingTests();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      
      <ToastSystem toasts={toasts} removeToast={removeToast} />

      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-castor-red animate-spin mb-4" />
          <p className="text-lg font-semibold text-gray-700">{loadingMessage}</p>
        </div>
      )}

      <header className="bg-castor-red text-white p-4 shadow-lg border-b-4 border-slate-900 z-20">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
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
                <h1 className="text-2xl font-black tracking-tighter uppercase leading-none">CASTOR TARIFF LAB</h1>
                <p className="text-xs text-white/80 font-medium tracking-wide">Gestión Comercial y Tarifaria</p>
             </div>
          </div>
          <div className="text-right hidden md:block">
            <span className="block text-sm font-semibold text-white/90">Módulo Pricing</span>
            <span className="text-xs text-white/70">Conectado a Google Sheets</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col max-w-7xl mx-auto w-full z-10">
        
        <ScenarioHeader 
          scenarios={scenarios}
          activeScenarioId={activeScenarioId}
          onSelectScenario={setActiveScenarioId}
          onRenameScenario={renameScenario}
          onCreateScenario={createScenario}
          onDuplicateScenario={duplicateScenario}
          onCloseScenario={closeScenario}
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
              {activeTab === 'matrix' && (
                <DataSheet scenario={activeScenario} viewMode="matrix" />
              )}
              {activeTab === 'visual' && (
                <DataSheet scenario={activeScenario} viewMode="visual" />
              )}
              {activeTab === 'system' && (
                <DataSheet scenario={activeScenario} viewMode="system" />
              )}
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
            <div className="text-center mt-20 text-gray-400">
               No hay escenarios cargados.
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default PricingModule;
