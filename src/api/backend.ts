import { supabase } from '../lib/supabase';
import { Scenario, ScenarioParams, ScenarioStatus, ScenarioType } from '../types';

// Helper para parsear JSON de forma segura si viene como string
const safeJsonParse = (val: any, fallback: any) => {
  if (typeof val === 'string') {
    try {
      return JSON.parse(val);
    } catch {
      return fallback;
    }
  }
  return val || fallback;
};

// --- CRUD OPERATIONS ---

export const fetchScenarios = async (): Promise<Scenario[]> => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // MAPEO CRÍTICO: Snake_case (DB) -> CamelCase (App)
  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    season: s.season,
    type: s.type as ScenarioType,
    status: s.status as ScenarioStatus,
    category: s.category,
    
    // Mapeo explícito de campos compuestos
    baseScenarioId: s.base_scenario_id,
    createdAt: s.created_at,
    closedAt: s.closed_at,
    
    // Parsing seguro de campos JSONB
    params: safeJsonParse(s.params, {}),
    coefficients: safeJsonParse(s.coefficients, []),
    calculatedData: safeJsonParse(s.calculated_data, []),
  }));
};

export const createScenario = async (scenario: Scenario) => {
  // MAPEO INVERSO: CamelCase (App) -> Snake_case (DB)
  const { error } = await supabase.from('scenarios').insert({
    id: scenario.id,
    name: scenario.name,
    season: scenario.season,
    type: scenario.type,
    status: scenario.status,
    category: scenario.category,
    base_scenario_id: scenario.baseScenarioId,
    created_at: scenario.createdAt,
    closed_at: scenario.closedAt,
    params: scenario.params,
    coefficients: scenario.coefficients,
    calculated_data: scenario.calculatedData // Importante: guardar la data calculada
  });

  if (error) throw error;
  return true;
};

export const updateScenario = async (scenario: Scenario) => {
  const { error } = await supabase
    .from('scenarios')
    .update({
      name: scenario.name,
      season: scenario.season,
      type: scenario.type,
      status: scenario.status,
      closed_at: scenario.closedAt, // Actualizar fecha cierre si aplica
      params: scenario.params,
      coefficients: scenario.coefficients,
      calculated_data: scenario.calculatedData
    })
    .eq('id', scenario.id);

  if (error) throw error;
  return true;
};

export const updateScenarioParams = async (id: string, params: ScenarioParams) => {
  const { error } = await supabase
    .from('scenarios')
    .update({ params })
    .eq('id', id);

  if (error) throw error;
  return true;
};

export const deleteScenario = async (id: string) => {
  const { error } = await supabase.from('scenarios').delete().eq('id', id);
  if (error) throw error;
  return true;
};

// --- SERVICE OBJECT (Singleton-like access) ---
export const BackendService = {
  getHistory: fetchScenarios,
  getDefaultCoefficients: async () => Array.from({ length: 15 }, (_, i) => ({ day: i + 1, value: 0 })),
  
  saveScenario: async (scenario: Scenario) => {
    try {
      // Upsert logic manual para mayor control
      const { data } = await supabase.from('scenarios').select('id').eq('id', scenario.id).maybeSingle();
      if (data) {
        await updateScenario(scenario);
      } else {
        await createScenario(scenario);
      }
      return true;
    } catch (e) {
      console.error("BackendService Save Error:", e);
      return false;
    }
  }
};