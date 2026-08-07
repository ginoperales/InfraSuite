import type { Budget, BudgetMetadataIndex } from '../pages/budgets/types';
import { db } from '@infrasuite/firebase';
import { uploadBudgetJsonToStorage, downloadBudgetJsonFromStorage } from './supabaseStorage';

const BUDGETS_LOCAL_STORAGE_KEY = 'infrasuite_budgets';
const USER_ID = 'user123'; // Replace with actual user ID from auth when ready

export const isElectron = () => {
  return typeof window !== 'undefined' && (window as any).electron !== undefined;
};

/**
 * Extracts lightweight metadata index (stripping heavy partidas & pieRows arrays) for Firestore catalog index
 */
export const extractBudgetMetadata = (budget: Budget): BudgetMetadataIndex => {
  return {
    id: budget.id,
    nombre: budget.nombre,
    cliente: budget.cliente,
    fechaBase: budget.fechaBase,
    grupo: budget.grupo,
    categoria: budget.categoria || 'Recientes',
    storageUrl: budget.storageUrl,
    storagePath: budget.storagePath,
    ownerId: budget.ownerId,
    permissions: budget.permissions,
    linkAccess: budget.linkAccess,
    linkRole: budget.linkRole,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
    isLocal: budget.isLocal,
    hasLocalChanges: budget.hasLocalChanges,
    syncedAt: budget.syncedAt
  };
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
// CLOUD SYNC & SUPABASE STORAGE LOGIC
// ==========================================

export interface SyncResult {
  downloaded: number;
  uploaded: number;
  message: string;
}

/**
 * Saves full budget payload to Supabase Storage as JSON and updates lightweight metadata document in Firestore index.
 */
export const saveBudgetWithStorage = async (
  budget: Budget,
  userId: string = USER_ID
): Promise<Budget> => {
  const now = Date.now();
  
  // 1. Upload heavy budget payload (JSON) to Supabase Storage
  const { storageUrl, storagePath } = await uploadBudgetJsonToStorage({
    ...budget,
    updatedAt: budget.updatedAt || now
  });

  const updatedBudget: Budget = {
    ...budget,
    storageUrl,
    storagePath,
    hasLocalChanges: false,
    syncedAt: now,
    updatedAt: budget.updatedAt || now
  };

  // 2. Extract lightweight metadata index for Firestore (NO heavy partidas array!)
  const metadataIndex = extractBudgetMetadata(updatedBudget);

  try {
    await db.updateDoc(`users/${userId}/budgets`, budget.id, metadataIndex).catch(async () => {
      await db.addDoc(`users/${userId}/budgets`, metadataIndex).catch(() => {});
    });
    await db.updateDoc(`budgets`, budget.id, metadataIndex).catch(async () => {
      await db.addDoc(`budgets`, metadataIndex).catch(() => {});
    });
  } catch (err) {
    console.warn('Firestore index update warning:', err);
  }

  // 3. Save local copy
  await saveLocalBudget(updatedBudget);

  return updatedBudget;
};

export const syncToCloud = async (
  onProgress?: (msg: string) => void,
  userId: string = USER_ID
): Promise<SyncResult> => {
  if (onProgress) onProgress('Iniciando sincronización (Índice Firestore + JSON Supabase)...');
  let downloadedCount = 0;
  let uploadedCount = 0;
  
  try {
    // 1. Descargar metadatos de presupuestos de la nube
    try {
      if (onProgress) onProgress('Verificando índice de presupuestos en Firestore...');
      const cloudDocsUser = await db.getDocs(`users/${userId}/budgets`).catch(() => []);
      const cloudDocsGeneral = await db.getDocs(`budgets`).catch(() => []);
      
      const map = new Map<string, any>();
      for (const d of [...cloudDocsUser, ...cloudDocsGeneral]) {
        if (d && d.id) map.set(d.id, d);
      }
      const cloudDocs = Array.from(map.values());
      const localBudgets = await getLocalBudgets();

      for (const cloudMeta of cloudDocs) {
        if (!cloudMeta || !cloudMeta.id) continue;
        const local = localBudgets.find(b => b.id === cloudMeta.id);

        const shouldDownload = !local || ((cloudMeta.updatedAt || 0) > (local.updatedAt || 0) && !local.hasLocalChanges);

        if (shouldDownload && cloudMeta.storageUrl) {
          if (onProgress) onProgress(`Descargando JSON de Supabase Storage: ${cloudMeta.nombre}...`);
          const fullBudget = await downloadBudgetJsonFromStorage(cloudMeta.storageUrl, cloudMeta.id);
          if (fullBudget) {
            await saveLocalBudget({
              ...fullBudget,
              storageUrl: cloudMeta.storageUrl,
              storagePath: cloudMeta.storagePath,
              isLocal: false,
              hasLocalChanges: false,
              syncedAt: Date.now()
            });
            downloadedCount++;
          }
        }
      }
    } catch (e) {
      console.warn('Error comprobando índice en la nube durante la sincronización:', e);
    }

    // 2. Subir presupuestos con modificaciones locales a Supabase Storage + Firestore Index
    const currentLocalBudgets = await getLocalBudgets();
    for (const budget of currentLocalBudgets) {
      if (!budget.id) continue;
      
      if (budget.hasLocalChanges === true || budget.isLocal === true || !budget.syncedAt) {
        if (onProgress) onProgress(`Subiendo archivo JSON a Supabase: ${budget.nombre}...`);
        await saveBudgetWithStorage(budget, userId);
        uploadedCount++;
      }
    }

    const summaryMsg = `Sincronización exitosa: ${downloadedCount} descargado(s) de Supabase Storage, ${uploadedCount} subido(s).`;
    if (onProgress) onProgress(summaryMsg);

    return { downloaded: downloadedCount, uploaded: uploadedCount, message: summaryMsg };
  } catch (error) {
    console.error('Error durante syncToCloud:', error);
    if (onProgress) onProgress('Error en la sincronización con Supabase / Firestore.');
    throw error;
  }
};
