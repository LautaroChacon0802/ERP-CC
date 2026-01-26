import { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { 
  ScenarioStatus, 
  ScenarioCategory
} from '../types';
import { 
  INITIAL_PARAMS, 
  getItemsByCategory
} from '../constants';
// FIX: Agregamos validateScenarioDates al import
import { calculateScenarioPrices, validateScenarioDates } from '../utils';
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

  const { notify } = useToast();

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
            const initial = scenarios.find(s => (s.category || 'LIFT') === selectedCategory);
            if (initial) setActiveScenarioId(initial.id);
            else if (scenarios.length > 0) setActiveScenarioId(scenarios[0].id);
            notify("Sistema sincronizado correctamente", "success");
        }
      })
      .catch(() => notify("Error de conexión. Trabajando en modo local/offline.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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
  }, [selectedCategory, scenarios]); 

  // --- OPTIMIZATION CORE (MEMOIZATION) ---
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
      notify(`Ya tienes un borrador activo en ${selectedCategory}. Complétalo primero.`, "warning");
      setActiveScenarioId(existingDraft.id);
      return;
    }

    const baseScenario = activeScenario && (activeScenario.category || 'LIFT') === selectedCategory 
        ? activeScenario 
        : null;

    let newBaseRate = 45000;
    if (baseScenario && baseScenario.calculatedData.length > 0) {
        const baseRow = baseScenario.calculatedData.find(r => r.days === 1);
        newBaseRate = baseRow ? baseRow.adultRegularVisual : baseScenario.params.baseRateAdult1Day;
    }

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
    };

    const baseCoefs = baseScenario ? baseScenario.coefficients : defaultCoefficients;

    const newId = createLocalDraft(selectedCategory, newParams, baseCoefs, baseScenario?.id || null);
    
    setActiveScenarioId(newId);
    setActiveTab('params');
    notify(`Borrador creado para ${selectedCategory}.`, "info");
  };

  const duplicateScenario = () => {
    if (!activeScenario) return;
    
    const newId = createLocalDraft(
        activeScenario.category || 'LIFT',
        activeScenario.params,
        activeScenario.coefficients,
        activeScenario.id
    );
    
    updateLocalScenarioMeta(newId, { name: `${activeScenario.name} (Copia)` });
    
    setActiveScenarioId(newId);
    notify("Escenario duplicado correctamente.", "success");
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

    if (window.confirm("¿Estás seguro? Se perderán todos los cambios del borrador.")) {
        discardLocalDraft(activeScenarioId);
        
        const fallback = filteredScenarios.find(s => s.id !== activeScenarioId);
        setActiveScenarioId(fallback ? fallback.id : '');
        
        notify("Borrador eliminado.", "info");
    }
  };

  const closeScenario = async () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;
    
    if (!activeScenario.name || activeScenario.name.trim() === "") {
        notify("Debes asignar un Nombre al tarifario.", "warning");
        return;
    }
    if (!activeScenario.season || activeScenario.season === 0) {
        notify("Debes asignar una Temporada (Año).", "warning");
        return;
    }

    // FIX: Validación de fechas efectiva
    const dateError = validateScenarioDates(activeScenario.params);
    if (dateError) {
        notify(`Error de Fechas: ${dateError}`, "error");
        return;
    }

    if (!window.confirm(`¿Cerrar y Publicar "${activeScenario.name}"?\n\nEsta acción es irreversible.`)) return;

    const scenarioToSave = {
        ...activeScenario,
        status: ScenarioStatus.CLOSED,
        closedAt: new Date().toISOString()
    };

    const success = await syncScenarioToDb(scenarioToSave);

    if (success) {
        setActiveTab('history');
        notify("¡Tarifario publicado exitosamente!", "success");
    } else {
        notify("Error crítico al guardar en base de datos.", "error");
    }
  };

  const updateParams = (newParams: Partial<typeof INITIAL_PARAMS>) => {
      if (!activeScenarioRaw || activeScenarioRaw.status === ScenarioStatus.CLOSED) return;
      updateLocalScenarioParams(activeScenarioId, newParams);
  };

  const updateCoefficient = (day: number, value: number) => {
      if (!activeScenarioRaw || activeScenarioRaw.status === ScenarioStatus.CLOSED) return;
      updateLocalScenarioCoefficients(activeScenarioId, day, value);
  };

  return {
    scenarios,
    filteredScenarios,
    history,
    selectedCategory,
    activeScenarioId, 
    activeScenario, 
    isLoading, 
    loadingMessage, 
    activeTab, 
    
    setSelectedCategory,
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
  };
};