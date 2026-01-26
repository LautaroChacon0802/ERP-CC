import { useState, useEffect, useCallback } from 'react';
import { 
  Scenario, 
  HistoryLogEntry, 
  ScenarioStatus, 
  CoefficientRow,
  ScenarioType,
  ScenarioParams,
  ScenarioCategory
} from '../types';
import { BackendService } from '../api/backend';
import { INITIAL_PARAMS, migrateParams } from '../utils';

export const useScenarioData = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [history, setHistory] = useState<HistoryLogEntry[]>([]);
  const [defaultCoefficients, setDefaultCoefficients] = useState<CoefficientRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando sistema...');

  // --- ACTIONS: Internal Helpers ---
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // --- ACTIONS: API & State Mutation ---

  const loadInitialData = useCallback(async () => {
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

      // Seed Logic
      if (migratedHistory.length === 0) {
          const seedId = generateId();
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
            calculatedData: [] 
          };
          setScenarios([seedScenario]);
          return seedScenario.id; // Return active ID for controller
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
              calculatedData: []
          }));
          setScenarios(loadedScenarios);
          return null; // Controller decides active ID
      }
    } catch (error) {
      console.error("Error initializing:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createLocalDraft = useCallback((
    category: ScenarioCategory, 
    baseParams: ScenarioParams, 
    baseCoefficients: CoefficientRow[],
    baseScenarioId: string | null
  ) => {
    const newId = generateId();
    
    // Deep copy params to avoid reference issues
    const newParams: ScenarioParams = {
        ...baseParams,
        promoSeasons: baseParams.promoSeasons.map(s => ({...s, id: `promo-${generateId()}`})),
        regularSeasons: baseParams.regularSeasons.map(s => ({...s, id: `reg-${generateId()}`}))
    };

    const newScenario: Scenario = {
      id: newId,
      name: "",
      season: 0,
      type: ScenarioType.FINAL,
      category: category, 
      baseScenarioId: baseScenarioId,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      params: newParams,
      coefficients: baseCoefficients.map(c => ({...c})), // Deep copy
      calculatedData: [] 
    };

    setScenarios(prev => [newScenario, ...prev]);
    return newId;
  }, []);

  const updateLocalScenarioParams = useCallback((id: string, newParams: Partial<ScenarioParams>) => {
    setScenarios(prev => prev.map(s => s.id === id 
        ? { ...s, params: { ...s.params, ...newParams } } 
        : s
    ));
  }, []);

  const updateLocalScenarioCoefficients = useCallback((id: string, day: number, value: number) => {
    setScenarios(prev => prev.map(s => {
        if (s.id !== id) return s;
        return { 
            ...s, 
            coefficients: s.coefficients.map(c => c.day === day ? { ...c, value } : c) 
        };
    }));
  }, []);

  const updateLocalScenarioMeta = useCallback((id: string, meta: Partial<Pick<Scenario, 'name' | 'season'>>) => {
    setScenarios(prev => prev.map(s => s.id === id ? { ...s, ...meta } : s));
  }, []);

  const discardLocalDraft = useCallback((id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  }, []);

  const syncScenarioToDb = useCallback(async (scenario: Scenario) => {
    try {
        setLoadingMessage('Guardando en base de datos...');
        const success = await BackendService.saveScenario(scenario);
        
        if (!success) throw new Error("Backend reject");

        const logEntry: HistoryLogEntry = {
            scenarioId: scenario.id,
            name: scenario.name,
            season: scenario.season,
            scenarioType: scenario.type,
            status: ScenarioStatus.CLOSED,
            closedAt: scenario.closedAt!,
            category: scenario.category || 'LIFT',
            data: scenario.calculatedData,
            params: scenario.params
        };

        setScenarios(prev => prev.map(s => s.id === scenario.id ? scenario : s));
        setHistory(prev => [logEntry, ...prev]);
        return true;
    } catch (e) {
        console.error(e);
        return false;
    } finally {
        setLoadingMessage('');
    }
  }, []);

  return {
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
  };
};