import React from 'react';
import { useScenarioManager } from '../../hooks/useScenarioManager';
import ScenarioHeader from '../../components/ScenarioHeader';
import SheetTabs from '../../components/SheetTabs';
import ParametersSheet from '../../components/ParametersSheet';
import CoefficientsSheet from '../../components/CoefficientsSheet';
import DataSheet from '../../components/DataSheet';
import HistorySheet from '../../components/HistorySheet';
import ComparisonSheet from '../../components/ComparisonSheet';
import { Loader2, Layers, DollarSign } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EmptyState } from '../../components/ui/EmptyState';
import { SCENARIO_CATEGORIES } from '../../constants';

interface Props {
    onBack: () => void;
}

const PricingModule: React.FC<Props> = ({ onBack }) => {
  const {
    filteredScenarios,
    selectedCategory,
    setSelectedCategory,
    activeScenarioId,
    activeScenario,
    history,
    isLoading,
    loadingMessage,
    activeTab,
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
    <div className="min-h-screen bg-background flex flex-col relative">
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-lg font-semibold text-foreground">{loadingMessage}</p>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Matriz Tarifaria"
        subtitle="Gestion Comercial y Tarifaria"
        icon={<DollarSign size={20} />}
        onBack={onBack}
      />
        
      {/* Category Navigation */}
      <div className="bg-primary text-primary-foreground sticky top-16 z-10">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {SCENARIO_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`
                flex items-center gap-2 px-6 py-3 text-sm font-semibold uppercase tracking-wide transition-all border-b-2
                ${selectedCategory === cat.id 
                  ? 'bg-primary-700 text-white border-white' 
                  : 'border-transparent hover:bg-primary-700 text-primary-200 hover:text-white'}
              `}
            >
              {selectedCategory === cat.id && <Layers size={14} />}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col max-w-7xl mx-auto w-full">
        
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
          <div className="flex-1 flex flex-col bg-card border border-border rounded-card shadow-card overflow-hidden animate-fade-in">
            <SheetTabs activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="flex-1 overflow-auto bg-muted">
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
                <ComparisonSheet 
                    history={history}
                    currentCategory={activeScenario.category || 'LIFT'}
                    activeScenarioName={activeScenario.name}
                    activeScenarioData={activeScenario.calculatedData}
                />
              )}
            </div>
          </div>
        ) : (
          !isLoading && (
            <div className="flex-1 flex items-center justify-center">
              <EmptyState
                icon={<Layers size={48} />}
                title={`No hay tarifarios en ${SCENARIO_CATEGORIES.find(c => c.id === selectedCategory)?.label}`}
                description="Crea uno nuevo usando el boton '+ Nuevo' de arriba."
              />
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default PricingModule;
