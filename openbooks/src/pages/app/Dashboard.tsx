// src/pages/app/Dashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "../../context/BusinessProvider";
import { listTransactions } from "../../services/transactions.service";
import { money } from "../../lib/format";
import "../../styles/globals.css";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { deleteTransaction } from "../../services/transactions.service";

type TxnRow = {
  id: string;
  business_id: string;
  txn_date: string; // YYYY-MM-DD
  txn_type: string; // buy_asset, expense, income, investment, withdrawal, pay_liability
  payment: string | null; // cash | credit | null
  description: string;
  reference: string;
  amount: number;
  notes: string | null;
  created_at: string;
};

function typeLabel(txn_type: string, payment?: string | null) {
  if (txn_type === "buy_asset") return payment === "credit" ? "Buy Asset (Credit)" : "Buy Asset (Cash)";
  if (txn_type === "expense") return payment === "credit" ? "Expense (Credit)" : "Expense (Cash)";
  if (txn_type === "income") return "Income";
  if (txn_type === "investment") return "Investment";
  if (txn_type === "withdrawal") return "Withdrawal";
  if (txn_type === "pay_liability") return "Pay Liability";
  return txn_type;
}

function isCash(payment: string | null) {
  // for income we treat payment null as cash received unless your db uses income_state
  if (!payment) return true;
  return payment === "cash";
}

// ===== CHART HELPERS =====
const PIE_COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#a855f7", "#14b8a6", "#f97316"];

function filterByPeriod(rows: TxnRow[], period: "daily" | "weekly" | "monthly"): TxnRow[] {
  const now = new Date();
  return rows.filter(r => {
    const d = new Date(r.txn_date);
    if (period === "daily") {
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff < 1;
    }
    if (period === "weekly") {
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff < 7;
    }
    // monthly — current calendar month
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
}

function bucketKey(date: string, period: "daily" | "weekly" | "monthly"): string {
  if (period === "monthly") return date.slice(0, 7); // YYYY-MM
  if (period === "weekly") {
    const d = new Date(date);
    // ISO week start (Monday)
    const day = d.getDay() || 7;
    d.setDate(d.getDate() - day + 1);
    return d.toISOString().slice(0, 10);
  }
  return date; // daily → full date
}

function fmtAmount(v: number) {
  if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(Math.round(v));
}

export default function Dashboard() {
  const { business } = useBusiness();
  const currency = "PHP";

  const [rows, setRows] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function removeRow(id: string) {
    if (!window.confirm("Delete this transaction? This cannot be undone.")) return;
    setDeleting(id);
    const { error } = await deleteTransaction(id);
    setDeleting(null);
    if (error) { setMsg(error.message); return; }
    setRows(prev => prev.filter(r => r.id !== id));
  }

  async function load() {
    if (!business?.id) return;
    setLoading(true);
    setMsg(null);

    const res = await listTransactions(business.id);

    if (res.error) {
      setMsg(res.error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((res.data ?? []) as unknown as TxnRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!business?.id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  // ===== SUMMARY (derived from transactions) =====
  const summary = useMemo(() => {
    const sum = (filter: (x: TxnRow) => boolean) =>
      rows.filter(filter).reduce((s, x) => s + Number(x.amount || 0), 0);

    // Revenue
    const totalIncome    = sum(x => x.txn_type === "income");
    const totalInvestment = sum(x => x.txn_type === "investment");

    // Spending
    const totalExpense   = sum(x => x.txn_type === "expense");
    const totalBuyAsset  = sum(x => x.txn_type === "buy_asset");
    const totalWithdrawal = sum(x => x.txn_type === "withdrawal");
    const totalPaidLiability = sum(x => x.txn_type === "pay_liability");

    // Total Expenses = operating expenses + asset purchases
    const totalExpenses = totalExpense + totalBuyAsset;

    // Payable = unpaid credit purchases
    const creditPurchases = sum(
      x => (x.txn_type === "buy_asset" || x.txn_type === "expense") && x.payment === "credit"
    );
    const payable = Math.max(0, creditPurchases - totalPaidLiability);

    // Cash balance
    const cashInflows  = totalIncome + totalInvestment;
    const cashOutflows =
      sum(x => x.txn_type === "expense"   && isCash(x.payment)) +
      sum(x => x.txn_type === "buy_asset" && isCash(x.payment)) +
      totalWithdrawal +
      totalPaidLiability;
    const cashBalance = cashInflows - cashOutflows;

    return {
      totalIncome,
      totalInvestment,
      totalExpenses,
      totalWithdrawal,
      totalPaidLiability,
      netIncome: totalIncome - totalExpenses,
      payable,
      cashBalance,
    };
  }, [rows]);

  // ===== Latest Journal-like table rows =====
  const latestJournalLike = useMemo(() => {
    const slice = rows.slice(0, 10);
    return slice.map((r) => {
      const t = r.txn_type;
      const debit =
        t === "expense" || t === "buy_asset" || t === "pay_liability" || t === "withdrawal"
          ? Number(r.amount || 0)
          : 0;

      const credit = t === "income" || t === "investment" ? Number(r.amount || 0) : 0;

      return {
        id: r.id,
        date: r.txn_date,
        description: r.description,
        reference: r.reference,
        debit,
        credit,
        notes: r.notes ?? "",
      };
    });
  }, [rows]);

  // ===== PERIOD FILTER =====
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  // ===== CHART DATA =====

  // Income vs Expense bar (single pair, period-filtered totals)
  const incomeVsExpenseBar = useMemo(() => {
    const filtered = filterByPeriod(rows, period);
    const income = filtered.filter(r => r.txn_type === "income").reduce((s, r) => s + Number(r.amount || 0), 0);
    const expense = filtered.filter(r => r.txn_type === "expense").reduce((s, r) => s + Number(r.amount || 0), 0);
    return [{ name: "Income", value: income }, { name: "Expense", value: expense }];
  }, [rows, period]);

  // Trend line data grouped by bucket
  const trendData = useMemo(() => {
    const filtered = filterByPeriod(rows, period);
    const buckets: Record<string, { income: number; expense: number }> = {};
    for (const r of filtered) {
      const key = bucketKey(r.txn_date, period);
      if (!buckets[key]) buckets[key] = { income: 0, expense: 0 };
      if (r.txn_type === "income") buckets[key].income += Number(r.amount || 0);
      if (r.txn_type === "expense") buckets[key].expense += Number(r.amount || 0);
    }
    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, Income: v.income, Expense: v.expense }));
  }, [rows, period]);

  // Expense Distribution pie by txn_type
  const expenseDist = useMemo(() => {
    const filtered = filterByPeriod(rows, period);
    const map: Record<string, number> = {};
    for (const r of filtered) {
      const lbl = typeLabel(r.txn_type, r.payment);
      map[lbl] = (map[lbl] || 0) + Number(r.amount || 0);
    }
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [rows, period]);

  // All-time transaction breakdown pie (no period filter)
  const allTimePie = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of rows) {
      const lbl = typeLabel(r.txn_type, r.payment);
      map[lbl] = (map[lbl] || 0) + Number(r.amount || 0);
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [rows]);

  return (
    <div className="page">
      <h1 className="h1">Dashboard</h1>
      <p className="muted">{business?.name ?? "-"}</p>

      {msg ? (
        <div className="infoBox" role="status" aria-live="polite">
          {msg}
        </div>
      ) : null}

      {loading ? <p className="muted">Loading…</p> : null}

      <div className="grid3" style={{ marginTop: 12 }}>
        <div className="card">
          <div className="cardTitle">Total Income</div>
          <div className="big" style={{ color: summary.totalIncome >= 0 ? "var(--ok)" : "var(--danger)" }}>
            {money(summary.totalIncome, currency)}
          </div>
          <div className="muted small">All Income transactions</div>
        </div>

        <div className="card">
          <div className="cardTitle">Total Expenses</div>
          <div className="big" style={{ color: "var(--danger)" }}>
            {money(summary.totalExpenses, currency)}
          </div>
          <div className="muted small">Expenses + Asset Purchases</div>
        </div>

        <div className="card">
          <div className="cardTitle">Net Income</div>
          <div className="big" style={{ color: summary.netIncome >= 0 ? "var(--ok)" : "var(--danger)" }}>
            {money(summary.netIncome, currency)}
          </div>
          <div className="muted small">Total Income − Total Expenses</div>
        </div>

        <div className="card">
          <div className="cardTitle">Cash Balance</div>
          <div className="big" style={{ color: summary.cashBalance >= 0 ? "var(--ok)" : "var(--danger)" }}>
            {money(summary.cashBalance, currency)}
          </div>
          <div className="muted small">Cash Inflows − Cash Outflows</div>
        </div>

        <div className="card">
          <div className="cardTitle">Payable Account</div>
          <div className="big" style={{ color: summary.payable > 0 ? "var(--danger)" : "inherit" }}>
            {money(summary.payable, currency)}
          </div>
          <div className="muted small">Unpaid credit purchases</div>
        </div>

        <div className="card">
          <div className="cardTitle">Total Investment</div>
          <div className="big" style={{ color: "var(--info)" }}>
            {money(summary.totalInvestment, currency)}
          </div>
          <div className="muted small">Owner investments + capital</div>
        </div>
      </div>

      {/* ===== All-time Transaction Breakdown Pie ===== */}
      <div className="cardWide" style={{ marginTop: 16 }}>
        <div className="cardTitle">Transaction Breakdown</div>
        <p className="muted small" style={{ marginBottom: 16 }}>All-time distribution by transaction type</p>

        {allTimePie.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 24 }}>
            <div style={{ flex: "1 1 280px", minWidth: 260 }}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={allTimePie}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="40%"
                    outerRadius="70%"
                    paddingAngle={3}
                    label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {allTimePie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v, currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend table */}
            <div style={{ flex: "1 1 220px" }}>
              {allTimePie.map((entry, i) => {
                const total = allTimePie.reduce((s, e) => s + e.value, 0);
                const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
                return (
                  <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{
                      display: "inline-block", width: 14, height: 14, borderRadius: 4,
                      background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0,
                    }} />
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 14 }}>{entry.name}</span>
                    <span style={{ fontSize: 13, color: "var(--muted)" }}>{pct}%</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{money(entry.value, currency)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="cardWide" style={{ marginTop: 16 }}>
        <div className="cardTitle">Charts</div>

        {/* Period filter */}
        <div className="radioGroup" role="radiogroup" aria-label="Chart period" style={{ marginBottom: 24 }}>
          {(["daily", "weekly", "monthly"] as const).map(p => (
            <label key={p} className="radio">
              <input type="radio" name="chartPeriod" checked={period === p} onChange={() => setPeriod(p)} />
              <span>{p[0].toUpperCase() + p.slice(1)}</span>
            </label>
          ))}
        </div>

        {/* Income vs Expense bar */}
        <div style={{ marginBottom: 36 }}>
          <div className="cardTitle" style={{ fontSize: 18, marginBottom: 12 }}>Income vs Expense</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={incomeVsExpenseBar} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontWeight: 700 }} />
              <YAxis tickFormatter={fmtAmount} />
              <Tooltip formatter={(v: number) => money(v, "PHP")} />
              <Legend />
              <Bar dataKey="value" name="Income vs Expense" radius={[6, 6, 0, 0]}>
                {incomeVsExpenseBar.map((entry, i) => (
                  <Cell key={i} fill={entry.name === "Income" ? "#22c55e" : "#ef4444"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Trend line */}
        <div style={{ marginBottom: 36 }}>
          <div className="cardTitle" style={{ fontSize: 18, marginBottom: 12 }}>Trend</div>
          {trendData.length === 0
            ? <p className="muted">No data for selected period.</p>
            : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={trendData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={fmtAmount} />
                  <Tooltip formatter={(v: number) => money(v, "PHP")} />
                  <Legend />
                  <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Expense Distribution pie */}
        <div>
          <div className="cardTitle" style={{ fontSize: 18, marginBottom: 12 }}>Expense Distribution</div>
          {expenseDist.length === 0
            ? <p className="muted">No data for selected period.</p>
            : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseDist}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="45%"
                    outerRadius="70%"
                    paddingAngle={3}
                    label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                    labelLine={false}
                  >
                    {expenseDist.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v, "PHP")} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      <div className="cardWide" style={{ marginTop: 16 }}>
        <div className="cardTitle">Latest Transactions (Journal View)</div>

        <div className="tableWrap" role="region" aria-label="Latest transactions table">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Reference</th>
                <th className="num">Debit</th>
                <th className="num">Credit</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {latestJournalLike.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td>{r.description}</td>
                  <td>{r.reference}</td>
                  <td className="num">{r.debit ? money(r.debit, currency) : ""}</td>
                  <td className="num">{r.credit ? money(r.credit, currency) : ""}</td>
                  <td>{r.notes}</td>
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

              {!latestJournalLike.length ? (
                <tr>
                  <td colSpan={7} className="muted">No transactions yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="muted small" style={{ marginTop: 10 }}>
          Note: These dashboard totals are derived from transactions (simplified). Full accounting needs journal lines + chart of accounts mapping.
        </div>
      </div>

      <div className="cardWide" style={{ marginTop: 16 }}>
        <div className="cardTitle">Recent Activity (Readable)</div>

        <div className="tableWrap" role="region" aria-label="Recent activity table">
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
              {rows.slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{r.txn_date}</td>
                  <td>{typeLabel(r.txn_type, r.payment)}</td>
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