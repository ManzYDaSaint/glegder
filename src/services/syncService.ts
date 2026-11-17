import { getUnsyncedRecords, markAsSynced, getShopProfile, saveShopProfile, getDatabase } from '../db';
import { ENV } from '../constants/env';
import { ShopProfile } from '../types';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  pendingCount: number;
}

/**
 * Sends a batch upsert to Supabase via its standard REST PostgREST API
 */
async function syncBatchToSupabase(
  endpoint: string,
  records: any[],
  supabaseUrl: string,
  anonKey: string
): Promise<boolean> {
  if (records.length === 0) return true;

  try {
    const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${endpoint}?on_conflict=id`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify(records),
    });

    return response.ok;
  } catch (error) {
    console.error(`Failed to sync ${endpoint} to Supabase:`, error);
    return false;
  }
}

/**
 * Syncs the current shop profile to Supabase
 */
export async function syncShopToSupabase(shop: ShopProfile): Promise<boolean> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) return true;
  return syncBatchToSupabase(
    'shops',
    [
      {
        id: shop.id,
        name: shop.name,
        phone: shop.phone,
        currency: shop.currency,
        updated_at: new Date().toISOString(),
      },
    ],
    ENV.supabaseUrl,
    ENV.supabaseAnonKey
  );
}

/**
 * Restores or registers a shop in Supabase by phone number.
 * If shop exists in cloud, pulls cloud profile; otherwise registers new.
 */
export async function registerOrFetchShopCloud(phone: string, defaultName: string): Promise<ShopProfile> {
  const hasSupabase = Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);

  if (!hasSupabase) {
    const localProfile: ShopProfile = {
      id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: defaultName,
      phone,
      currency: ENV.defaultCurrency,
      created_at: new Date().toISOString(),
    };
    await saveShopProfile(localProfile);
    return localProfile;
  }

  try {
    const url = `${ENV.supabaseUrl.replace(/\/$/, '')}/rest/v1/shops?phone=eq.${encodeURIComponent(phone)}&select=*`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: ENV.supabaseAnonKey,
        Authorization: `Bearer ${ENV.supabaseAnonKey}`,
      },
    });

    if (response.ok) {
      const rows = await response.json();
      if (Array.isArray(rows) && rows.length > 0) {
        const found = rows[0];
        const profile: ShopProfile = {
          id: found.id,
          name: found.name || defaultName,
          phone: found.phone,
          currency: found.currency || ENV.defaultCurrency,
          created_at: found.created_at || new Date().toISOString(),
        };
        await saveShopProfile(profile);
        return profile;
      }
    }

    // Not found in cloud, create new
    const newProfile: ShopProfile = {
      id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: defaultName,
      phone,
      currency: ENV.defaultCurrency,
      created_at: new Date().toISOString(),
    };
    await syncBatchToSupabase('shops', [newProfile], ENV.supabaseUrl, ENV.supabaseAnonKey);
    await saveShopProfile(newProfile);
    return newProfile;
  } catch (e) {
    console.warn('Network issue reaching Supabase, using local profile', e);
    const fallbackProfile: ShopProfile = {
      id: 'shop_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: defaultName,
      phone,
      currency: ENV.defaultCurrency,
      created_at: new Date().toISOString(),
    };
    await saveShopProfile(fallbackProfile);
    return fallbackProfile;
  }
}

/**
 * Executes cloud sync for any dirty records created "alibe bundle".
 * Checks for Supabase credentials in ENV. If present, pushes records
 * to Supabase tables stamped with shop_id.
 */
export async function syncOfflineQueue(): Promise<{
  syncedTransactions: number;
  syncedCustomers: number;
  syncedLoans: number;
}> {
  const dirty = await getUnsyncedRecords();
  const shop = await getShopProfile();
  const shopId = shop ? shop.id : null;

  const txCount = dirty.transactions.length;
  const custCount = dirty.customers.length;
  const loanCount = dirty.loans.length;

  if (txCount === 0 && custCount === 0 && loanCount === 0) {
    return { syncedTransactions: 0, syncedCustomers: 0, syncedLoans: 0 };
  }

  const hasSupabase = Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);

  if (hasSupabase) {
    // 0. Ensure shop is registered on Supabase
    if (shop) {
      await syncShopToSupabase(shop);
    }

    // 1. Sync Customers first (foreign key dependency)
    if (custCount > 0) {
      const ok = await syncBatchToSupabase(
        'customers',
        dirty.customers.map((c) => ({
          id: c.id,
          shop_id: c.shop_id || shopId,
          name: c.name,
          phone: c.phone,
          created_at: c.created_at,
        })),
        ENV.supabaseUrl,
        ENV.supabaseAnonKey
      );
      if (ok) {
        await markAsSynced('customers', dirty.customers.map((c) => c.id));
      }
    }

    // 2. Sync Transactions
    if (txCount > 0) {
      const ok = await syncBatchToSupabase(
        'transactions',
        dirty.transactions.map((t) => ({
          id: t.id,
          shop_id: t.shop_id || shopId,
          type: t.type,
          amount: t.amount,
          category: t.category,
          note: t.note,
          created_at: t.created_at,
        })),
        ENV.supabaseUrl,
        ENV.supabaseAnonKey
      );
      if (ok) {
        await markAsSynced('transactions', dirty.transactions.map((t) => t.id));
      }
    }

    // 3. Sync Loans
    if (loanCount > 0) {
      const ok = await syncBatchToSupabase(
        'loans',
        dirty.loans.map((l) => ({
          id: l.id,
          shop_id: l.shop_id || shopId,
          customer_id: l.customer_id,
          type: l.type,
          amount: l.amount,
          due_date: l.due_date,
          status: l.status,
          note: l.note,
          created_at: l.created_at,
        })),
        ENV.supabaseUrl,
        ENV.supabaseAnonKey
      );
      if (ok) {
        await markAsSynced('loans', dirty.loans.map((l) => l.id));
      }
    }
  } else {
    // Fallback simulation when no cloud credentials provided
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (txCount > 0) await markAsSynced('transactions', dirty.transactions.map((t) => t.id));
    if (custCount > 0) await markAsSynced('customers', dirty.customers.map((c) => c.id));
    if (loanCount > 0) await markAsSynced('loans', dirty.loans.map((l) => l.id));
  }

  return {
    syncedTransactions: txCount,
    syncedCustomers: custCount,
    syncedLoans: loanCount,
  };
}
