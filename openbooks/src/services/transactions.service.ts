import { supabase } from "../lib/supabase";

export async function generateReference(businessId: string, date: string) {
  return supabase.rpc("generate_trx_reference", {
    p_business_id: businessId,
    p_date: date,
  });
}

export async function createTransaction(params: {
  businessId: string;
  txnDate: string;
  txnType:
    | "buy_asset"
    | "expense"
    | "income"
    | "investment"
    | "withdrawal"
    | "pay_liability";
  description: string;
  reference: string;
  amount: number;
  notes: string | null;
  payment?: "cash" | "credit" | null;
  incomeState?: "received" | "pending" | null;
}) {
  return supabase.rpc("create_transaction", {
    p_business_id: params.businessId,
    p_txn_date: params.txnDate,
    p_txn_type: params.txnType,
    p_description: params.description,
    p_reference: params.reference,
    p_amount: params.amount,
    p_notes: params.notes,
    p_payment: params.payment ?? null,
    p_income_state: params.incomeState ?? null,
  });
}

export async function listTransactions(businessId: string) {
  return supabase
    .from("transactions")
    .select(
      "id, txn_date, txn_type, payment, income_state, description, reference, amount, notes, created_at"
    )
    .eq("business_id", businessId)
    .order("txn_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(300);
}

export async function deleteTransaction(id: string) {
  return supabase.from("transactions").delete().eq("id", id);
}