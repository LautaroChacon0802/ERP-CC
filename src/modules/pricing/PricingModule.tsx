import React from 'react';
import { useScenarioManager } from '../../hooks/useScenarioManager';
import { useExport } from '../../hooks/useExport'; //
import ScenarioHeader from '../../components/ScenarioHeader';
import SheetTabs from '../../components/SheetTabs';
import ParametersSheet from '../../components/ParametersSheet';
import CoefficientsSheet from '../../components/CoefficientsSheet';
import DataSheet from '../../components/DataSheet';
import HistorySheet from '../../components/HistorySheet';
import ComparisonSheet from '../../components/ComparisonSheet';
import OfficialPdfTemplate from '../../components/OfficialPdfTemplate'; //
import { Loader2, ArrowLeft, Layers, FileDown, FileImage, FileSpreadsheet } from 'lucide-react';
import CastorLogo from '../../components/CastorLogo';
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

  // 1. Instanciar el hook de exportación
  const { exportToExcel, exportToPdf, exportToJpeg } = useExport();

  // ID constante para identificar el elemento oculto en el DOM
  const EXPORT_TEMPLATE_ID = "official-export-template-zone";

  const handleExportPdf = () => {
    if (activeScenario) {
      exportToPdf(EXPORT_TEMPLATE_ID, `Tarifario_${activeScenario.name}`);
    }
  };

  const handleExportJpeg = () => {
    if (activeScenario) {
      exportToJpeg(EXPORT_TEMPLATE_ID, `Tarifario_${activeScenario.name}`);
    }
  };

  const handleExportExcel = () => {
    if (activeScenario) {
        exportToExcel(activeScenario);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-castor-red animate-spin mb-4" />
          <p className="text-lg font-semibold text-gray-700">{loadingMessage}</p>
        </div>
      )}

      {/* 2. ZONA DE RENDERIZADO OCULTO (Off-screen) */}
      {/* Es vital que esto no tenga 'display: none', sino position absolute fuera de vista */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, overflow: 'hidden' }}>
        <div id={EXPORT_TEMPLATE_ID}>
            {activeScenario && <OfficialPdfTemplate scenario={activeScenario} />}
        </div>
      </div>

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
            
            {/* 3. BARRA DE HERRAMIENTAS DE EXPORTACIÓN */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 border-b border-gray-200">
                <SheetTabs activeTab={activeTab} onTabChange={setActiveTab} />
                
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase mr-2">Exportar:</span>
                    <button 
                        onClick={handleExportExcel}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition-colors shadow-sm"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet size={14} /> XLSX
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 transition-colors shadow-sm"
                        title="Exportar PDF Oficial"
                    >
                        <FileDown size={14} /> PDF
                    </button>
                    <button 
                        onClick={handleExportJpeg}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 transition-colors shadow-sm"
                        title="Exportar Imagen JPG"
                    >
                        <FileImage size={14} /> JPG
                    </button>
                </div>
            </div>
            
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