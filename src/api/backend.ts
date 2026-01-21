import { supabase } from '../lib/supabase';
import { HistoryLogEntry, Scenario, CoefficientRow } from '../types';

export const BackendService = {
  // Obtener coeficientes desde Supabase
  getDefaultCoefficients: async (): Promise<CoefficientRow[]> => {
    const { data, error } = await supabase
      .from('config_coefficients')
      .select('day, value')
      .order('day', { ascending: true });

    if (error) throw error;
    return data as CoefficientRow[];
  },

  // Obtener historial de escenarios cerrados
  getHistory: async (): Promise<HistoryLogEntry[]> => {
    const { data, error } = await supabase
      .from('pricing_scenarios')
      .select('*')
      .eq('status', 'CERRADO')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data.map(row => ({
      scenarioId: row.id,
      name: row.name,
      season: row.season,
      scenarioType: row.type,
      status: row.status,
      closedAt: row.closed_at,
      data: row.calculated_data,
      params: row.params
    }));
  },

  // Guardar un escenario (Upsert permite crear o actualizar)
  saveScenario: async (scenario: Scenario): Promise<boolean> => {
    const { error } = await supabase
      .from('pricing_scenarios')
      .upsert({
        // Si el ID empieza con 'sc-', es temporal de la app; dejamos que Supabase genere el UUID real
        id: scenario.id.startsWith('sc-') ? undefined : scenario.id,
        name: scenario.name,
        season: scenario.season,
        type: scenario.type,
        status: scenario.status,
        params: scenario.params,
        calculated_data: scenario.calculatedData,
        closed_at: scenario.status === 'CERRADO' ? new Date().toISOString() : null
      });

    return !error;
  }
};