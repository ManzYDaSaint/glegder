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
  insertLoan as dbInsertLoan,
  recordLoanRepayment as dbRecordRepayment,
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
  addLoan: (data: {
    customerName: string;
    customerPhone: string;
    amount: number;
    due_date: string;
    note?: string;
  }) => Promise<Loan>;
  collectDebt: (customerId: string, amount: number, note?: string) => Promise<void>;
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
  addLoan: async () => ({} as Loan),
  collectDebt: async () => {},
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

  const triggerSync = useCallback(async () => {
    if (isSyncing) return;
    try {
      setIsSyncing(true);
      await syncOfflineQueue();
      await checkPendingCount();
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, checkPendingCount]);

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

  // Network listener: detect connectivity & trigger auto-sync when online
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);

      // If network is restored, automatically flush unsynced offline records to cloud
      if (online) {
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
        addLoan,
        collectDebt,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}
