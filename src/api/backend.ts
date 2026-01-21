import { supabase } from '../lib/supabase';
import { HistoryLogEntry, Scenario, CoefficientRow, User } from '../types';

export const BackendService = {
  // --- MÓDULO PRICING ---

  // Obtener coeficientes
  getDefaultCoefficients: async (): Promise<CoefficientRow[]> => {
    const { data, error } = await supabase
      .from('config_coefficients')
      .select('day, value')
      .order('day', { ascending: true });

    if (error) throw error;
    return data as CoefficientRow[];
  },

  // Obtener historial (Solo escenarios CERRADOS)
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

  // Guardar Escenario (Funciona para crear y actualizar)
  saveScenario: async (scenario: Scenario): Promise<boolean> => {
    const { error } = await supabase
      .from('pricing_scenarios')
      .upsert({
        // Si el ID es temporal (empieza con 'sc-' o 'copy-'), dejamos que Supabase cree uno nuevo
        // Si ya es un UUID real, lo respetamos para actualizar
        id: (scenario.id.startsWith('sc-') || scenario.id.startsWith('copy-')) ? undefined : scenario.id,
        name: scenario.name,
        season: scenario.season,
        type: scenario.type,
        status: scenario.status,
        params: scenario.params,
        calculated_data: scenario.calculatedData,
        closed_at: scenario.status === 'CERRADO' ? new Date().toISOString() : null,
        created_at: scenario.createdAt // Mantenemos la fecha de creación original
      });

    return !error;
  },

  // ALIAS: Guardar Borrador (Usa la misma lógica que saveScenario)
  // Esto soluciona tu error en la línea 116 de useScenarioManager
  saveDraft: async (scenario: Scenario): Promise<boolean> => {
    return BackendService.saveScenario(scenario);
  },

  // --- MÓDULO ADMIN (USUARIOS) ---

  getUsers: async (): Promise<User[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) throw error;

    return data.map(p => ({
      email: p.email,
      name: p.full_name,
      permissions: p.permissions
    }));
  },

  saveUser: async (user: User): Promise<boolean> => {
    // Actualizamos solo permisos y nombre en la tabla profiles.
    // (La creación de usuarios nuevos con contraseña requiere usar el panel de Supabase)
    const { error } = await supabase
      .from('profiles')
      .update({ 
        full_name: user.name, 
        permissions: user.permissions 
      })
      .eq('email', user.email);

    return !error;
  }
};