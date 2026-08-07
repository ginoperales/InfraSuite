import type { Budget } from '../pages/budgets/types';
import { db } from '@infrasuite/firebase';
// Firebase logic wrapped

const BUDGETS_LOCAL_STORAGE_KEY = 'infrasuite_budgets';
const USER_ID = 'user123'; // Replace with actual user ID from auth when ready

export const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electron !== undefined;
};

// ==========================================
// DESKTOP (ELECTRON + SQLITE) ADAPTER
// ==========================================

export const desktopDB = {
  getBudgets: async (): Promise<Budget[]> => {
    return await (window as any).electron.db.getBudgets();
  },
  getBudget: async (id: string): Promise<Budget | null> => {
    return await (window as any).electron.db.getBudget(id);
  },
  saveBudget: async (budget: Budget): Promise<boolean> => {
    return await (window as any).electron.db.saveBudget(budget);
  },
  deleteBudget: async (id: string): Promise<boolean> => {
    return await (window as any).electron.db.deleteBudget(id);
  }
};

// ==========================================
// WEB (LOCALSTORAGE) ADAPTER
// ==========================================

export const webLocalDB = {
  getBudgets: (): Budget[] => {
    try {
      const data = localStorage.getItem(BUDGETS_LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  getBudget: (id: string): Budget | null => {
    const budgets = webLocalDB.getBudgets();
    return budgets.find(b => b.id === id) || null;
  },
  saveBudget: (budget: Budget) => {
    const budgets = webLocalDB.getBudgets();
    const index = budgets.findIndex(b => b.id === budget.id);
    if (index >= 0) {
      budgets[index] = budget;
    } else {
      budgets.push(budget);
    }
    localStorage.setItem(BUDGETS_LOCAL_STORAGE_KEY, JSON.stringify(budgets));
    return true;
  },
  deleteBudget: (id: string) => {
    const budgets = webLocalDB.getBudgets();
    const filtered = budgets.filter(b => b.id !== id);
    localStorage.setItem(BUDGETS_LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  }
};

// ==========================================
// UNIFIED DATA ACCESS
// ==========================================

export const getLocalBudgets = async (): Promise<Budget[]> => {
  if (isElectron()) return desktopDB.getBudgets();
  return webLocalDB.getBudgets();
};

export const getLocalBudget = async (id: string): Promise<Budget | null> => {
  if (isElectron()) return desktopDB.getBudget(id);
  return webLocalDB.getBudget(id);
};

export const saveLocalBudget = async (budget: Budget): Promise<boolean> => {
  if (isElectron()) return desktopDB.saveBudget(budget);
  return webLocalDB.saveBudget(budget);
};

export const deleteLocalBudget = async (id: string): Promise<boolean> => {
  if (isElectron()) return desktopDB.deleteBudget(id);
  return webLocalDB.deleteBudget(id);
};

// ==========================================
// CLOUD SYNC LOGIC
// ==========================================

export interface SyncResult {
  downloaded: number;
  uploaded: number;
  message: string;
}

export const syncToCloud = async (
  onProgress?: (msg: string) => void,
  userId: string = USER_ID
): Promise<SyncResult> => {
  if (onProgress) onProgress('Iniciando sincronización con la nube...');
  let downloadedCount = 0;
  let uploadedCount = 0;
  
  try {
    // 1. Descargar presupuestos creados o modificados en la nube (ej: versión web)
    try {
      if (onProgress) onProgress('Verificando presupuestos en la nube...');
      const cloudDocsUser = await db.getDocs(`users/${userId}/budgets`).catch(() => []);
      const cloudDocsGeneral = await db.getDocs(`budgets`).catch(() => []);
      
      const map = new Map<string, any>();
      for (const d of [...cloudDocsUser, ...cloudDocsGeneral]) {
        if (d && d.id) map.set(d.id, d);
      }
      const cloudDocs = Array.from(map.values());
      const localBudgets = await getLocalBudgets();

      for (const cloudBudget of cloudDocs) {
        if (!cloudBudget || !cloudBudget.id) continue;
        const local = localBudgets.find(b => b.id === cloudBudget.id);

        if (!local) {
          // No existe localmente -> Descargar de la nube
          await saveLocalBudget({
            ...cloudBudget,
            isLocal: false,
            hasLocalChanges: false,
            syncedAt: Date.now()
          });
          downloadedCount++;
        } else if ((cloudBudget.updatedAt || 0) > (local.updatedAt || 0) && !local.hasLocalChanges) {
          // Existe pero la versión nube es más reciente y no hay cambios locales pendientes
          await saveLocalBudget({
            ...cloudBudget,
            isLocal: false,
            hasLocalChanges: false,
            syncedAt: Date.now()
          });
          downloadedCount++;
        }
      }
    } catch (e) {
      console.warn('Error comprobando datos en la nube durante la sincronización:', e);
    }

    // 2. Subir presupuestos con modificaciones locales o creados en local
    const currentLocalBudgets = await getLocalBudgets();
    for (const budget of currentLocalBudgets) {
      if (!budget.id) continue;
      
      // Subir a la nube si tiene modificaciones locales o si fue creado en local y no sincronizado
      if (budget.hasLocalChanges === true || budget.isLocal === true || !budget.syncedAt) {
        if (onProgress) onProgress(`Subiendo presupuesto modificado: ${budget.nombre}`);
        
        const now = Date.now();
        const updatedBudget: Budget = {
          ...budget,
          isLocal: false,
          hasLocalChanges: false,
          syncedAt: now,
          updatedAt: budget.updatedAt || now
        };

        try {
          await db.updateDoc(`users/${userId}/budgets`, budget.id, updatedBudget).catch(async () => {
            await db.addDoc(`users/${userId}/budgets`, updatedBudget).catch(() => {});
          });
          await db.updateDoc(`budgets`, budget.id, updatedBudget).catch(async () => {
            await db.addDoc(`budgets`, updatedBudget).catch(() => {});
          });
        } catch {}

        await saveLocalBudget(updatedBudget);
        uploadedCount++;
      }
    }

    const summaryMsg = `Sincronización exitosa: ${downloadedCount} descargado(s) de la nube, ${uploadedCount} modificado(s) subido(s).`;
    if (onProgress) onProgress(summaryMsg);

    return { downloaded: downloadedCount, uploaded: uploadedCount, message: summaryMsg };
  } catch (error) {
    console.error('Error durante syncToCloud:', error);
    if (onProgress) onProgress('Error en la sincronización con la nube.');
    throw error;
  }
};
