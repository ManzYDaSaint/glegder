import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  getDatabase,
  getCashSummary,
  getDebtSummary,
  getRecentTransactions,
  getActiveCustomerDebts,
  getUnsyncedRecords,
  insertTransaction as dbInsertTransaction,
  updateTransaction,
  deleteTransaction,
  insertLoan as dbInsertLoan,
  recordLoanRepayment as dbRecordRepayment,
  deleteCustomerAndLoans,
  CustomerDebtRecord,
} from '../db';
import { CashSummary, DebtSummary, Transaction, Loan } from '../types';
import { syncOfflineQueue } from '../services/syncService';

interface DatabaseContextType {
  isInitialized: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  pendingSyncCount: number;
  cashSummary: CashSummary;
  debtSummary: DebtSummary;
  recentTransactions: Transaction[];
  activeDebts: CustomerDebtRecord[];
  refreshData: () => Promise<void>;
  triggerSync: () => Promise<void>;
  addTransaction: (data: {
    type: 'IN' | 'OUT';
    amount: number;
    category: string;
    note?: string;
  }) => Promise<Transaction>;
  editTransaction: (
    id: string,
    updates: { amount?: number; category?: string; note?: string }
  ) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
  addLoan: (data: {
    customerName: string;
    customerPhone: string;
    amount: number;
    due_date: string;
    note?: string;
  }) => Promise<Loan>;
  collectDebt: (customerId: string, amount: number, note?: string) => Promise<void>;
  removeCustomerDebt: (customerId: string) => Promise<void>;
}

const defaultCash: CashSummary = {
  totalIn: 0,
  totalOut: 0,
  balance: 0,
  todayIn: 0,
  todayOut: 0,
  todayBalance: 0,
};

const defaultDebt: DebtSummary = {
  totalOwed: 0,
  customerCount: 0,
  dueTodayCount: 0,
  overdueCount: 0,
  dueTodayLoans: [],
  overdueLoans: [],
};

const DatabaseContext = createContext<DatabaseContextType>({
  isInitialized: false,
  isOnline: false,
  isSyncing: false,
  pendingSyncCount: 0,
  cashSummary: defaultCash,
  debtSummary: defaultDebt,
  recentTransactions: [],
  activeDebts: [],
  refreshData: async () => {},
  triggerSync: async () => {},
  addTransaction: async () => ({} as Transaction),
  editTransaction: async () => {},
  removeTransaction: async () => {},
  addLoan: async () => ({} as Loan),
  collectDebt: async () => {},
  removeCustomerDebt: async () => {},
});

export const useAppDatabase = () => useContext(DatabaseContext);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const [cashSummary, setCashSummary] = useState<CashSummary>(defaultCash);
  const [debtSummary, setDebtSummary] = useState<DebtSummary>(defaultDebt);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [activeDebts, setActiveDebts] = useState<CustomerDebtRecord[]>([]);

  const checkPendingCount = useCallback(async () => {
    try {
      const records = await getUnsyncedRecords();
      const count = records.transactions.length + records.customers.length + records.loans.length;
      setPendingSyncCount(count);
      return count;
    } catch {
      return 0;
    }
  }, []);

  const isSyncingRef = React.useRef(false);

  const triggerSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      const records = await getUnsyncedRecords();
      const hasPending =
        records.transactions.length > 0 ||
        records.customers.length > 0 ||
        records.loans.length > 0;

      // Only toggle sync UI if there are actual pending records to push
      if (!hasPending) {
        setPendingSyncCount(0);
        return;
      }

      isSyncingRef.current = true;
      setIsSyncing(true);
      await syncOfflineQueue();
      await checkPendingCount();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [checkPendingCount]);

  const refreshData = useCallback(async () => {
    try {
      const [cash, debt, txs, debts] = await Promise.all([
        getCashSummary(),
        getDebtSummary(),
        getRecentTransactions(20),
        getActiveCustomerDebts(),
      ]);

      setCashSummary(cash);
      setDebtSummary(debt);
      setRecentTransactions(txs);
      setActiveDebts(debts);
      await checkPendingCount();
    } catch (err) {
      console.error('Error refreshing database data:', err);
    }
  }, [checkPendingCount]);

  // Initial database bootstrap
  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        await refreshData();
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize SQLite database:', err);
      }
    }
    init();
  }, [refreshData]);

  // Network listener: only trigger sync on transition from offline to online
  const prevOnlineRef = React.useRef<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      const wasOffline = prevOnlineRef.current === false;
      prevOnlineRef.current = online;

      setIsOnline(online);

      // Only trigger sync if returning online from an offline state
      if (online && wasOffline) {
        triggerSync();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [triggerSync]);

  const addTransaction = async (data: {
    type: 'IN' | 'OUT';
    amount: number;
    category: string;
    note?: string;
  }) => {
    const res = await dbInsertTransaction(data);
    await refreshData();
    if (isOnline) {
      triggerSync();
    }
    return res;
  };

  const editTransaction = async (
    id: string,
    updates: { amount?: number; category?: string; note?: string }
  ) => {
    await updateTransaction(id, updates);
    await refreshData();
    if (isOnline) {
      triggerSync();
    }
  };

  const removeTransaction = async (id: string) => {
    await deleteTransaction(id);
    await refreshData();
    if (isOnline) {
      triggerSync();
    }
  };

  const addLoan = async (data: {
    customerName: string;
    customerPhone: string;
    amount: number;
    due_date: string;
    note?: string;
  }) => {
    const res = await dbInsertLoan({
      ...data,
      type: 'GIVEN',
    });
    await refreshData();
    if (isOnline) {
      triggerSync();
    }
    return res;
  };

  const collectDebt = async (customerId: string, amount: number, note?: string) => {
    await dbRecordRepayment(customerId, amount, note);
    await refreshData();
    if (isOnline) {
      triggerSync();
    }
  };

  const removeCustomerDebt = async (customerId: string) => {
    await deleteCustomerAndLoans(customerId);
    await refreshData();
    if (isOnline) {
      triggerSync();
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        isInitialized,
        isOnline,
        isSyncing,
        pendingSyncCount,
        cashSummary,
        debtSummary,
        recentTransactions,
        activeDebts,
        refreshData,
        triggerSync,
        addTransaction,
        editTransaction,
        removeTransaction,
        addLoan,
        collectDebt,
        removeCustomerDebt,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
