export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";


// src/types/accounting.ts
export type TrxType =
  | "buy_asset"
  | "pay_liability"
  | "investment"
  | "withdrawal"
  | "income"
  | "expense";

export type Business = {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
};

export type Account = {
  id: string;
  business_id: string;
  code: string | null;
  name: string;
  type: AccountType;
  is_system: boolean;
  is_active: boolean;
};

export type TransactionRow = {
  id: string;
  business_id: string;
  created_by: string;
  trx_date: string;
  trx_type: TrxType;
  description: string;
  reference: string;
  notes: string | null;
  created_at: string;
};

export type JournalRow = {
  business_id: string;
  date: string;
  description: string;
  reference: string;
  debit: number;
  credit: number;
  notes: string | null;
  account_name: string;
  account_type: AccountType;
  created_at: string;
};

export type NotificationStatus = "PENDING" | "COMPLETED";

export type NotificationRow = {
  id: string;
  business_id: string;
  transaction_id: string | null;
  status: NotificationStatus;
  title: string;
  message: string;
  action_type: string | null;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
};