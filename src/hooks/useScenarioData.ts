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
import { INITIAL_PARAMS, migrateParams, calculateScenarioPrices } from '../utils';

export const useScenarioData = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [history, setHistory] = useState<HistoryLogEntry[]>([]);
  const [defaultCoefficients, setDefaultCoefficients] = useState<CoefficientRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingMessage, setLoadingMessage] = useState<string>('Iniciando sistema...');

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `sc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

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

      if (migratedHistory.length === 0) {
          const seedId = generateId();
          const seedParams = { ...INITIAL_PARAMS, baseRateAdult1Day: 45000 };
          
          // FIX: Calcular datos iniciales para el escenario semilla
          const initialCalculatedData = calculateScenarioPrices(
              seedParams, 
              configCoefs, 
              'LIFT'
          );

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
            params: seedParams,
            coefficients: configCoefs,
            calculatedData: initialCalculatedData 
          };
          setScenarios([seedScenario]);
          return seedScenario.id; 
      } else {
          const loadedScenarios: Scenario[] = migratedHistory.map(h => ({
              id: h.id, 
              name: h.name || 'Escenario Recuperado',
              season: h.season,
              type: h.type as ScenarioType,
              category: h.category || 'LIFT', 
              baseScenarioId: h.baseScenarioId || null,
              status: h.status,
              createdAt: h.createdAt || new Date().toISOString(),
              closedAt: h.closedAt,
              params: h.params,
              coefficients: (h.coefficients && h.coefficients.length > 0) ? h.coefficients : configCoefs,
              calculatedData: h.calculatedData || []
          }));
          setScenarios(loadedScenarios);
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

    // FIX: Garantizar coeficientes por defecto si baseCoefficients está vacío
    const effectiveCoefficients = (baseCoefficients && baseCoefficients.length > 0)
        ? baseCoefficients
        : defaultCoefficients;

    // FIX CRÍTICO: Cálculo inicial de datos al crear el borrador
    // Esto asegura que si es Rental, se itere sobre los items y se generen las columnas
    const initialCalculatedData = calculateScenarioPrices(
        newParams,
        effectiveCoefficients,
        category
    );

    const newScenario: Scenario = {
      id: newId,
      name: "",
      season: 0,
      type: ScenarioType.DRAFT, 
      category: category, 
      baseScenarioId: baseScenarioId,
      status: ScenarioStatus.DRAFT,
      createdAt: new Date().toISOString(),
      params: newParams,
      coefficients: effectiveCoefficients.map(c => ({...c})), // Deep copy seguro
      calculatedData: initialCalculatedData 
    };

    setScenarios(prev => [newScenario, ...prev]);
    return newId;
  }, [defaultCoefficients]); 

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