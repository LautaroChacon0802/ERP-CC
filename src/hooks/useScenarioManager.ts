import { useState, useEffect, useCallback } from 'react';
import { Scenario, ScenarioStatus, ScenarioType, ScenarioParams, CoefficientRow } from '../types';
import * as api from '../api/backend';
import { INITIAL_PARAMS, INITIAL_COEFFICIENTS, calculatePricingData } from '../utils';
// import// ...existing code...
export const useToast = () => {
  // ...existing implementation...
};

// ...existing code...ast } from '../components/ToastSystem'; // Asumimos que existe o usas el interno

// Mock de usuario para lógica de permisos (esto vendría de AuthContext)
const MOCK_USER_ROLE = 'ADMIN'; 

export const useScenarioManager = () => {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('LIFT');
  
  // Estado UI
  const [activeTab, setActiveTab] = useState<'params' | 'coef' | 'matrix' | 'visual' | 'system' | 'compare' | 'history'>('params');

  // Sistema de Toasts
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Carga inicial
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    setIsLoading(true);
    setLoadingMessage('Sincronizando tarifarios...');
    try {
      const data = await api.fetchScenarios();
      setScenarios(data);
    } catch (error) {
      console.error(error);
      addToast('Error cargando tarifarios', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Selectores
  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || null;
  
  const filteredScenarios = scenarios.filter(s => {
    const cat = s.category || 'LIFT';
    return cat === selectedCategory;
  });

  const history = filteredScenarios.filter(s => s.status === ScenarioStatus.CLOSED);

  // ===========================================================================
  // LÓGICA DE SEGURIDAD E INMUTABILIDAD
  // ===========================================================================
  
  /**
   * Verifica si un escenario es editable.
   * Centraliza la regla de negocio: CLOSED o FINAL = Solo Lectura.
   */
  const isEditable = useCallback((scenario: Scenario | null): boolean => {
    if (!scenario) return false;
    // REGLA DE ORO: Si está cerrado o es final, es inmutable.
    if (scenario.status === ScenarioStatus.CLOSED) return false;
    if (scenario.type === ScenarioType.FINAL) return false;
    return true;
  }, []);

  // ===========================================================================
  // OPERACIONES (CRUD)
  // ===========================================================================

  const createScenario = async (name: string, type: ScenarioType, copyFromId?: string) => {
    setIsLoading(true);
    setLoadingMessage('Creando escenario...');
    try {
      let baseData = {
        params: INITIAL_PARAMS,
        coefficients: INITIAL_COEFFICIENTS,
        season: new Date().getFullYear() + 1
      };

      if (copyFromId) {
        const source = scenarios.find(s => s.id === copyFromId);
        if (source) {
          baseData = {
            params: source.params,
            coefficients: source.coefficients,
            season: source.season
          };
        }
      }

      const newScenario = await api.createScenario({
        name,
        type,
        status: ScenarioStatus.DRAFT,
        season: baseData.season,
        baseScenarioId: copyFromId || null,
        category: selectedCategory as any,
        params: baseData.params,
        coefficients: baseData.coefficients,
        calculatedData: calculatePricingData(baseData.params, baseData.coefficients)
      });

      setScenarios(prev => [newScenario, ...prev]);
      setActiveScenarioId(newScenario.id);
      addToast('Escenario creado correctamente', 'success');
    } catch (e) {
      addToast('Error al crear escenario', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const updateParams = async (newParams: Partial<ScenarioParams>) => {
    if (!activeScenario) return;

    // 1. CANDADO LÓGICO
    if (!isEditable(activeScenario)) {
      addToast('ACCIÓN DENEGADA: El tarifario está cerrado y no se puede editar.', 'error');
      return;
    }

    // Optimistic Update
    const updatedParams = { ...activeScenario.params, ...newParams };
    const updatedData = calculatePricingData(updatedParams, activeScenario.coefficients);
    
    const updatedScenario = { 
      ...activeScenario, 
      params: updatedParams,
      calculatedData: updatedData
    };

    // Actualizamos localmente rápido
    setScenarios(prev => prev.map(s => s.id === activeScenario.id ? updatedScenario : s));

    try {
      // Intentamos guardar en DB (El backend validará de nuevo)
      await api.updateScenario(updatedScenario);
    } catch (e: any) {
      // Rollback si falla (ej. si otro usuario lo cerró mientras tanto)
      console.error(e);
      addToast(`Error guardando: ${e.message}`, 'error');
      loadScenarios(); // Recargamos para tener la verdad
    }
  };

  const updateCoefficient = async (day: number, value: number) => {
    if (!activeScenario) return;

    // 1. CANDADO LÓGICO
    if (!isEditable(activeScenario)) {
      addToast('ACCIÓN DENEGADA: El tarifario está cerrado.', 'error');
      return;
    }

    const updatedCoeffs = activeScenario.coefficients.map(c => 
      c.day === day ? { ...c, value } : c
    );
    
    const updatedData = calculatePricingData(activeScenario.params, updatedCoeffs);
    const updatedScenario = { 
      ...activeScenario, 
      coefficients: updatedCoeffs,
      calculatedData: updatedData 
    };

    setScenarios(prev => prev.map(s => s.id === activeScenario.id ? updatedScenario : s));

    try {
      await api.updateScenario(updatedScenario);
    } catch (e: any) {
      addToast(`Error al guardar: ${e.message}`, 'error');
      loadScenarios();
    }
  };

  const renameScenario = async (id: string, newName: string) => {
    const target = scenarios.find(s => s.id === id);
    if (!target) return;

    // Permitimos renombrar solo si es editable (o podrías decidir que renombrar sí se puede)
    if (!isEditable(target)) {
      addToast('No se puede renombrar un escenario cerrado.', 'error');
      return;
    }

    try {
      const updated = { ...target, name: newName };
      await api.updateScenario(updated);
      setScenarios(prev => prev.map(s => s.id === id ? updated : s));
      addToast('Nombre actualizado', 'success');
    } catch (e) {
      addToast('Error al renombrar', 'error');
    }
  };

  const updateSeason = async (id: string, newSeason: number) => {
    const target = scenarios.find(s => s.id === id);
    if (!target) return;

    if (!isEditable(target)) {
      addToast('No se puede cambiar la temporada de un histórico.', 'error');
      return;
    }

    try {
      const updated = { ...target, season: newSeason };
      await api.updateScenario(updated);
      setScenarios(prev => prev.map(s => s.id === id ? updated : s));
    } catch (e) {
      addToast('Error al actualizar temporada', 'error');
    }
  };

  const duplicateScenario = async (id: string) => {
    const source = scenarios.find(s => s.id === id);
    if (!source) return;
    await createScenario(`${source.name} (Copia)`, ScenarioType.DRAFT, id);
  };

  const closeScenario = async (id: string) => {
    const target = scenarios.find(s => s.id === id);
    if (!target) return;

    if (target.status === ScenarioStatus.CLOSED) {
        addToast('El escenario ya está cerrado.', 'info');
        return;
    }

    if (!window.confirm('¿Está seguro de CERRAR este tarifario? Se volverá inmutable.')) return;

    try {
      const updated = { 
        ...target, 
        status: ScenarioStatus.CLOSED, 
        type: ScenarioType.FINAL, // Forzamos tipo Final al cerrar
        closedAt: new Date().toISOString() 
      };
      
      await api.updateScenario(updated);
      setScenarios(prev => prev.map(s => s.id === id ? updated : s));
      addToast('Tarifario cerrado y protegido correctamente.', 'success');
    } catch (e) {
      addToast('Error al cerrar tarifario', 'error');
    }
  };

  const discardDraft = async (id: string) => {
    const target = scenarios.find(s => s.id === id);
    if (!target) return;

    // Protección adicional: No borrar históricos cerrados por error
    if (target.status === ScenarioStatus.CLOSED) {
      addToast('No se puede eliminar un tarifario cerrado (Histórico).', 'error');
      return;
    }

    if (!window.confirm('¿Eliminar este borrador permanentemente?')) return;

    try {
      await api.deleteScenario(id);
      setScenarios(prev => prev.filter(s => s.id !== id));
      if (activeScenarioId === id) setActiveScenarioId(null);
      addToast('Borrador eliminado', 'info');
    } catch (e) {
      addToast('Error eliminando', 'error');
    }
  };

  return {
    scenarios,
    filteredScenarios,
    history, // Lista de cerrados
    activeScenario,
    activeScenarioId,
    isLoading,
    loadingMessage,
    activeTab,
    selectedCategory,
    toasts,
    removeToast,
    setActiveTab,
    setSelectedCategory,
    setActiveScenarioId,
    createScenario,
    updateParams,
    updateCoefficient,
    updateSeason,
    renameScenario,
    duplicateScenario,
    closeScenario,
    discardDraft,
    isEditable // Exportamos esta utilidad por si la UI la necesita
  };
};