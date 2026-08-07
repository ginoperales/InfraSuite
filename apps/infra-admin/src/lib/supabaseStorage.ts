import { createClient } from '@supabase/supabase-js';
import type { Budget } from '../pages/budgets/types';

// Environmental or Default Config for Supabase Storage
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://smsmllenvdfvjypeplyp.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ig3zCd8qaGg642Reu0WY4Q_s3vjazEt';
const BUCKET_NAME = 'budgets';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOCAL_STORAGE_CACHE_KEY_PREFIX = 'supabase_json_cache_';

/**
 * Uploads a full budget serialized as a JSON file to Supabase Storage.
 * Path: budgets/{budgetId}.json
 */
export const uploadBudgetJsonToStorage = async (
  budget: Budget
): Promise<{ storageUrl: string; storagePath: string }> => {
  const filePath = `${budget.id}.json`;
  const jsonContent = JSON.stringify(budget, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });

  // Cache locally in localStorage for fast offline/fallback access
  try {
    localStorage.setItem(`${LOCAL_STORAGE_CACHE_KEY_PREFIX}${budget.id}`, jsonContent);
  } catch (e) {
    console.warn('LocalStorage cache write warning:', e);
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, blob, {
        contentType: 'application/json',
        upsert: true
      });

    if (error) {
      console.warn('Supabase storage upload returned error, using local cached URL:', error.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    const storageUrl = publicUrlData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`;

    return {
      storageUrl,
      storagePath: data?.path || filePath
    };
  } catch (err) {
    console.warn('Network error uploading to Supabase Storage, using fallback storage:', err);
    return {
      storageUrl: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${filePath}`,
      storagePath: filePath
    };
  }
};

/**
 * Downloads a full budget JSON file from Supabase Storage.
 */
export const downloadBudgetJsonFromStorage = async (
  storageUrlOrPath: string,
  budgetId: string
): Promise<Budget | null> => {
  try {
    const filePath = storageUrlOrPath.endsWith('.json')
      ? storageUrlOrPath.split('/').pop() || `${budgetId}.json`
      : `${budgetId}.json`;

    // Attempt downloading via Supabase SDK
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (!error && data) {
      const text = await data.text();
      const parsed = JSON.parse(text) as Budget;
      // Cache fresh JSON locally
      localStorage.setItem(`${LOCAL_STORAGE_CACHE_KEY_PREFIX}${budgetId}`, text);
      return parsed;
    }

    // Fallback: Fetch directly from HTTP URL if SDK download didn't return data
    if (storageUrlOrPath.startsWith('http')) {
      const response = await fetch(storageUrlOrPath);
      if (response.ok) {
        const text = await response.text();
        const parsed = JSON.parse(text) as Budget;
        localStorage.setItem(`${LOCAL_STORAGE_CACHE_KEY_PREFIX}${budgetId}`, text);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Supabase Storage download error, attempting local cache fallback:', err);
  }

  // Fallback to LocalStorage JSON cache if available
  try {
    const cached = localStorage.getItem(`${LOCAL_STORAGE_CACHE_KEY_PREFIX}${budgetId}`);
    if (cached) {
      return JSON.parse(cached) as Budget;
    }
  } catch {}

  return null;
};

/**
 * Deletes a budget JSON file from Supabase Storage.
 */
export const deleteBudgetJsonFromStorage = async (budgetId: string): Promise<boolean> => {
  try {
    const filePath = `${budgetId}.json`;
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    localStorage.removeItem(`${LOCAL_STORAGE_CACHE_KEY_PREFIX}${budgetId}`);
    return true;
  } catch {
    return false;
  }
};
