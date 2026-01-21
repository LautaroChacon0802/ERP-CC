import { HistoryLogEntry, Scenario } from '../types';

// Type definitions for Google Apps Script internals
declare global {
  interface Window {
    google: {
      script: {
        run: {
          withSuccessHandler: (callback: (response: any) => void) => {
            withFailureHandler: (callback: (error: Error) => void) => any;
          };
          [key: string]: any;
        };
      };
    };
  }
}

// Helper to detect environment
const isGAS = () => typeof window !== 'undefined' && window.google && window.google.script;

// --- PROMISE WRAPPER FOR GAS ---
const runGoogleScript = <T>(functionName: string, ...args: any[]): Promise<T> => {
  return new Promise((resolve, reject) => {
    if (!isGAS()) {
      reject(new Error('Google Script environment not found'));
      return;
    }
    
    window.google.script.run
      .withSuccessHandler((response: T) => resolve(response))
      .withFailureHandler((error: Error) => reject(error))
      [functionName](...args);
  });
};

// --- MOCK SERVICE (FOR LOCALHOST) ---
const mockService = {
  getHistory: async (): Promise<HistoryLogEntry[]> => {
    console.log('[MOCK] Getting history from localStorage...');
    await new Promise(r => setTimeout(r, 800)); // Simulate network delay
    const stored = localStorage.getItem('mock_history');
    return stored ? JSON.parse(stored) : [];
  },

  saveScenario: async (scenario: Scenario): Promise<boolean> => {
    console.log('[MOCK] Saving scenario...', scenario.name);
    await new Promise(r => setTimeout(r, 1200)); // Simulate network delay
    
    // Create history entry
    const entry: HistoryLogEntry = {
      scenarioId: scenario.id,
      name: scenario.name,
      season: scenario.season,
      scenarioType: scenario.type,
      status: scenario.status,
      closedAt: scenario.closedAt || new Date().toISOString(),
      data: scenario.calculatedData,
      params: scenario.params
    };

    // Save to local storage mock
    const currentHistory = await mockService.getHistory();
    const newHistory = [entry, ...currentHistory];
    localStorage.setItem('mock_history', JSON.stringify(newHistory));
    
    return true;
  }
};

// --- REAL SERVICE (GAS) ---
const gasService = {
  getHistory: async (): Promise<HistoryLogEntry[]> => {
    const rawData = await runGoogleScript<string>('apiGetHistory');
    return JSON.parse(rawData);
  },

  saveScenario: async (scenario: Scenario): Promise<boolean> => {
    // Serialize complex object before sending to GAS
    const jsonString = JSON.stringify(scenario);
    return await runGoogleScript<boolean>('apiSaveScenario', jsonString);
  }
};

// --- EXPORTED API ---
export const BackendService = isGAS() ? gasService : mockService;
