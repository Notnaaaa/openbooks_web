export const APP_NAME = "OpenBooks";

export const TXN_TYPES = [
  { key: "buy_asset", label: "Buy an Asset" },
  { key: "pay_liability", label: "Pay Credit / Liability" },
  { key: "investment", label: "Investment" },
  { key: "withdrawal", label: "Withdrawal" },
  { key: "income", label: "Revenue / Income" },
  { key: "expense", label: "Expenses" },
] as const;

export type TxnTypeKey = typeof TXN_TYPES[number]["key"];