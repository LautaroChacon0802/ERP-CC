// CAMBIO: Importamos la instancia 'supabase' ya inicializada, no 'createClient'
import { supabase } from '../lib/supabase'; 
import { Scenario, ScenarioParams, ScenarioStatus, ScenarioType } from '../types';

// =============================================================================
// SEGURIDAD: VALIDACIONES DE ESTADO
// =============================================================================

const ensureScenarioIsEditable = async (scenarioId: string): Promise<void> => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('status, type')
    .eq('id', scenarioId)
    .single();

  if (error) throw new Error('Error verificando estado del escenario');
  
  if (data.status === ScenarioStatus.CLOSED || data.type === ScenarioType.FINAL) {
    throw new Error('OPERACIÓN DENEGADA: El tarifario está cerrado o finalizado y no admite modificaciones.');
  }
};

// =============================================================================
// API METHODS
// =============================================================================

export const fetchScenarios = async (): Promise<Scenario[]> => {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  return data.map((s: any) => ({
    ...s,
    params: typeof s.params === 'string' ? JSON.parse(s.params) : s.params,
    coefficients: typeof s.coefficients === 'string' ? JSON.parse(s.coefficients) : s.coefficients,
    calculatedData: typeof s.calculated_data === 'string' ? JSON.parse(s.calculated_data) : s.calculated_data,
  }));
};

export const createScenario = async (scenario: Omit<Scenario, 'id' | 'createdAt'>): Promise<Scenario> => {
  const { data, error } = await supabase
    .from('scenarios')
    .insert([{
      name: scenario.name,
      season: scenario.season,
      type: scenario.type,
      status: scenario.status,
      category: scenario.category,
      base_scenario_id: scenario.baseScenarioId,
      params: scenario.params,
      coefficients: scenario.coefficients,
      calculated_data: scenario.calculatedData
    }])
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    params: data.params,
    coefficients: data.coefficients,
    calculatedData: data.calculated_data
  };
};

export const updateScenario = async (scenario: Scenario): Promise<void> => {
  // Validación de seguridad antes de escribir
  const { data: currentDbState } = await supabase
    .from('scenarios')
    .select('status, type')
    .eq('id', scenario.id)
    .single();

  if (currentDbState) {
    const isCurrentlyClosed = currentDbState.status === ScenarioStatus.CLOSED || currentDbState.type === ScenarioType.FINAL;
    const isTryingToReopen = scenario.status === ScenarioStatus.DRAFT; 
    
    if (isCurrentlyClosed && !isTryingToReopen) {
       throw new Error('Bloqueo de Seguridad: No se puede modificar un escenario cerrado.');
    }
  }

  const { error } = await supabase
    .from('scenarios')
    .update({
      name: scenario.name,
      season: scenario.season,
      type: scenario.type,
      status: scenario.status,
      closed_at: scenario.status === ScenarioStatus.CLOSED ? new Date().toISOString() : null,
      params: scenario.params,
      coefficients: scenario.coefficients,
      calculated_data: scenario.calculatedData
    })
    .eq('id', scenario.id);

  if (error) throw error;
};

export const updateScenarioParams = async (id: string, params: ScenarioParams): Promise<void> => {
  await ensureScenarioIsEditable(id);

  const { error } = await supabase
    .from('scenarios')
    .update({ params })
    .eq('id', id);

  if (error) throw error;
};

export const deleteScenario = async (id: string): Promise<void> => {
  await ensureScenarioIsEditable(id); 

  const { error } = await supabase
    .from('scenarios')
    .delete()
    .eq('id', id);

  if (error) throw error;
};