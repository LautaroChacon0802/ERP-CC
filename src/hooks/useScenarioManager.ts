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
  const [toasts, setToasts] = useState<Toast[]>([]);

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
        
        // Carga paralela de historial y coeficientes
        const [remoteHistory, configCoefs] = await Promise.all([
            BackendService.getHistory(),
            BackendService.getDefaultCoefficients()
        ]);

        // Migración de parámetros antiguos a la nueva estructura (si aplica)
        const migratedHistory = remoteHistory.map(entry => ({
            ...entry,
            params: migrateParams(entry.params)
        }));

        setHistory(migratedHistory);
        setDefaultCoefficients(configCoefs);

        if (migratedHistory.length === 0) {
            // CASO A: No hay historial, crear semilla inicial
            const seedScenario: Scenario = {
              id: 'seed-2025',
              name: `Tarifario Base`,
              season: 2025,
              type: ScenarioType.FINAL,
              baseScenarioId: null,
              status: ScenarioStatus.CLOSED,
              createdAt: new Date().toISOString(),
              closedAt: new Date().toISOString(),
              params: { ...INITIAL_PARAMS, baseRateAdult1Day: 45000 },
              coefficients: configCoefs,
              calculatedData: []
            };
            seedScenario.calculatedData = calculateScenarioPrices(seedScenario.params, seedScenario.coefficients);
            setScenarios([seedScenario]);
            setActiveScenarioId(seedScenario.id);
            notify("Sistema inicializado con configuración base", "info");
        } else {
            // CASO B: Cargar historial existente
            const loadedScenarios: Scenario[] = migratedHistory.map(h => ({
                id: h.scenarioId,
                name: h.name || 'Escenario Recuperado',
                season: h.season,
                type: h.scenarioType as ScenarioType,
                baseScenarioId: null,
                status: h.status,
                createdAt: h.closedAt || new Date().toISOString(),
                closedAt: h.closedAt,
                params: h.params,
                coefficients: configCoefs,
                calculatedData: h.data
            }));
            setScenarios(loadedScenarios);
            
            // Seleccionar el más reciente
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

  // --- ACTIONS ---

  const createScenario = () => {
    if (!activeScenario) {
        notify("No hay un escenario base seleccionado", "error");
        return; 
    }

    const existingDraft = scenarios.find(s => s.status === ScenarioStatus.DRAFT);
    if (existingDraft) {
      notify("Ya existe un borrador activo.", "warning");
      setActiveScenarioId(existingDraft.id);
      return;
    }

    // Tomar precio base del escenario actual
    const baseRow = activeScenario.calculatedData.find(r => r.days === 1);
    const newBaseRate = baseRow ? baseRow.adultRegularVisual : activeScenario.params.baseRateAdult1Day;
    const newId = `sc-${Date.now()}`;
    
    // CREACIÓN LIMPIA: Año 0 y Nombre vacío para forzar edición manual
    const newScenario: Scenario = {
      id: newId,
      name: "", // Nombre vacío
      season: 0, // Año 0 (se mostrará vacío en el input)
      type: ScenarioType.FINAL,
      baseScenarioId: activeScenario.id,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      params: {
        ...INITIAL_PARAMS,
        baseRateAdult1Day: newBaseRate,
        validFrom: activeScenario.params.validFrom,
        validTo: activeScenario.params.validTo,
        // Generar nuevos IDs únicos para las temporadas
        promoSeasons: activeScenario.params.promoSeasons.map(s => ({...s, id: `promo-${Date.now()}-${Math.random().toString(36).substr(2,5)}`})),
        regularSeasons: activeScenario.params.regularSeasons.map(s => ({...s, id: `reg-${Date.now()}-${Math.random().toString(36).substr(2,5)}`}))
      },
      coefficients: [...activeScenario.coefficients.map(c => ({...c}))],
      calculatedData: []
    };
    
    // Calcular datos iniciales
    newScenario.calculatedData = calculateScenarioPrices(newScenario.params, newScenario.coefficients);

    // Actualizar estado local (SIN GUARDAR EN DB)
    setScenarios([...scenarios, newScenario]);
    setActiveScenarioId(newId);
    setActiveTab('params');
    notify("Nuevo borrador creado. Define el Año y Nombre.", "info");
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
    setScenarios([...scenarios, copy]);
    setActiveScenarioId(newId);
    notify("Escenario duplicado (Solo local).", "success");
  };

  const renameScenario = (name: string) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? { ...s, name } : s));
  };

  // NUEVA FUNCIÓN: Actualizar el Año (Temporada)
  const updateSeason = (season: number) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? { ...s, season } : s));
  };

  // NUEVA FUNCIÓN: Cancelar/Descartar Borrador
  const discardDraft = () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;

    if (window.confirm("¿Cancelar la creación de este tarifario? Se perderán los cambios.")) {
        const nextScenarios = scenarios.filter(s => s.id !== activeScenarioId);
        setScenarios(nextScenarios);
        
        // Volver al último escenario disponible
        if (nextScenarios.length > 0) {
            setActiveScenarioId(nextScenarios[0].id);
        } else {
            setActiveScenarioId('');
        }
        notify("Borrador cancelado.", "info");
    }
  };

  const closeScenario = async () => {
    if (!activeScenario || activeScenario.status !== ScenarioStatus.DRAFT) return;
    
    // Validaciones estrictas antes de guardar
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

      // AQUÍ OCURRE EL ÚNICO GUARDADO REAL A LA BASE DE DATOS
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
    updated.calculatedData = calculateScenarioPrices(updated.params, updated.coefficients);
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updated : s));
  };

  const updateCoefficient = (day: number, value: number) => {
    if (!activeScenario || activeScenario.status === ScenarioStatus.CLOSED) return;
    const updated = { ...activeScenario, coefficients: activeScenario.coefficients.map(c => c.day === day ? { ...c, value } : c) };
    updated.calculatedData = calculateScenarioPrices(updated.params, updated.coefficients);
    setScenarios(scenarios.map(s => s.id === activeScenarioId ? updated : s));
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
    updateSeason, // Nueva exportación
    discardDraft, // Nueva exportación
    closeScenario, 
    updateParams, 
    updateCoefficient
  };
};