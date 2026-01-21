
import { HistoryLogEntry, Scenario, CoefficientRow, User } from '../types';
import { DAYS_LIST, DEFAULT_COEFFICIENTS } from '../constants';

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

const isGAS = () => typeof window !== 'undefined' && window.google && window.google.script;

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
  // Auth
  login: async (email: string, pass: string): Promise<User> => {
    console.log('[MOCK] Login attempt:', email);
    await new Promise(r => setTimeout(r, 800));
    if (pass === 'admin') {
        return { 
            email, 
            name: 'Mock Admin', 
            permissions: ['ADMIN', 'PRICING_ACCESS', 'GASTRO_ACCESS', 'STOCK_ACCESS'] 
        };
    }
    if (pass === 'pricing') {
        return {
            email,
            name: 'Pricing User',
            permissions: ['PRICING_ACCESS']
        };
    }
    throw new Error("Credenciales Inválidas (Mock: user/admin)");
  },

  getUsers: async (): Promise<User[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
        { email: 'admin@cerrocastor.com', name: 'Admin', permissions: ['ADMIN', 'PRICING_ACCESS'] },
        { email: 'user@cerrocastor.com', name: 'Vendedor', permissions: ['PRICING_ACCESS'] }
    ];
  },

  saveUser: async (user: User, pass?: string): Promise<boolean> => {
    console.log('[MOCK] Saving user', user);
    await new Promise(r => setTimeout(r, 500));
    return true;
  },

  // Pricing
  getHistory: async (): Promise<HistoryLogEntry[]> => {
    console.log('[MOCK] Getting history...');
    await new Promise(r => setTimeout(r, 800)); 
    const stored = localStorage.getItem('mock_history');
    return stored ? JSON.parse(stored) : [];
  },

  saveScenario: async (scenario: Scenario): Promise<boolean> => {
    console.log('[MOCK] Closing scenario...', scenario.name);
    await new Promise(r => setTimeout(r, 1200)); 
    
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

    const currentHistory = await mockService.getHistory();
    const newHistory = [entry, ...currentHistory];
    localStorage.setItem('mock_history', JSON.stringify(newHistory));
    
    return true;
  },

  saveDraft: async (scenario: Scenario): Promise<boolean> => {
    console.log('[MOCK] Auto-saving draft...', scenario.name);
    const storedDrafts = localStorage.getItem('mock_drafts');
    const drafts = storedDrafts ? JSON.parse(storedDrafts) : {};
    drafts[scenario.id] = scenario;
    localStorage.setItem('mock_drafts', JSON.stringify(drafts));
    return true;
  },

  getDefaultCoefficients: async (): Promise<CoefficientRow[]> => {
    await new Promise(r => setTimeout(r, 500));
    return DAYS_LIST.map(day => ({
        day,
        value: DEFAULT_COEFFICIENTS[day] || 0
    }));
  }
};

// --- REAL SERVICE (GAS) ---
const gasService = {
  login: async (email: string, pass: string): Promise<User> => {
    const jsonStr = await runGoogleScript<string>('apiLogin', email, pass);
    return JSON.parse(jsonStr);
  },
  
  getUsers: async (): Promise<User[]> => {
    const jsonStr = await runGoogleScript<string>('apiGetUsers');
    return JSON.parse(jsonStr);
  },

  saveUser: async (user: User, pass?: string): Promise<boolean> => {
    return await runGoogleScript<boolean>('apiSaveUser', JSON.stringify(user), pass);
  },

  getHistory: async (): Promise<HistoryLogEntry[]> => {
    const rawData = await runGoogleScript<string>('apiGetHistory');
    return JSON.parse(rawData);
  },

  saveScenario: async (scenario: Scenario): Promise<boolean> => {
    const jsonString = JSON.stringify(scenario);
    return await runGoogleScript<boolean>('apiSaveScenario', jsonString);
  },

  saveDraft: async (scenario: Scenario): Promise<boolean> => {
    const jsonString = JSON.stringify(scenario);
    return await runGoogleScript<boolean>('apiSaveDraft', jsonString);
  },

  getDefaultCoefficients: async (): Promise<CoefficientRow[]> => {
    const rawData = await runGoogleScript<string>('apiGetDefaultCoefficients');
    return JSON.parse(rawData);
  }
};

export const BackendService = isGAS() ? gasService : mockService;
