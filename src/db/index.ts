import * as SQLite from 'expo-sqlite';
import { Transaction, Customer, Loan, CashSummary, DebtSummary } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync('glegder.db');

  // Initialize SQLite tables with indices for fast offline querying
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS loans (
      id TEXT PRIMARY KEY NOT NULL,
      customer_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      status TEXT NOT NULL,
      note TEXT,
      created_at TEXT NOT NULL,
      synced INTEGER DEFAULT 0,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions (created_at);
    CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans (customer_id);
    CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans (due_date);
  `);

  dbInstance = db;
  return db;
}

// ==========================================
// TRANSACTIONS (CASH IN / CASH OUT)
// ==========================================

export async function insertTransaction(tx: Omit<Transaction, 'id' | 'created_at' | 'synced'>): Promise<Transaction> {
  const db = await getDatabase();
  const id = 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const created_at = new Date().toISOString();
  const synced = 0;

  await db.runAsync(
    `INSERT INTO transactions (id, type, amount, category, note, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, tx.type, tx.amount, tx.category, tx.note || null, created_at, synced]
  );

  return {
    id,
    type: tx.type,
    amount: tx.amount,
    category: tx.category,
    note: tx.note,
    created_at,
    synced,
  };
}

export async function getRecentTransactions(limit = 20): Promise<Transaction[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<Transaction>(
    `SELECT * FROM transactions ORDER BY datetime(created_at) DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

export async function getCashSummary(): Promise<CashSummary> {
  const db = await getDatabase();
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Total In & Total Out
  const totals = await db.getAllAsync<{ type: string; total: number }>(
    `SELECT type, SUM(amount) as total FROM transactions GROUP BY type`
  );

  let totalIn = 0;
  let totalOut = 0;
  totals.forEach((row) => {
    if (row.type === 'IN') totalIn = row.total || 0;
    if (row.type === 'OUT') totalOut = row.total || 0;
  });

  // Today In & Today Out
  const todayTotals = await db.getAllAsync<{ type: string; total: number }>(
    `SELECT type, SUM(amount) as total FROM transactions 
     WHERE created_at LIKE ? GROUP BY type`,
    [`${todayStr}%`]
  );

  let todayIn = 0;
  let todayOut = 0;
  todayTotals.forEach((row) => {
    if (row.type === 'IN') todayIn = row.total || 0;
    if (row.type === 'OUT') todayOut = row.total || 0;
  });

  return {
    totalIn,
    totalOut,
    balance: totalIn - totalOut,
    todayIn,
    todayOut,
    todayBalance: todayIn - todayOut,
  };
}

// ==========================================
// CUSTOMERS & LOANS (LEDGER HUD)
// ==========================================

export async function getOrCreateCustomer(name: string, phone: string): Promise<Customer> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<Customer>(
    `SELECT * FROM customers WHERE phone = ? LIMIT 1`,
    [phone.trim()]
  );

  if (existing) {
    return existing;
  }

  const id = 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const created_at = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO customers (id, name, phone, created_at, synced) VALUES (?, ?, ?, ?, 0)`,
    [id, name.trim(), phone.trim(), created_at]
  );

  return { id, name: name.trim(), phone: phone.trim(), created_at, synced: 0 };
}

export async function getAllCustomers(): Promise<Customer[]> {
  const db = await getDatabase();
  return db.getAllAsync<Customer>(`SELECT * FROM customers ORDER BY name ASC`);
}

export async function insertLoan(loan: {
  customerName: string;
  customerPhone: string;
  type: 'GIVEN' | 'REPAID';
  amount: number;
  due_date: string; // YYYY-MM-DD
  note?: string;
}): Promise<Loan> {
  const db = await getDatabase();
  const customer = await getOrCreateCustomer(loan.customerName, loan.customerPhone);

  const id = 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const created_at = new Date().toISOString();
  const status = loan.type === 'REPAID' ? 'PAID' : 'PENDING';
  const synced = 0;

  await db.runAsync(
    `INSERT INTO loans (id, customer_id, type, amount, due_date, status, note, created_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, customer.id, loan.type, loan.amount, loan.due_date, status, loan.note || null, created_at, synced]
  );

  return {
    id,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_phone: customer.phone,
    type: loan.type,
    amount: loan.amount,
    due_date: loan.due_date,
    status,
    note: loan.note,
    created_at,
    synced,
  };
}

export async function recordLoanRepayment(customerId: string, amount: number, note?: string): Promise<void> {
  const db = await getDatabase();
  const id = 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const created_at = new Date().toISOString();
  const todayStr = created_at.slice(0, 10);

  // Insert repayment loan record
  await db.runAsync(
    `INSERT INTO loans (id, customer_id, type, amount, due_date, status, note, created_at, synced)
     VALUES (?, ?, 'REPAID', ?, ?, 'PAID', ?, ?, 0)`,
    [id, customerId, amount, todayStr, note || 'Repayment', created_at]
  );

  // Also log automatic Cash In transaction
  await insertTransaction({
    type: 'IN',
    amount,
    category: 'Loan Repayment',
    note: note ? `Debt collected: ${note}` : 'Customer debt collection',
  });
}

export interface CustomerDebtRecord {
  customerId: string;
  customerName: string;
  customerPhone: string;
  totalGiven: number;
  totalRepaid: number;
  balanceOwed: number;
  nextDueDate: string;
  isOverdue: boolean;
  isDueToday: boolean;
}

export async function getActiveCustomerDebts(): Promise<CustomerDebtRecord[]> {
  const db = await getDatabase();
  const todayStr = new Date().toISOString().slice(0, 10);

  const rows = await db.getAllAsync<{
    customer_id: string;
    customer_name: string;
    customer_phone: string;
    total_given: number;
    total_repaid: number;
    next_due_date: string;
  }>(`
    SELECT 
      c.id as customer_id,
      c.name as customer_name,
      c.phone as customer_phone,
      COALESCE(SUM(CASE WHEN l.type = 'GIVEN' THEN l.amount ELSE 0 END), 0) as total_given,
      COALESCE(SUM(CASE WHEN l.type = 'REPAID' THEN l.amount ELSE 0 END), 0) as total_repaid,
      MIN(CASE WHEN l.type = 'GIVEN' AND l.status != 'PAID' THEN l.due_date ELSE '9999-12-31' END) as next_due_date
    FROM customers c
    LEFT JOIN loans l ON c.id = l.customer_id
    GROUP BY c.id, c.name, c.phone
    HAVING (total_given - total_repaid) > 0
    ORDER BY next_due_date ASC
  `);

  return rows.map((r) => {
    const balanceOwed = r.total_given - r.total_repaid;
    const isOverdue = r.next_due_date < todayStr && r.next_due_date !== '9999-12-31';
    const isDueToday = r.next_due_date === todayStr;

    return {
      customerId: r.customer_id,
      customerName: r.customer_name,
      customerPhone: r.customer_phone,
      totalGiven: r.total_given,
      totalRepaid: r.total_repaid,
      balanceOwed,
      nextDueDate: r.next_due_date === '9999-12-31' ? todayStr : r.next_due_date,
      isOverdue,
      isDueToday,
    };
  });
}

export async function getDebtSummary(): Promise<DebtSummary> {
  const debts = await getActiveCustomerDebts();
  const todayStr = new Date().toISOString().slice(0, 10);

  let totalOwed = 0;
  let dueTodayCount = 0;
  let overdueCount = 0;

  debts.forEach((d) => {
    totalOwed += d.balanceOwed;
    if (d.isDueToday) dueTodayCount++;
    if (d.isOverdue) overdueCount++;
  });

  // Fetch individual loan entries due today or overdue
  const db = await getDatabase();
  const dueLoans = await db.getAllAsync<Loan>(`
    SELECT l.*, c.name as customer_name, c.phone as customer_phone
    FROM loans l
    JOIN customers c ON l.customer_id = c.id
    WHERE l.type = 'GIVEN' AND l.status = 'PENDING'
    ORDER BY l.due_date ASC
  `);

  const dueTodayLoans = dueLoans.filter((l) => l.due_date === todayStr);
  const overdueLoans = dueLoans.filter((l) => l.due_date < todayStr);

  return {
    totalOwed,
    customerCount: debts.length,
    dueTodayCount,
    overdueCount,
    dueTodayLoans,
    overdueLoans,
  };
}

// ==========================================
// SYNC ENGINE HELPERS (DIRTY RECORDS)
// ==========================================

export async function getUnsyncedRecords() {
  const db = await getDatabase();
  const transactions = await db.getAllAsync<Transaction>(`SELECT * FROM transactions WHERE synced = 0`);
  const customers = await db.getAllAsync<Customer>(`SELECT * FROM customers WHERE synced = 0`);
  const loans = await db.getAllAsync<Loan>(`SELECT * FROM loans WHERE synced = 0`);
  return { transactions, customers, loans };
}

export async function markAsSynced(table: 'transactions' | 'customers' | 'loans', ids: string[]) {
  if (ids.length === 0) return;
  const db = await getDatabase();
  const placeholders = ids.map(() => '?').join(',');
  await db.runAsync(`UPDATE ${table} SET synced = 1 WHERE id IN (${placeholders})`, ids);
}
