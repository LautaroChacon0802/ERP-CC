import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Scenario, 
  ScenarioStatus, 
  ScenarioType, 
  HistoryLogEntry, 
  CoefficientRow 
} from '../types';
import { 
  INITIAL_PARAMS, 
  SCENARIO_TYPES 
} from '../constants';
import { calculateScenarioPrices, migrateParams } from '../utils';
import { BackendService } from '../api/backend';
import { Toast, ToastType } from '../components/ToastSystem';
import { TabInfo } from '../components/SheetTabs';

export const useScenarioManager = () => {
  // --- STATE ---
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [history, setHistory] = useState<HistoryLogEntry[]>([]);
  const [defaultCoefficients, setDefaultCoefficients] = useState<CoefficientRow[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando sistema...');
  const [activeTab, setActiveTab] = useState<TabInfo>('params');

  // Toasts State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Debounce ref
  const saveTimeoutRef = useRef<number | null>(null);

  // --- NOTIFICATION SYSTEM ---
  const notify = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // --- INITIALIZATION ---
  useEffect(() => {
    const initApp = async () => {
      try {
        setLoadingMessage('Sincronizando configuración y datos...');
        
        // Parallel Fetch: History + Coefficients Config
        const [remoteHistory, configCoefs] = await Promise.all([
            BackendService.getHistory(),
            BackendService.getDefaultCoefficients()
        ]);

        // CRITICAL: Migrate history params to support new DateRange[] structure
        const migratedHistory = remoteHistory.map(entry => ({
            ...entry,
            params: migrateParams(entry.params)
        }));

        setHistory(migratedHistory);
        setDefaultCoefficients(configCoefs);

        if (migratedHistory.length === 0) {
            // CASO A: No hay historial, crear semilla inicial
            const seedType = ScenarioType.FINAL;
            const seedScenario: Scenario = {
              id: 'seed-2025',
              name: `Tarifario Base ${seedType}`,
              season: 2025,
              type: seedType,
              baseScenarioId: null,
              status: ScenarioStatus.CLOSED,
              createdAt: new Date().toISOString(),
              closedAt: new Date().toISOString(),
              params: { ...INITIAL_PARAMS, baseRateAdult1Day: 45000 },
              coefficients: configCoefs, // Use dynamic config
              calculatedData: []
            };
            seedScenario.calculatedData = calculateScenarioPrices(seedScenario.params, seedScenario.coefficients);
    
            setScenarios([seedScenario]);
            setActiveScenarioId(seedScenario.id);
            notify("Sistema inicializado con configuración base", "info");
        } else {
            // CASO B: SI hay historial (SOLUCIÓN DEL ERROR DE PANTALLA BLANCA)
            // Transformamos el historial en escenarios activos para que la UI tenga qué mostrar
            const loadedScenarios: Scenario[] = migratedHistory.map(h => ({
                id: h.scenarioId,
                name: h.name || 'Escenario Recuperado', // Fallback por si el nombre viene vacío del CSV
                season: h.season,
                type: h.scenarioType as ScenarioType,
                baseScenarioId: null,
                status: h.status,
                createdAt: h.closedAt || new Date().toISOString(),
                closedAt: h.closedAt,
                params: h.params,
                coefficients: configCoefs, // Usamos los coeficientes actuales como referencia
                calculatedData: h.data
            }));

            setScenarios(loadedScenarios);
            
            // Seleccionamos automáticamente el primero (el más reciente)
            if (loadedScenarios.length > 0) {
                setActiveScenarioId(loadedScenarios[0].id);
            }

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

  // --- COMPUTED ---
  const activeScenario = useMemo(() => 
    scenarios.find(s => s.id === activeScenarioId), 
    [scenarios, activeScenarioId]
  );

  // --- AUTO-SAVE EFFECT ---
  useEffect(() => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = window.setTimeout(() => {
        BackendService.saveDraft(activeScenario)
            .then(() => {
                // Silent success for drafts, or debug log
                console.log("Draft auto-saved");
            })
            .catch(err => {
                console.error("Auto-save failed", err);
                notify("Error al autoguardar borrador", "warning");
            });
    }, 1000); // 1s debounce

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [activeScenario]);

  // --- ACTIONS ---

  const getNextScenarioType = (current: ScenarioType): ScenarioType => {
    const idx = SCENARIO_TYPES.indexOf(current);
    if (idx >= 0 && idx < SCENARIO_TYPES.length - 1) return SCENARIO_TYPES[idx + 1];
    return ScenarioType.FINAL;
  };

  const createScenario = () => {
    if (!activeScenario) {
        notify("No hay un escenario base seleccionado", "error");
        return; 
    }

    const existingDraft = scenarios.find(s => s.status === ScenarioStatus.DRAFT);
    if (existingDraft) {
      notify("Ya existe un borrador activo. Ciérrelo antes de crear uno nuevo.", "warning");
      setActiveScenarioId(existingDraft.id);
      return;
    }

    const baseRow = activeScenario.calculatedData.find(r => r.days === 1);
    const newBaseRate = baseRow ? baseRow.adultRegularVisual : activeScenario.params.baseRateAdult1Day;

    const newId = `sc-${Date.now()}`;
    const newType = getNextScenarioType(activeScenario.type);
    
    const newScenario: Scenario = {
      id: newId,
      name: `${newType} - Borrador`,
      season: activeScenario.season + (activeScenario.type === ScenarioType.FINAL ? 1 : 0),
      type: newType,
      baseScenarioId: activeScenario.id,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      params: {
        ...INITIAL_PARAMS,
        baseRateAdult1Day: newBaseRate,
        validFrom: activeScenario.params.validFrom,
        validTo: activeScenario.params.validTo,
        // Copy seasons with new unique IDs for safety
        promoSeasons: activeScenario.params.promoSeasons.map(s => ({...s, id: `promo-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})),
        regularSeasons: activeScenario.params.regularSeasons.map(s => ({...s, id: `reg-${Date.now()}-${Math.random().toString(36).substr(2,5)}`}))
      },
      coefficients: [...activeScenario.coefficients.map(c => ({...c}))],
      calculatedData: []
    };
    
    newScenario.calculatedData = calculateScenarioPrices(newScenario.params, newScenario.coefficients);

    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
    setActiveTab('params');
    notify("Nuevo escenario borrador creado", "success");
  };

  const duplicateScenario = () => {
    if (!activeScenario) return;
    
    const existingDraft = scenarios.find(s => s.status === ScenarioStatus.DRAFT);
    if (existingDraft) {
        notify("Atención: Ya existe un borrador. Se creará una copia adicional.", "warning");
    }

    const newId = `copy-${Date.now()}`;
    const copy: Scenario = {
      ...activeScenario,
      id: newId,
      name: `${activeScenario.name} (Copia)`,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      closedAt: undefined,
    };
    
    setScenarios([...scenarios, copy]);
    setActiveScenarioId(newId);
    notify("Escenario duplicado correctamente", "success");
  };

  const renameScenario = (name: string) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;

    const updatedScenario = {
        ...activeScenario,
        name: name
    };
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updatedScenario : s));
  };

  const closeScenario = async () => {
    if (!activeScenario) return;
    if (activeScenario.status !== ScenarioStatus.DRAFT) return;

    if (!window.confirm(`¿Confirmar cierre de tarifario "${activeScenario.name}"?\n\nAl cerrar, se guardará en la BASE DE DATOS de Google Sheets y no podrá ser editado.`)) return;

    setIsLoading(true);
    setLoadingMessage('Guardando escenario en Google Sheets...');

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
          data: closedScenario.calculatedData,
          params: closedScenario.params
        };

        setScenarios(prev => prev.map(s => s.id === activeScenarioId ? closedScenario : s));
        setHistory(prev => [logEntry, ...prev]);
        setActiveTab('history');
        notify("Escenario cerrado y guardado exitosamente", "success");
      } else {
        throw new Error("El backend devolvió falso.");
      }
    } catch (error) {
      console.error(error);
      notify("Error crítico al guardar. Verifique conexión.", "error");
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const updateParams = (newParams: Partial<Scenario['params']>) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;

    const updatedScenario = {
      ...activeScenario,
      params: { ...activeScenario.params, ...newParams }
    };
    updatedScenario.calculatedData = calculateScenarioPrices(updatedScenario.params, updatedScenario.coefficients);
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updatedScenario : s));
  };

  const updateCoefficient = (day: number, value: number) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;

    const updatedScenario = {
      ...activeScenario,
      coefficients: activeScenario.coefficients.map(c => c.day === day ? { ...c, value } : c)
    };
    updatedScenario.calculatedData = calculateScenarioPrices(updatedScenario.params, updatedScenario.coefficients);
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updatedScenario : s));
  };

  return {
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
  };
};