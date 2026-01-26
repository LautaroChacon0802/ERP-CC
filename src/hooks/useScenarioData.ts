import { useState, useCallback } from 'react';
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

  // --- INTERNAL HELPERS ---
  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // --- API ACTIONS ---

  const loadInitialData = useCallback(async (): Promise<string | null> => {
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

      // Convertimos a LogEntry para historial visual
      const logEntries: HistoryLogEntry[] = migratedHistory.map(h => ({
        scenarioId: h.id,
        name: h.name,
        season: h.season,
        scenarioType: h.type,
        status: h.status,
        closedAt: h.closedAt || new Date().toISOString(),
        category: h.category || 'LIFT',
        data: h.calculatedData,
        params: h.params
      }));

      setHistory(logEntries);
      setDefaultCoefficients(configCoefs);

      // Seed Logic: Si no hay historia, creamos un seed en memoria
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
          return seedScenario.id; 
      } else {
          // Cargamos escenarios existentes
          setScenarios(migratedHistory);
          return null; 
      }
    } catch (error) {
      console.error("Error en data layer:", error);
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
  ): string => {
    const newId = generateId();
    
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
      coefficients: baseCoefficients.map(c => ({...c})),
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

  const syncScenarioToDb = useCallback(async (scenario: Scenario): Promise<boolean> => {
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