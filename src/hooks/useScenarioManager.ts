import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scenario, 
  ScenarioStatus, 
  ScenarioType, 
  HistoryLogEntry, 
  CoefficientRow,
  ScenarioCategory
} from '../types';
import { 
  INITIAL_PARAMS, 
  getItemsByCategory
} from '../constants';
import { calculateScenarioPrices, migrateParams } from '../utils';
import { BackendService } from '../api/backend';
import { Toast, ToastType } from '../components/ToastSystem';
import { TabInfo } from '../components/SheetTabs';

export const useScenarioManager = () => {
  // --- STATE ---
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ScenarioCategory>('LIFT');
  
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [history, setHistory] = useState<HistoryLogEntry[]>([]);
  const [defaultCoefficients, setDefaultCoefficients] = useState<CoefficientRow[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando sistema...');
  const [activeTab, setActiveTab] = useState<TabInfo>('params');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // --- NOTIFICATION SYSTEM ---
  const notify = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- COMPUTED: Filter Scenarios by Category ---
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => (s.category || 'LIFT') === selectedCategory);
  }, [scenarios, selectedCategory]);

  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId), 
    [scenarios, activeScenarioId]
  );

  // --- EFFECT: Auto-switch active scenario when category changes ---
  useEffect(() => {
    const belongs = activeScenario && (activeScenario.category || 'LIFT') === selectedCategory;
    
    if (!belongs) {
        const firstInCat = scenarios.find(s => (s.category || 'LIFT') === selectedCategory);
        if (firstInCat) {
            setActiveScenarioId(firstInCat.id);
        } else {
            setActiveScenarioId('');
        }
    }
  }, [selectedCategory, scenarios, activeScenario]);


  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoadingMessage('Sincronizando configuración y datos...');
        const [remoteHistory, configCoefs] = await Promise.all([
            BackendService.getHistory(),
            BackendService.getDefaultCoefficients()
        ]);

        const migratedHistory = remoteHistory.map(entry => ({
            ...entry,
            params: migrateParams(entry.params)
        }));

        setHistory(migratedHistory);
        setDefaultCoefficients(configCoefs);

        if (migratedHistory.length === 0) {
            // Seed inicial (Solo LIFT)
            const seedScenario: Scenario = {
              id: 'seed-2025',
              name: `Tarifario Base`,
              season: 2025,
              type: ScenarioType.FINAL,
              category: 'LIFT',
              baseScenarioId: null,
              status: ScenarioStatus.CLOSED,
              createdAt: new Date().toISOString(),
              closedAt: new Date().toISOString(),
              params: { ...INITIAL_PARAMS, baseRateAdult1Day: 45000 },
              coefficients: configCoefs,
              calculatedData: []
            };
            seedScenario.calculatedData = calculateScenarioPrices(seedScenario.params, seedScenario.coefficients, 'LIFT');
            setScenarios([seedScenario]);
            setActiveScenarioId(seedScenario.id);
        } else {
            const loadedScenarios: Scenario[] = migratedHistory.map(h => ({
                id: h.scenarioId,
                name: h.name || 'Escenario Recuperado',
                season: h.season,
                type: h.scenarioType as ScenarioType,
                // --- CORRECCIÓN DE PERSISTENCIA: LEER CATEGORÍA ---
                // Si el registro histórico no tiene categoría, asumimos 'LIFT' (compatibilidad hacia atrás)
                category: (h as any).category || 'LIFT', 
                baseScenarioId: null,
                status: h.status,
                createdAt: h.closedAt || new Date().toISOString(),
                closedAt: h.closedAt,
                params: h.params,
                coefficients: configCoefs,
                calculatedData: h.data
            }));
            setScenarios(loadedScenarios);
            
            const initialSelection = loadedScenarios.find(s => (s.category || 'LIFT') === selectedCategory);
            if (initialSelection) setActiveScenarioId(initialSelection.id);
            else if (loadedScenarios.length > 0) setActiveScenarioId(loadedScenarios[0].id);

            notify("Histórico cargado correctamente", "success");
        }

      } catch (error) {
        console.error("Error initializing:", error);
        notify("Error de conexión. Se usará modo offline.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []); 

  // --- ACTIONS ---

  const createScenario = () => {
    const existingDraft = filteredScenarios.find(s => s.status === ScenarioStatus.DRAFT);
    if (existingDraft) {
      notify(`Ya existe un borrador activo en ${selectedCategory}.`, "warning");
      setActiveScenarioId(existingDraft.id);
      return;
    }

    const baseScenario = activeScenario && (activeScenario.category || 'LIFT') === selectedCategory 
        ? activeScenario 
        : null;

    let newBaseRate = 45000;
    if (baseScenario) {
        const baseRow = baseScenario.calculatedData.find(r => r.days === 1);
        newBaseRate = baseRow ? baseRow.adultRegularVisual : baseScenario.params.baseRateAdult1Day;
    }

    const newId = `sc-${Date.now()}`;
    
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
        promoSeasons: (baseScenario?.params.promoSeasons || []).map(s => ({...s, id: `promo-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})),
        regularSeasons: (baseScenario?.params.regularSeasons || []).map(s => ({...s, id: `reg-${Date.now()}-${Math.random().toString(36).substr(2,5)}`}))
    };

    const newScenario: Scenario = {
      id: newId,
      name: "",
      season: 0,
      type: ScenarioType.FINAL,
      category: selectedCategory, 
      baseScenarioId: baseScenario?.id || null,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      params: newParams,
      coefficients: baseScenario ? [...baseScenario.coefficients.map(c => ({...c}))] : [...defaultCoefficients],
      calculatedData: []
    };
    
    newScenario.calculatedData = calculateScenarioPrices(newScenario.params, newScenario.coefficients, selectedCategory);

    setScenarios(prev => [newScenario, ...prev]);
    setActiveScenarioId(newId);
    setActiveTab('params');
    notify(`Nuevo borrador de ${selectedCategory} creado.`, "info");
  };

  const duplicateScenario = () => {
    if (!activeScenario) return;
    const newId = `copy-${Date.now()}`;
    const copy: Scenario = {
      ...activeScenario,
      id: newId,
      name: `${activeScenario.name} (Copia)`,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      closedAt: undefined,
    };
    copy.calculatedData = calculateScenarioPrices(copy.params, copy.coefficients, copy.category || 'LIFT');

    setScenarios(prev => [copy, ...prev]);
    setActiveScenarioId(newId);
    notify("Escenario duplicado (Local).", "success");
  };

  const renameScenario = (name: string) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? { ...s, name } : s));
  };

  const updateSeason = (season: number) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? { ...s, season } : s));
  };

  const discardDraft = () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;

    if (window.confirm("¿Cancelar la creación de este tarifario? Se perderán los cambios.")) {
        const nextScenarios = scenarios.filter(s => s.id !== activeScenarioId);
        setScenarios(nextScenarios);
        
        const fallback = nextScenarios.find(s => (s.category || 'LIFT') === selectedCategory);
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

    setIsLoading(true);
    setLoadingMessage('Guardando en base de datos...');

    try {
      const closedScenario: Scenario = {
        ...activeScenario,
        status: ScenarioStatus.CLOSED,
        closedAt: new Date().toISOString()
      };

      const success = await BackendService.saveScenario(closedScenario);

      if (success) {
        const logEntry: HistoryLogEntry = {
          scenarioId: closedScenario.id,
          name: closedScenario.name,
          season: closedScenario.season,
          scenarioType: closedScenario.type,
          status: ScenarioStatus.CLOSED,
          closedAt: closedScenario.closedAt!,
          // --- CORRECCIÓN DE PERSISTENCIA: GUARDAR CATEGORÍA ---
          category: closedScenario.category || 'LIFT', 
          data: closedScenario.calculatedData,
          params: closedScenario.params
        };

        setScenarios(prev => prev.map(s => s.id === activeScenarioId ? closedScenario : s));
        setHistory(prev => [logEntry, ...prev]);
        setActiveTab('history');
        notify("Escenario guardado exitosamente en DB.", "success");
      } else {
        throw new Error("El backend devolvió falso.");
      }
    } catch (error) {
      console.error(error);
      notify("Error al guardar en base de datos.", "error");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const updateParams = (newParams: Partial<Scenario['params']>) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    const updated = { ...activeScenario, params: { ...activeScenario.params, ...newParams } };
    
    updated.calculatedData = calculateScenarioPrices(updated.params, updated.coefficients, updated.category || 'LIFT');
    
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updated : s));
  };

  const updateCoefficient = (day: number, value: number) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    const updated = { ...activeScenario, coefficients: activeScenario.coefficients.map(c => c.day === day ? { ...c, value } : c) };
    
    updated.calculatedData = calculateScenarioPrices(updated.params, updated.coefficients, updated.category || 'LIFT');
    
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updated : s));
  };

  return {
    scenarios,
    filteredScenarios,
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
  };
};