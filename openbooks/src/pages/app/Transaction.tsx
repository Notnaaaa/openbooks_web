// src/pages/app/Transaction.tsx
import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "../../context/BusinessProvider";
import {
  createTransaction,
  generateReference,
  listTransactions,
  deleteTransaction,
} from "../../services/transactions.service";
import { money } from "../../lib/format";
import "../../styles/globals.css";

type TxnType =
  | "buy_asset"
  | "expense"
  | "income"
  | "investment"
  | "withdrawal"
  | "pay_liability";

type Payment = "cash" | "credit";
type IncomeState = "received" | "pending";

const TXN_TYPES: { label: string; value: TxnType }[] = [
  { label: "Buy Asset", value: "buy_asset" },
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
  { label: "Investment", value: "investment" },
  { label: "Withdrawal", value: "withdrawal" },
  { label: "Pay Liability", value: "pay_liability" },
];

function typeLabel(txn_type: string, payment?: string | null, incomeState?: string | null) {
  if (txn_type === "buy_asset") return payment ? `Buy Asset (${payment})` : "Buy Asset";
  if (txn_type === "expense") return payment ? `Expense (${payment})` : "Expense";
  if (txn_type === "income") return incomeState ? `Income (${incomeState})` : "Income";
  if (txn_type === "investment") return "Investment";
  if (txn_type === "withdrawal") return "Withdrawal";
  if (txn_type === "pay_liability") return "Pay Liability";
  return txn_type;
}

function fmt(n: any) {
  const v = Number(n);
  return Number.isFinite(v) ? v.toFixed(2) : "0.00";
}

export default function Transactions() {
  const { business } = useBusiness();
  const currency = "PHP";

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [txnType, setTxnType] = useState<TxnType>("buy_asset");

  // NEW
  const [payment, setPayment] = useState<Payment | "">(""); // "" means null
  const [incomeState, setIncomeState] = useState<IncomeState | "">(""); // "" means null

  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function removeRow(id: string) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await deleteTransaction(id);
    setDeleting(null);
    if (error) { setMsg(error.message); return; }
    setRows(prev => prev.filter((r: any) => r.id !== id));
  }

  const needsPayment = txnType === "buy_asset" || txnType === "expense";
  const needsIncomeState = txnType === "income";

  async function loadHistory() {
    if (!business?.id) return;
    setLoading(true);
    setMsg(null);

    const r = await listTransactions(business.id);

    if (r.error) {
      setMsg(r.error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((r.data ?? []) as any[]);
    setLoading(false);
  }

  async function autoRef() {
    if (!business?.id) return;
    setMsg(null);

    const { data, error } = await generateReference(business.id, txnDate);

    if (error) {
      setMsg(error.message);
      setReference("");
      return;
    }

    setReference(String(data ?? ""));
  }

  useEffect(() => {
    if (!business?.id) return;
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  useEffect(() => {
    if (!business?.id) return;
    autoRef();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id, txnDate]);

  // Optional: clear fields that don’t apply when txnType changes
  useEffect(() => {
    if (!needsPayment) setPayment("");
    if (!needsIncomeState) setIncomeState("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txnType]);

  const disabled = useMemo(() => {
    if (!business?.id) return true;
    if (!txnDate) return true;
    if (!txnType) return true;
    if (!description.trim()) return true;
    if (!reference.trim()) return true;
    if (!amount || Number(amount) <= 0) return true;
    if (needsPayment && !payment) return true;
    if (busy) return true;
    return false;
  }, [business?.id, txnDate, txnType, description, reference, amount, needsPayment, payment, busy]);

  async function submit() {
    if (disabled) return;

    setBusy(true);
    setMsg(null);

    const res = await createTransaction({
      businessId: business!.id,
      txnDate,
      txnType,
      payment: payment ? (payment as Payment) : null,
      incomeState: incomeState ? (incomeState as IncomeState) : null,
      description: description.trim(),
      reference: reference.trim(),
      amount: Number(amount),
      notes: notes.trim() ? notes.trim() : null,
    });

    setBusy(false);

    if (res.error) {
      setMsg(res.error.message);
      return;
    }

    setDescription("");
    setAmount("");
    setNotes("");

    await autoRef();
    await loadHistory();
    setMsg("Transaction recorded ✓");
  }

  return (
    <div className="page">
      <h1 className="h1">Transactions</h1>
      <p className="muted">{business?.name ?? "-"}</p>

      {msg ? (
        <div className="infoBox" role="status" aria-live="polite">
          {msg}
        </div>
      ) : null}

      <div className="cardWide" style={{ marginTop: 12 }}>
        <div className="cardTitle">Record a Transaction</div>

        <div className="formGrid">
          <div>
            <label className="labelBlock" htmlFor="txnDate">Date</label>
            <input
              id="txnDate"
              className="input"
              type="date"
              value={txnDate}
              onChange={(e) => setTxnDate(e.target.value)}
            />
          </div>

          <div>
            <label className="labelBlock" htmlFor="txnType">Type</label>
            <select
              id="txnType"
              className="input"
              value={txnType}
              onChange={(e) => setTxnType(e.target.value as TxnType)}
            >
              {TXN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Payment — only for buy_asset / expense */}
          {needsPayment && (
          <div>
            <label className="labelBlock" htmlFor="payment">Payment Method</label>
            <select
              id="payment"
              className="input"
              value={payment}
              onChange={(e) => setPayment(e.target.value as any)}
            >
              <option value="">— Select —</option>
              <option value="cash">Cash</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          )}

          {/* Income State — only for income */}
          {needsIncomeState && (
          <div>
            <label className="labelBlock" htmlFor="incomeState">Income State</label>
            <select
              id="incomeState"
              className="input"
              value={incomeState}
              onChange={(e) => setIncomeState(e.target.value as any)}
            >
              <option value="">— Select —</option>
              <option value="received">Received</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          )}

          <div className="span2">
            <label className="labelBlock" htmlFor="desc">Description</label>
            <input
              id="desc"
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened?"
            />
          </div>

          <div>
            <label className="labelBlock" htmlFor="ref">Reference</label>
            <input
              id="ref"
              className="input"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Auto-generated"
            />
          </div>

          <div>
            <label className="labelBlock" htmlFor="amt">Amount ({currency})</label>
            <input
              id="amt"
              className="input"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="span2">
            <label className="labelBlock" htmlFor="notes">Notes</label>
            <input
              id="notes"
              className="input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>

        <button className="btn" onClick={submit} disabled={disabled}>
          {busy ? "Saving…" : "Save Transaction"}
        </button>
      </div>

      <div className="cardWide" style={{ marginTop: 16 }}>
        <div className="cardTitle">Transaction History</div>

        {loading ? <p className="muted">Loading…</p> : null}

        <div className="tableWrap" role="region" aria-label="Transactions table">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="num">Amount</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.txn_date}</td>
                  <td>{typeLabel(r.txn_type, r.payment, r.income_state)}</td>
                  <td>{r.description}</td>
                  <td>{r.reference}</td>
                  <td className="num">{money(Number(r.amount || 0), currency)}</td>
                  <td>{r.notes ?? ""}</td>
                  <td>
                    <button
                      className="btnGhostTiny"
                      style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                      onClick={() => removeRow(r.id)}
                      disabled={deleting === r.id}
                      title="Delete transaction"
                    >
                      {deleting === r.id ? "…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}

              {!rows.length ? (
                <tr>
                  <td colSpan={7} className="muted">No transactions yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}