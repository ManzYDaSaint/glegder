import { getUnsyncedRecords, markAsSynced } from '../db';
import { ENV } from '../constants/env';

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
 * Executes cloud sync for any dirty records created "alibe bundle".
 * Checks for Supabase credentials in ENV. If present, pushes records
 * to Supabase tables; otherwise gracefully falls back to local simulation.
 */
export async function syncOfflineQueue(): Promise<{
  syncedTransactions: number;
  syncedCustomers: number;
  syncedLoans: number;
}> {
  const dirty = await getUnsyncedRecords();
  const txCount = dirty.transactions.length;
  const custCount = dirty.customers.length;
  const loanCount = dirty.loans.length;

  if (txCount === 0 && custCount === 0 && loanCount === 0) {
    return { syncedTransactions: 0, syncedCustomers: 0, syncedLoans: 0 };
  }

  const hasSupabase = Boolean(ENV.supabaseUrl && ENV.supabaseAnonKey);

  if (hasSupabase) {
    // 1. Sync Customers first (foreign key dependency)
    if (custCount > 0) {
      const ok = await syncBatchToSupabase(
        'customers',
        dirty.customers.map((c) => ({
          id: c.id,
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
