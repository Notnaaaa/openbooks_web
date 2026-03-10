export type RpcCreateBusiness = { p_name: string };
export type RpcRequestJoin = { p_business_name: string; p_owner_email: string };
export type RpcDecideStaff = { p_membership_id: string; p_approve: boolean };
export type RpcRemoveStaff = { p_membership_id: string };

export type RpcCreateTxn = {
  p_business_id: string;
  p_txn_date: string;
  p_txn_type: string;
  p_account_name: string | null;
  p_amount: number;
  p_notes: string | null;
  p_payment: "cash" | "credit" | null;
  p_income_state: "pending" | "paid" | null;
};