import { supabase } from '../lib/supabase';
import { Scenario, ScenarioParams, ScenarioStatus, ScenarioType } from '../types';

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
    .from('pricing_scenarios') 
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((s: any) => ({
    id: s.id,
    name: s.name,
    season: s.season,
    type: s.type as ScenarioType,
    status: s.status as ScenarioStatus,
    category: s.category,
    baseScenarioId: s.base_scenario_id,
    createdAt: s.created_at,
    closedAt: s.closed_at,
    params: safeJsonParse(s.params, {}),
    coefficients: safeJsonParse(s.coefficients, []),
    calculatedData: safeJsonParse(s.calculated_data, []), // Mapeo snake_case -> camelCase
  }));
};

export const createScenario = async (scenario: Scenario) => {
  const { error } = await supabase.from('pricing_scenarios').insert({
    id: scenario.id,
    name: scenario.name,
    season: scenario.season,
    type: scenario.type,
    status: scenario.status,
    category: scenario.category,
    base_scenario_id: scenario.baseScenarioId,
    created_at: scenario.createdAt,
    closed_at: scenario.closedAt,
    params: scenario.params,           // Supabase maneja JSONB automáticamente
    coefficients: scenario.coefficients,
    calculated_data: scenario.calculatedData
  });

  if (error) throw error;
  return true;
};

export const updateScenario = async (scenario: Scenario) => {
  const { error } = await supabase
    .from('pricing_scenarios')
    .update({
      name: scenario.name,
      season: scenario.season,
      type: scenario.type,
      status: scenario.status,
      closed_at: scenario.closedAt,
      params: scenario.params,
      coefficients: scenario.coefficients,
      calculated_data: scenario.calculatedData
    })
    .eq('id', scenario.id);

  if (error) throw error;
  return true;
};

export const deleteScenario = async (id: string) => {
  const { error } = await supabase.from('pricing_scenarios').delete().eq('id', id);
  if (error) throw error;
  return true;
};

// --- SERVICE OBJECT ---
export const BackendService = {
  getHistory: fetchScenarios,
  
  getDefaultCoefficients: async () => {
      // Configuración por defecto para inicializar nuevos escenarios
      const ALLOWED_DAYS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 30];
      return ALLOWED_DAYS.map(d => ({ day: d, value: 0 }));
  },
  
  saveScenario: async (scenario: Scenario) => {
    try {
      // Verificamos si existe para decidir entre Update o Insert
      const { data } = await supabase.from('pricing_scenarios').select('id').eq('id', scenario.id).maybeSingle();
      
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
  },

  deleteScenario: deleteScenario
};