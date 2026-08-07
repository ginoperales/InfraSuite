import { supabase } from './supabaseStorage';
import type { BudgetMetadataIndex } from '../pages/budgets/types';

const TABLE_NAME = 'budgets';
const LOCAL_METADATA_CACHE_KEY = 'supabase_db_metadata_cache';

/**
 * Converts camelCase BudgetMetadataIndex to snake_case row for Supabase Postgres table
 */
const toSupabaseRow = (metadata: BudgetMetadataIndex) => {
  return {
    id: metadata.id,
    nombre: metadata.nombre,
    cliente: metadata.cliente,
    fecha_base: metadata.fechaBase,
    grupo: metadata.grupo,
    categoria: metadata.categoria || 'Recientes',
    storage_url: metadata.storageUrl,
    storage_path: metadata.storagePath,
    owner_id: metadata.ownerId,
    permissions: metadata.permissions,
    link_access: metadata.linkAccess,
    link_role: metadata.linkRole,
    created_at: metadata.createdAt || Date.now(),
    updated_at: metadata.updatedAt || Date.now(),
    is_local: metadata.isLocal || false,
    synced_at: metadata.syncedAt || Date.now()
  };
};

/**
 * Converts snake_case Supabase Postgres row to camelCase BudgetMetadataIndex
 */
const fromSupabaseRow = (row: any): BudgetMetadataIndex => {
  return {
    id: row.id,
    nombre: row.nombre || 'SIN NOMBRE',
    cliente: row.cliente || '',
    fechaBase: row.fecha_base || row.fechaBase || '',
    grupo: row.grupo || 'EDIFICACIONES',
    categoria: row.categoria || 'Recientes',
    storageUrl: row.storage_url || row.storageUrl || '',
    storagePath: row.storage_path || row.storagePath || '',
    ownerId: row.owner_id || row.ownerId || '',
    permissions: row.permissions || {},
    linkAccess: row.link_access || row.linkAccess || 'RESTRICTED',
    linkRole: row.link_role || row.linkRole || 'VIEWER',
    createdAt: Number(row.created_at || row.createdAt || Date.now()),
    updatedAt: Number(row.updated_at || row.updatedAt || Date.now()),
    isLocal: false,
    syncedAt: Number(row.synced_at || Date.now())
  };
};

/**
 * Fetches lightweight budget metadata rows from Supabase Database.
 */
export const fetchBudgetsMetadataFromSupabase = async (
  userId?: string
): Promise<BudgetMetadataIndex[]> => {
  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (userId) {
      query = query.or(`owner_id.eq.${userId},link_access.eq.COMMUNITY_TEMPLATE,owner_id.is.null`);
    }

    const { data, error } = await query;

    if (!error && Array.isArray(data)) {
      const parsed = data.map(fromSupabaseRow);
      // Cache metadata locally for fast startup/fallback
      localStorage.setItem(LOCAL_METADATA_CACHE_KEY, JSON.stringify(parsed));
      return parsed;
    }

    if (error) {
      console.warn('Supabase DB fetch notice:', error.message);
    }
  } catch (err) {
    console.warn('Supabase DB fetch error, loading from local cache:', err);
  }

  // Fallback to local metadata cache
  try {
    const cached = localStorage.getItem(LOCAL_METADATA_CACHE_KEY);
    if (cached) return JSON.parse(cached) as BudgetMetadataIndex[];
  } catch {}

  return [];
};

/**
 * Upserts a budget metadata row into Supabase Database table 'budgets'.
 */
export const upsertBudgetMetadataToSupabase = async (
  metadata: BudgetMetadataIndex
): Promise<boolean> => {
  const row = toSupabaseRow(metadata);

  // Update local metadata cache optimistically
  try {
    const cachedStr = localStorage.getItem(LOCAL_METADATA_CACHE_KEY);
    const cached: BudgetMetadataIndex[] = cachedStr ? JSON.parse(cachedStr) : [];
    const idx = cached.findIndex(b => b.id === metadata.id);
    if (idx >= 0) cached[idx] = metadata;
    else cached.unshift(metadata);
    localStorage.setItem(LOCAL_METADATA_CACHE_KEY, JSON.stringify(cached));
  } catch (e) {
    console.warn('Metadata cache write warning:', e);
  }

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase DB upsert notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase DB upsert network error:', err);
    return false;
  }
};

/**
 * Deletes a budget metadata row from Supabase Database.
 */
export const deleteBudgetMetadataFromSupabase = async (
  budgetId: string
): Promise<boolean> => {
  // Update local metadata cache
  try {
    const cachedStr = localStorage.getItem(LOCAL_METADATA_CACHE_KEY);
    if (cachedStr) {
      const cached: BudgetMetadataIndex[] = JSON.parse(cachedStr);
      const filtered = cached.filter(b => b.id !== budgetId);
      localStorage.setItem(LOCAL_METADATA_CACHE_KEY, JSON.stringify(filtered));
    }
  } catch {}

  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', budgetId);

    if (error) {
      console.warn('Supabase DB delete notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase DB delete error:', err);
    return false;
  }
};

/**
 * Subscribes to realtime changes on the Supabase 'budgets' table.
 */
export const subscribeToBudgetsChangesFromSupabase = (
  onChangeCallback: () => void
) => {
  try {
    const channel = supabase
      .channel('public:budgets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: TABLE_NAME },
        () => {
          onChangeCallback();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Supabase Realtime subscription notice:', e);
    return () => {};
  }
};
