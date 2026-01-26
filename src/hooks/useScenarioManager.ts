import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { 
  ScenarioStatus, 
  ScenarioCategory
} from '../types';
import { 
  INITIAL_PARAMS, 
  getItemsByCategory
} from '../constants';
import { calculateScenarioPrices } from '../utils';
import { useToast } from '../contexts/ToastContext';
import { useScenarioData } from './useScenarioData';
import { TabInfo } from '../components/SheetTabs';

export const useScenarioManager = () => {
  // --- INJECTIONS ---
  const { 
    scenarios, 
    history, 
    defaultCoefficients, 
    isLoading, 
    loadingMessage,
    loadInitialData,
    createLocalDraft,
    updateLocalScenarioParams,
    updateLocalScenarioCoefficients,
    updateLocalScenarioMeta,
    discardLocalDraft,
    syncScenarioToDb
  } = useScenarioData();

  const { notify, removeToast, toasts } = useToast();

  // --- UI STATE ---
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory>('LIFT');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabInfo>('params');

  // --- INITIALIZATION ---
  useEffect(() => {
    loadInitialData()
      .then((seedId) => {
        if (seedId) {
            setActiveScenarioId(seedId);
        } else {
            // Restore selection based on category
            const initial = scenarios.find(s => (s.category || 'LIFT') === selectedCategory);
            if (initial) setActiveScenarioId(initial.id);
            else if (scenarios.length > 0) setActiveScenarioId(scenarios[0].id);
            
            notify("Histórico cargado correctamente", "success");
        }
      })
      .catch(() => notify("Error de conexión. Modo offline.", "error"));
  }, []); // Run once

  // --- COMPUTED: Filter Scenarios ---
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => (s.category || 'LIFT') === selectedCategory);
  }, [scenarios, selectedCategory]);

  // --- COMPUTED: Active Scenario & Calculation Logic ---
  const activeScenarioRaw = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId), 
    [scenarios, activeScenarioId]
  );

  // Auto-switch logic
  useEffect(() => {
    const belongs = activeScenarioRaw && (activeScenarioRaw.category || 'LIFT') === selectedCategory;
    if (!belongs) {
        const firstInCat = scenarios.find(s => (s.category || 'LIFT') === selectedCategory);
        setActiveScenarioId(firstInCat ? firstInCat.id : '');
    }
  }, [selectedCategory, scenarios]); // removed activeScenarioRaw to avoid loop, handled by derived state

  // PERFORMANCE OPTIMIZATION: Deferred Calculation
  const deferredParams = useDeferredValue(activeScenarioRaw?.params);
  const deferredCoefficients = useDeferredValue(activeScenarioRaw?.coefficients);
  const deferredCategory = useDeferredValue(activeScenarioRaw?.category);

  const activeCalculatedData = useMemo(() => {
    if (!deferredParams || !deferredCoefficients) return [];
    
    return calculateScenarioPrices(
        deferredParams, 
        deferredCoefficients, 
        deferredCategory || 'LIFT'
    );
  }, [deferredParams, deferredCoefficients, deferredCategory]);

  // Reconstruct full object for UI
  const activeScenario = useMemo(() => {
    if (!activeScenarioRaw) return undefined;
    return {
        ...activeScenarioRaw,
        calculatedData: activeCalculatedData 
    };
  }, [activeScenarioRaw, activeCalculatedData]);


  // --- CONTROLLER ACTIONS ---

  const createScenario = () => {
    const existingDraft = filteredScenarios.find(s => s.status === ScenarioStatus.DRAFT);
    if (existingDraft) {
      notify(`Ya existe un borrador activo en ${selectedCategory}.`, "warning");
      setActiveScenarioId(existingDraft.id);
      return;
    }

    // Determine Base Params
    const baseScenario = activeScenario && (activeScenario.category || 'LIFT') === selectedCategory 
        ? activeScenario 
        : null;

    let newBaseRate = 45000;
    if (baseScenario && baseScenario.calculatedData.length > 0) {
        const baseRow = baseScenario.calculatedData.find(r => r.days === 1);
        newBaseRate = baseRow ? baseRow.adultRegularVisual : baseScenario.params.baseRateAdult1Day;
    }

    // Initialize Rental Prices if needed
    const initialRentalPrices: Record<string, number> = {};
    if (selectedCategory !== 'LIFT') {
        const items = getItemsByCategory(selectedCategory);
        items.forEach(item => {
            initialRentalPrices[item.id] = baseScenario?.params.rentalBasePrices?.[item.id] || 0;
        });
    }

    const newParams = {
        ...INITIAL_PARAMS,
        baseRateAdult1Day: selectedCategory === 'LIFT' ? newBaseRate : 0, 
        rentalBasePrices: initialRentalPrices,
        validFrom: baseScenario?.params.validFrom || INITIAL_PARAMS.validFrom,
        validTo: baseScenario?.params.validTo || INITIAL_PARAMS.validTo,
        // Seasons are handled in useScenarioData via deep copy, but we pass overrides if needed
    };

    const baseCoefs = baseScenario ? baseScenario.coefficients : defaultCoefficients;

    // Delegate creation to Data Hook
    const newId = createLocalDraft(selectedCategory, newParams, baseCoefs, baseScenario?.id || null);
    
    setActiveScenarioId(newId);
    setActiveTab('params');
    notify(`Nuevo borrador de ${selectedCategory} creado.`, "info");
  };

  const duplicateScenario = () => {
    if (!activeScenario) return;
    
    // Duplicate logic is essentially creating a draft from current params
    const newId = createLocalDraft(
        activeScenario.category || 'LIFT',
        activeScenario.params,
        activeScenario.coefficients,
        activeScenario.id
    );
    
    // Set custom name for copy
    updateLocalScenarioMeta(newId, { name: `${activeScenario.name} (Copia)` });
    
    setActiveScenarioId(newId);
    notify("Escenario duplicado (Local).", "success");
  };

  const renameScenario = (name: string) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    updateLocalScenarioMeta(activeScenarioId, { name });
  };

  const updateSeason = (season: number) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    updateLocalScenarioMeta(activeScenarioId, { season });
  };

  const discardDraft = () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;

    if (window.confirm("¿Cancelar la creación de este tarifario? Se perderán los cambios.")) {
        discardLocalDraft(activeScenarioId);
        
        // Fallback selection
        const fallback = filteredScenarios.find(s => s.id !== activeScenarioId);
        setActiveScenarioId(fallback ? fallback.id : '');
        
        notify("Borrador cancelado.", "info");
    }
  };

  const closeScenario = async () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;
    
    if (!activeScenario.name || activeScenario.name.trim() === "") {
        notify("Error: El tarifario debe tener un NOMBRE.", "warning");
        return;
    }
    if (!activeScenario.season || activeScenario.season === 0) {
        notify("Error: Debes ingresar un AÑO (Temporada) válido.", "warning");
        return;
    }

    if (!window.confirm(`¿Confirmar cierre de tarifario "${activeScenario.name}"?\n\nAl confirmar, los datos se guardarán en la BASE DE DATOS.`)) return;

    // Prepare fully calculated scenario for DB
    const scenarioToSave = {
        ...activeScenario,
        status: ScenarioStatus.CLOSED,
        closedAt: new Date().toISOString()
        // calculatedData is already inside activeScenario from useMemo
    };

    const success = await syncScenarioToDb(scenarioToSave);

    if (success) {
        setActiveTab('history');
        notify("Escenario guardado exitosamente en DB.", "success");
    } else {
        notify("Error al guardar en base de datos.", "error");
    }
  };

  // Wrapper for Params Update
  const updateParams = (newParams: Partial<typeof INITIAL_PARAMS>) => {
      if (!activeScenarioRaw || activeScenarioRaw.status === ScenarioStatus.CLOSED) return;
      updateLocalScenarioParams(activeScenarioId, newParams);
  };

  // Wrapper for Coef Update
  const updateCoefficient = (day: number, value: number) => {
      if (!activeScenarioRaw || activeScenarioRaw.status === ScenarioStatus.CLOSED) return;
      updateLocalScenarioCoefficients(activeScenarioId, day, value);
  };

  return {
    // Data (Read-Only UI)
    scenarios,
    filteredScenarios,
    history,
    
    // UI State
    selectedCategory,
    activeScenarioId, 
    activeScenario, 
    isLoading, 
    loadingMessage, 
    activeTab, 
    toasts,
    
    // UI Setters
    setSelectedCategory,
    setActiveTab, 
    setActiveScenarioId, 
    removeToast, 
    
    // Actions
    createScenario, 
    duplicateScenario, 
    renameScenario,
    updateSeason, 
    discardDraft, 
    closeScenario, 
    updateParams, 
    updateCoefficient
  };
};