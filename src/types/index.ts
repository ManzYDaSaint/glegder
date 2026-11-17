export type TransactionType = 'IN' | 'OUT';

export interface ShopProfile {
  id: string;
  name: string;
  phone: string;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  shop_id?: string;
  type: TransactionType;
  amount: number;
  category: string;
  note?: string;
  created_at: string; // ISO String
  synced: number;     // 0 = pending sync, 1 = synced
}

export interface Customer {
  id: string;
  shop_id?: string;
  name: string;
  phone: string;
  created_at: string;
  synced: number;
}

export type LoanType = 'GIVEN' | 'REPAID';
export type LoanStatus = 'PENDING' | 'PAID' | 'OVERDUE';

export interface Loan {
  id: string;
  shop_id?: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  type: LoanType;
  amount: number;
  due_date: string;   // YYYY-MM-DD
  status: LoanStatus;
  note?: string;
  created_at: string;
  synced: number;
}

export interface CashSummary {
  totalIn: number;
  totalOut: number;
  balance: number;
  todayIn: number;
  todayOut: number;
  todayBalance: number;
}

export interface DebtSummary {
  totalOwed: number;
  customerCount: number;
  dueTodayCount: number;
  overdueCount: number;
  dueTodayLoans: Loan[];
  overdueLoans: Loan[];
}
