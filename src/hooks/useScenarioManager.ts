import { useState, useEffect, useMemo } from 'react';
import { 
  Scenario,
  ScenarioStatus, 
  ScenarioCategory,
  ScenarioType,
  ScenarioParams,
  HistoryLogEntry
} from '../types';
import { 
  INITIAL_PARAMS, 
  getItemsByCategory
} from '../constants';
import { validateScenarioDates } from '../utils';
import { calculateScenarioPrices } from '../utils/pricingCalculator';
import { useToast } from '../contexts/ToastContext';
import { BackendService } from '../api/backend';
import { TabInfo } from '../components/SheetTabs';

export const useScenarioManager = () => {
  // --- STATE ---
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [defaultCoefficients, setDefaultCoefficients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando sistema...');

  // UI State
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory>('LIFT');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<TabInfo>('params');

  const { notify } = useToast();

  // --- HELPER: ID Generator ---
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // --- INITIALIZATION (LOAD FROM DB) ---
  useEffect(() => {
    const init = async () => {
      try {
        setLoadingMessage('Sincronizando con base de datos...');
        const [loadedScenarios, defaults] = await Promise.all([
          BackendService.getHistory(),
          BackendService.getDefaultCoefficients()
        ]);

        setScenarios(loadedScenarios);
        setDefaultCoefficients(defaults);
        
        // Auto-select logic
        if (loadedScenarios.length > 0) {
           const first = loadedScenarios.find(s => (s.category || 'LIFT') === selectedCategory);
           if (first) setActiveScenarioId(first.id);
           else setActiveScenarioId(loadedScenarios[0].id);
        }

        notify("Datos actualizados correctamente", "success");
      } catch (error) {
        console.error(error);
        notify("Error cargando datos del servidor", "error");
      } finally {
        setIsLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- COMPUTED VALUES ---
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => (s.category || 'LIFT') === selectedCategory);
  }, [scenarios, selectedCategory]);

  const history: HistoryLogEntry[] = useMemo(() => {
    return scenarios.map(s => ({
        scenarioId: s.id,
        name: s.name,
        season: s.season,
        scenarioType: s.type,
        status: s.status,
        closedAt: s.closedAt || new Date().toISOString(),
        category: s.category || 'LIFT',
        data: s.calculatedData,
        params: s.params
    }));
  }, [scenarios]);

  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId), 
    [scenarios, activeScenarioId]
  );

  // Auto-switch category logic
  useEffect(() => {
    if (activeScenario && (activeScenario.category || 'LIFT') !== selectedCategory) {
        const firstInCat = filteredScenarios[0];
        setActiveScenarioId(firstInCat ? firstInCat.id : '');
    }
  }, [selectedCategory, activeScenario, filteredScenarios]);


  // --- ACTIONS ---

  const createScenario = async () => {
    const existingDraft = filteredScenarios.find(s => s.status === ScenarioStatus.DRAFT);
    if (existingDraft) {
      notify(`Ya tienes un borrador activo en ${selectedCategory}.`, "warning");
      setActiveScenarioId(existingDraft.id);
      return;
    }

    const baseScenario = activeScenario && (activeScenario.category || 'LIFT') === selectedCategory 
        ? activeScenario 
        : null;

    // Calcular params iniciales
    let newBaseRate = 45000;
    const initialRentalPrices: Record<string, number> = {};
    
    if (baseScenario) {
        // Heredar base rate
        const baseRow = baseScenario.calculatedData.find(r => r.days === 1);
        newBaseRate = baseRow ? baseRow.adultRegularVisual : baseScenario.params.baseRateAdult1Day;
        
        // Heredar rental prices
        if (selectedCategory !== 'LIFT') {
            const items = getItemsByCategory(selectedCategory);
            items.forEach(item => {
                initialRentalPrices[item.id] = baseScenario.params.rentalBasePrices?.[item.id] || 0;
            });
        }
    }

    const newParams: ScenarioParams = {
        ...INITIAL_PARAMS,
        baseRateAdult1Day: selectedCategory === 'LIFT' ? newBaseRate : 0, 
        rentalBasePrices: initialRentalPrices,
        validFrom: baseScenario?.params.validFrom || INITIAL_PARAMS.validFrom,
        validTo: baseScenario?.params.validTo || INITIAL_PARAMS.validTo,
    };

    const effectiveCoefficients = baseScenario ? baseScenario.coefficients : defaultCoefficients;

    // Calcular datos iniciales
    const calculatedData = calculateScenarioPrices(newParams, effectiveCoefficients, selectedCategory);

    const newScenario: Scenario = {
      id: generateId(),
      name: baseScenario ? `${baseScenario.name} (Nuevo)` : "Nuevo Tarifario",
      season: new Date().getFullYear(),
      type: ScenarioType.DRAFT,
      status: ScenarioStatus.DRAFT,
      category: selectedCategory,
      baseScenarioId: baseScenario?.id || null,
      createdAt: new Date().toISOString(),
      params: newParams,
      coefficients: effectiveCoefficients,
      calculatedData: calculatedData
    };

    // Optimistic Update
    setScenarios(prev => [newScenario, ...prev]);
    setActiveScenarioId(newScenario.id);
    setActiveTab('params');

    // Persist
    const success = await BackendService.saveScenario(newScenario);
    if (!success) notify("Error guardando el borrador en la nube", "error");
    else notify("Borrador creado.", "success");
  };

  const duplicateScenario = async () => {
    if (!activeScenario) return;

    const newScenario: Scenario = {
      ...activeScenario,
      id: generateId(),
      name: `${activeScenario.name} (Copia)`,
      type: ScenarioType.DRAFT,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      closedAt: undefined
    };

    setScenarios(prev => [newScenario, ...prev]);
    setActiveScenarioId(newScenario.id);
    
    const success = await BackendService.saveScenario(newScenario);
    if (success) notify("Escenario duplicado correctamente.", "success");
    else notify("Error al duplicar en base de datos.", "error");
  };

  // Generic Updater for Optimistic UI + DB Save
  const updateActiveScenario = async (updater: (s: Scenario) => Scenario) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;

    const updated = updater(activeScenario);
    
    // 1. Optimistic Update Local State
    setScenarios(prev => prev.map(s => s.id === updated.id ? updated : s));

    // 2. Persist to DB (Debounce could be added here if needed)
    try {
        await BackendService.saveScenario(updated);
    } catch (e) {
        console.error(e);
        notify("Error guardando cambios.", "error");
    }
  };

  const updateParams = (newParams: Partial<typeof INITIAL_PARAMS>) => {
      updateActiveScenario((current) => {
          const mergedParams = { ...current.params, ...newParams };
          const newCalculatedData = calculateScenarioPrices(
              mergedParams, 
              current.coefficients, 
              current.category || 'LIFT'
          );
          return { ...current, params: mergedParams, calculatedData: newCalculatedData };
      });
  };

  const updateCoefficient = (day: number, value: number) => {
      updateActiveScenario((current) => {
          const newCoefficients = current.coefficients.map(c => c.day === day ? { ...c, value } : c);
          const newCalculatedData = calculateScenarioPrices(
              current.params, 
              newCoefficients, 
              current.category || 'LIFT'
          );
          return { ...current, coefficients: newCoefficients, calculatedData: newCalculatedData };
      });
  };

  const renameScenario = (name: string) => {
      updateActiveScenario(s => ({ ...s, name }));
  };

  const updateSeason = (season: number) => {
      updateActiveScenario(s => ({ ...s, season }));
  };

  const discardDraft = async () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;

    if (window.confirm("¿Estás seguro? Se borrará permanentemente.")) {
        const idToDelete = activeScenario.id;
        
        // Optimistic Delete
        setScenarios(prev => prev.filter(s => s.id !== idToDelete));
        setActiveScenarioId('');

        const success = await BackendService.deleteScenario(idToDelete);
        if (success) notify("Borrador eliminado.", "info");
        else {
            notify("Error eliminando borrador.", "error");
            // Revert would go here in a full production app
        }
    }
  };

  const closeScenario = async () => {
    if (!activeScenario) return;
    
    if (!activeScenario.name?.trim()) {
        notify("Asigna un nombre antes de publicar.", "warning");
        return;
    }

    const dateError = validateScenarioDates(activeScenario.params);
    if (dateError) {
        notify(`Error de Fechas: ${dateError}`, "error");
        return;
    }

    if (!window.confirm(`¿Publicar "${activeScenario.name}"? Es irreversible.`)) return;

    const closedScenario: Scenario = {
        ...activeScenario,
        status: ScenarioStatus.CLOSED,
        closedAt: new Date().toISOString()
    };

    setScenarios(prev => prev.map(s => s.id === closedScenario.id ? closedScenario : s));
    
    const success = await BackendService.saveScenario(closedScenario);
    if (success) {
        setActiveTab('history');
        notify("¡Tarifario publicado!", "success");
    } else {
        notify("Error crítico guardando publicación.", "error");
    }
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