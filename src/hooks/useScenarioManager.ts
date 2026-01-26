import { useState, useEffect, useMemo, useDeferredValue, useCallback } from 'react';
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
  // IMPORTANTE: 'scenarios' ahora solo almacena metadatos y params.
  // 'calculatedData' se mantiene vacío en este array para ahorrar memoria.
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
  const notify = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now(); // ID simple para UI efímera está bien
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // --- COMPUTED: Filter Scenarios by Category ---
  const filteredScenarios = useMemo(() => {
    return scenarios.filter(s => (s.category || 'LIFT') === selectedCategory);
  }, [scenarios, selectedCategory]);

  // --- CORE LOGIC: Active Scenario & Calculation (Etapa 1: Performance Fix) ---
  
  // 1. Recuperamos el escenario "crudo" (sin datos calculados) del estado ligero
  const activeScenarioRaw = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId), 
    [scenarios, activeScenarioId]
  );

  // 2. Diferimos los valores que disparan cálculo para no bloquear el input del usuario (React 18+)
  // Esto elimina el "input lag" al escribir precios.
  const deferredParams = useDeferredValue(activeScenarioRaw?.params);
  const deferredCoefficients = useDeferredValue(activeScenarioRaw?.coefficients);
  const deferredCategory = useDeferredValue(activeScenarioRaw?.category);

  // 3. Memoizamos el cálculo pesado. Solo corre si cambian los valores DIFERIDOS.
  const activeCalculatedData = useMemo(() => {
    if (!deferredParams || !deferredCoefficients) return [];
    
    // Aquí ocurre la magia matemática, aislada del render principal de escritura
    return calculateScenarioPrices(
        deferredParams, 
        deferredCoefficients, 
        deferredCategory || 'LIFT'
    );
  }, [deferredParams, deferredCoefficients, deferredCategory]);

  // 4. Reconstruimos el objeto completo para consumo de la UI
  const activeScenario = useMemo(() => {
    if (!activeScenarioRaw) return undefined;
    return {
        ...activeScenarioRaw,
        calculatedData: activeCalculatedData // Inyectamos los datos calculados al vuelo
    };
  }, [activeScenarioRaw, activeCalculatedData]);

  // --- EFFECT: Auto-switch active scenario when category changes ---
  useEffect(() => {
    const belongs = activeScenarioRaw && (activeScenarioRaw.category || 'LIFT') === selectedCategory;
    
    if (!belongs) {
        const firstInCat = scenarios.find(s => (s.category || 'LIFT') === selectedCategory);
        if (firstInCat) {
            setActiveScenarioId(firstInCat.id);
        } else {
            setActiveScenarioId('');
        }
    }
  }, [selectedCategory, scenarios, activeScenarioRaw]);


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
            // Seed inicial
            const seedId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'seed-initial';
            const seedScenario: Scenario = {
              id: seedId,
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
              calculatedData: [] // Optimizacion: Inicializamos vacío
            };
            // Calculamos solo para el seed inicial si es el activo, pero aquí lo guardamos ligero
            setScenarios([seedScenario]);
            setActiveScenarioId(seedScenario.id);
        } else {
            const loadedScenarios: Scenario[] = migratedHistory.map(h => ({
                id: h.scenarioId,
                name: h.name || 'Escenario Recuperado',
                season: h.season,
                type: h.scenarioType as ScenarioType,
                category: (h as any).category || 'LIFT', 
                baseScenarioId: null,
                status: h.status,
                createdAt: h.closedAt || new Date().toISOString(),
                closedAt: h.closedAt,
                params: h.params,
                coefficients: configCoefs,
                calculatedData: [] // Optimizacion: No cargamos datos pesados en memoria
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

  // Helper para IDs robustos
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback seguro
    return `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

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
    if (baseScenario && baseScenario.calculatedData.length > 0) {
        const baseRow = baseScenario.calculatedData.find(r => r.days === 1);
        newBaseRate = baseRow ? baseRow.adultRegularVisual : baseScenario.params.baseRateAdult1Day;
    }

    const newId = generateId(); // ID Robusto
    
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
        promoSeasons: (baseScenario?.params.promoSeasons || []).map(s => ({...s, id: `promo-${generateId()}`})),
        regularSeasons: (baseScenario?.params.regularSeasons || []).map(s => ({...s, id: `reg-${generateId()}`}))
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
      calculatedData: [] // Siempre vacío en creación
    };
    
    // No calculamos aquí. Se calculará al ser activeScenario.
    setScenarios(prev => [newScenario, ...prev]);
    setActiveScenarioId(newId);
    setActiveTab('params');
    notify(`Nuevo borrador de ${selectedCategory} creado.`, "info");
  };

  const duplicateScenario = () => {
    if (!activeScenario) return;
    const newId = generateId();
    const copy: Scenario = {
      ...activeScenario,
      id: newId,
      name: `${activeScenario.name} (Copia)`,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      closedAt: undefined,
      calculatedData: [] // Limpiamos datos explícitamente al copiar
    };
    
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
      // Al cerrar, usamos activeScenario que SÍ tiene la data calculada (inyectada por el useMemo)
      // Esto asegura que lo que se guarda en DB es lo que ve el usuario.
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
          category: closedScenario.category || 'LIFT', 
          data: closedScenario.calculatedData, // Guardamos la data completa en historial
          params: closedScenario.params
        };

        // En el estado local, actualizamos a CLOSED pero mantenemos data vacía
        setScenarios(prev => prev.map(s => s.id === activeScenarioId ? { ...s, status: ScenarioStatus.CLOSED, closedAt: closedScenario.closedAt, calculatedData: [] } : s));
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
    if (!activeScenarioRaw || activeScenarioRaw.status === ScenarioStatus.CLOSED) return;
    
    // Solo actualizamos el estado de parámetros. 
    // NO llamamos a calculateScenarioPrices aquí. Eso lo hace el useMemo/useDeferredValue automáticamente.
    const updated = { ...activeScenarioRaw, params: { ...activeScenarioRaw.params, ...newParams } };
    
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updated : s));
  };

  const updateCoefficient = (day: number, value: number) => {
    if (!activeScenarioRaw || activeScenarioRaw.status === ScenarioStatus.CLOSED) return;
    
    const updated = { ...activeScenarioRaw, coefficients: activeScenarioRaw.coefficients.map(c => c.day === day ? { ...c, value } : c) };
    
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