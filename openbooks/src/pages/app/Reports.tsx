// src/pages/app/Reports.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useBusiness } from "../../context/BusinessProvider";
import { listTransactions } from "../../services/transactions.service";
import { money } from "../../lib/format";
import "../../styles/globals.css";

type Mode = "accounting" | "statements";
type AccountingView = "journal" | "ledger" | "trial_balance";
type StatementView = "income_statement" | "owners_equity" | "balance_sheet" | "cash_flow";

type TxnRow = {
  id: string;
  business_id: string;
  txn_date: string;
  txn_type: string;
  payment: string | null;
  description: string;
  reference: string;
  amount: number;
  notes: string | null;
  created_at: string;
};

const CURRENCY = "PHP";

function typeLabel(txn_type: string, payment?: string | null) {
  if (txn_type === "buy_asset") return payment === "credit" ? "Buy Asset (Credit)" : "Buy Asset (Cash)";
  if (txn_type === "expense" || txn_type === "pay_expense")
    return payment === "credit" ? "Expense (Credit)" : "Expense (Cash)";
  if (txn_type === "income") return "Income";
  if (txn_type === "investment") return "Investment";
  if (txn_type === "withdrawal") return "Withdrawal";
  if (txn_type === "pay_liability") return "Pay Liability";
  return txn_type;
}

function isCashPmt(payment: string | null) {
  return !payment || payment === "cash";
}

function toNumber(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function csvEscape(value: string | number) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function sanitizeFileName(value: string | null | undefined) {
  return (value ?? "openbooks")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "openbooks";
}

const REPORT_INFO: Record<string, { title: string; description: string; formula: string }> = {
  journal: {
    title: "Journal Entry Report",
    description: "Every transaction recorded as balanced debit and credit entries.",
    formula: "Debit = Buy Asset / Expense / Pay Liability / Withdrawal | Credit = Income / Investment",
  },
  ledger: {
    title: "General Ledger",
    description: "All transactions grouped by account with a running balance.",
    formula: "Running Balance = Cumulative Debits - Cumulative Credits",
  },
  trial_balance: {
    title: "Trial Balance",
    description: "Summary of all account balances verifying the books are in balance.",
    formula: "Total Debits = Total Credits",
  },
  income_statement: {
    title: "Income Statement",
    description: "Revenue earned and expenses incurred over the period.",
    formula: "Net Income = Total Revenue - Total Expenses",
  },
  owners_equity: {
    title: "Statement of Owner's Equity",
    description: "Changes in the owner's capital balance during the period.",
    formula: "Ending Capital = Beginning Capital + Investment + Net Income - Drawings",
  },
  balance_sheet: {
    title: "Balance Sheet",
    description: "Snapshot of the business financial position.",
    formula: "Assets = Liabilities + Owner's Equity",
  },
  cash_flow: {
    title: "Cash Flow Statement",
    description: "Cash inflows and outflows across operating, investing, and financing activities.",
    formula: "Ending Cash = Beginning Cash + Net Cash from All Activities",
  },
};

export default function Reports() {
  const { business } = useBusiness();

  const [mode, setMode] = useState<Mode>("accounting");
  const [accountingView, setAccountingView] = useState<AccountingView>("journal");
  const [statementView, setStatementView] = useState<StatementView>("income_statement");
  const [tx, setTx] = useState<TxnRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const activeView = mode === "accounting" ? accountingView : statementView;

  async function load() {
    if (!business?.id) return;
    setLoading(true);
    setMsg(null);
    const res = await listTransactions(business.id);
    if (res.error) { setMsg(res.error.message); setTx([]); }
    else setTx((res.data ?? []) as unknown as TxnRow[]);
    setLoading(false);
  }

  useEffect(() => { if (business?.id) load(); }, [business?.id]);

  // â”€â”€ Double-entry journal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const journalEntries = useMemo(() => {
    return tx.slice().sort((a, b) => a.txn_date.localeCompare(b.txn_date)).map((r) => {
      const amt = toNumber(r.amount);
      const t = r.txn_type;
      const cash = isCashPmt(r.payment);
      let lines: { accountTitle: string; debit: number; credit: number }[] = [];

      if (t === "buy_asset" || t === "expense" || t === "pay_expense") {
        lines = cash
          ? [{ accountTitle: r.description, debit: amt, credit: 0 }, { accountTitle: "Cash", debit: 0, credit: amt }]
          : [{ accountTitle: r.description, debit: amt, credit: 0 }, { accountTitle: "Accounts Payable", debit: 0, credit: amt }];
      } else if (t === "pay_liability") {
        lines = [{ accountTitle: "Accounts Payable", debit: amt, credit: 0 }, { accountTitle: "Cash", debit: 0, credit: amt }];
      } else if (t === "withdrawal") {
        lines = [{ accountTitle: "Owner Drawings", debit: amt, credit: 0 }, { accountTitle: "Cash", debit: 0, credit: amt }];
      } else if (t === "investment") {
        lines = [{ accountTitle: "Cash", debit: amt, credit: 0 }, { accountTitle: "Owner Capital", debit: 0, credit: amt }];
      } else if (t === "income") {
        lines = cash
          ? [{ accountTitle: "Cash", debit: amt, credit: 0 }, { accountTitle: r.description, debit: 0, credit: amt }]
          : [{ accountTitle: "Accounts Receivable", debit: amt, credit: 0 }, { accountTitle: r.description, debit: 0, credit: amt }];
      }
      return { txnId: r.id, date: r.txn_date, reference: r.reference, description: r.description, lines };
    });
  }, [tx]);

  // â”€â”€ Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const ledgerAccounts = useMemo(() => {
    const map = new Map<string, { date: string; reference: string; description: string; debit: number; credit: number }[]>();
    for (const e of journalEntries) {
      for (const l of e.lines) {
        if (!map.has(l.accountTitle)) map.set(l.accountTitle, []);
        map.get(l.accountTitle)!.push({ date: e.date, reference: e.reference, description: e.description, debit: l.debit, credit: l.credit });
      }
    }
    return Array.from(map.entries()).map(([account, rows]) => {
      rows.sort((a, b) => a.date.localeCompare(b.date));
      let bal = 0;
      const rowsB = rows.map((r) => { bal += r.debit - r.credit; return { ...r, balance: bal }; });
      return { account, rows: rowsB, totalDebit: rows.reduce((s, r) => s + r.debit, 0), totalCredit: rows.reduce((s, r) => s + r.credit, 0), endingBalance: bal };
    }).sort((a, b) => a.account.localeCompare(b.account));
  }, [journalEntries]);

  // â”€â”€ Trial Balance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const trialBalance = useMemo(() => {
    const rows = ledgerAccounts.map(({ account, totalDebit, totalCredit }) => {
      const net = totalDebit - totalCredit;
      return { account, debit: net > 0 ? net : 0, credit: net < 0 ? -net : 0 };
    });
    const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
    const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
    return { rows, totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 };
  }, [ledgerAccounts]);

  // â”€â”€ Financial stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalIncome = useMemo(() => tx.filter((x) => x.txn_type === "income").reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const totalExpenses = useMemo(() => tx.filter((x) => ["expense", "pay_expense", "buy_asset"].includes(x.txn_type)).reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const netIncome = totalIncome - totalExpenses;
  const totalInvestment = useMemo(() => tx.filter((x) => x.txn_type === "investment").reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const totalWithdrawal = useMemo(() => tx.filter((x) => x.txn_type === "withdrawal").reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const totalCreditBuys = useMemo(() => tx.filter((x) => ["buy_asset", "expense", "pay_expense"].includes(x.txn_type) && x.payment === "credit").reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const totalPaidLiab = useMemo(() => tx.filter((x) => x.txn_type === "pay_liability").reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const accountsPayable = Math.max(0, totalCreditBuys - totalPaidLiab);
  const cashBalance = useMemo(() => {
    const inflow = tx.filter((x) => x.txn_type === "income" && isCashPmt(x.payment)).reduce((s, x) => s + toNumber(x.amount), 0)
      + tx.filter((x) => x.txn_type === "investment").reduce((s, x) => s + toNumber(x.amount), 0);
    const outflow = tx.filter((x) => ["expense", "pay_expense", "buy_asset"].includes(x.txn_type) && isCashPmt(x.payment)).reduce((s, x) => s + toNumber(x.amount), 0)
      + tx.filter((x) => x.txn_type === "withdrawal").reduce((s, x) => s + toNumber(x.amount), 0)
      + tx.filter((x) => x.txn_type === "pay_liability").reduce((s, x) => s + toNumber(x.amount), 0);
    return inflow - outflow;
  }, [tx]);
  const accountsReceivable = useMemo(() => tx.filter((x) => x.txn_type === "income" && !isCashPmt(x.payment)).reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const endingEquity = totalInvestment + netIncome - totalWithdrawal;

  // Cash flow sections
  const opCashIn = useMemo(() => tx.filter((x) => x.txn_type === "income" && isCashPmt(x.payment)).reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const opExpOut = useMemo(() => tx.filter((x) => ["expense", "pay_expense"].includes(x.txn_type) && isCashPmt(x.payment)).reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const invOut = useMemo(() => tx.filter((x) => x.txn_type === "buy_asset" && isCashPmt(x.payment)).reduce((s, x) => s + toNumber(x.amount), 0), [tx]);
  const opNet = opCashIn - opExpOut;
  const invNet = -invOut;
  const finNet = totalInvestment - totalWithdrawal - totalPaidLiab;
  const netCashChange = opNet + invNet + finNet;

  const info = REPORT_INFO[activeView];

  function exportJournalReport() {
    if (journalEntries.length === 0) return;

    const rows = [
      ["Date", "Reference", "Description", "Account Title", "Debit", "Credit"],
      ...journalEntries.flatMap((entry) =>
        entry.lines.map((line, lineIndex) => [
          lineIndex === 0 ? entry.date : "",
          lineIndex === 0 ? entry.reference : "",
          lineIndex === 0 ? entry.description : "",
          line.accountTitle,
          line.debit ? line.debit.toFixed(2) : "",
          line.credit ? line.credit.toFixed(2) : "",
        ])
      ),
    ];

    const csv = `\uFEFF${rows.map((row) => row.map(csvEscape).join(",")).join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const businessName = sanitizeFileName(business?.name);

    link.href = url;
    link.download = `${businessName}-journal-entry-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <div className="rpt-page">
      {/* Header */}
      <div className="rpt-header">
        <div>
          <h1 className="rpt-title">Reports</h1>
          <p className="rpt-subtitle">Accounting reports &amp; financial statements</p>
        </div>
      </div>

      {msg && <div className="rpt-error-banner">{msg}</div>}

      {/* Selector card */}
      <div className="rpt-selector-card">
        <div className="rpt-mode-tabs">
          {(["accounting", "statements"] as Mode[]).map((m) => (
            <button key={m} className={`rpt-mode-tab${mode === m ? " active" : ""}`} onClick={() => setMode(m)}>
              {m === "accounting" ? "Accounting Reports" : "Financial Statements"}
            </button>
          ))}
        </div>
        <div className="rpt-type-tabs">
          {mode === "accounting"
            ? (["journal", "ledger", "trial_balance"] as AccountingView[]).map((v) => (
                <button key={v} className={`rpt-type-tab${accountingView === v ? " active" : ""}`} onClick={() => setAccountingView(v)}>
                  {v === "journal" ? "Journal Entry" : v === "ledger" ? "General Ledger" : "Trial Balance"}
                </button>
              ))
            : (["income_statement", "owners_equity", "balance_sheet", "cash_flow"] as StatementView[]).map((v) => (
                <button key={v} className={`rpt-type-tab${statementView === v ? " active" : ""}`} onClick={() => setStatementView(v)}>
                  {v === "income_statement" ? "Income Statement" : v === "owners_equity" ? "Owner's Equity" : v === "balance_sheet" ? "Balance Sheet" : "Cash Flow"}
                </button>
              ))}
        </div>
      </div>

      {/* Info card */}
      {info && (
        <div className="rpt-info-card">
          <div className="rpt-info-title">{info.title}</div>
          <p className="rpt-info-desc">{info.description}</p>
          <div className="rpt-info-formula">{info.formula}</div>
        </div>
      )}

      {loading && <div className="rpt-loading">Loading...</div>}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• JOURNAL ENTRY â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "accounting" && accountingView === "journal" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header">
            <span className="rpt-report-title">Journal Entry Report</span>
            <div className="rpt-report-actions">
              <button
                type="button"
                className="rpt-export-btn"
                onClick={exportJournalReport}
                disabled={journalEntries.length === 0}
                title="Export journal entry report as CSV"
              >
                Export CSV
              </button>
              <span className="rpt-report-badge">{journalEntries.length} entries</span>
            </div>
          </div>
          {journalEntries.length === 0 ? <RptEmpty msg="No transactions yet. Add transactions to generate journal entries." /> : (
            <>
              <p className="rpt-scroll-hint">Swipe to view all columns</p>
              <div className="rpt-tbl-wrap">
                <table className="rpt-tbl">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Ref</th>
                      <th>Description</th>
                      <th>Account Title</th>
                      <th className="rpt-num">Debit</th>
                      <th className="rpt-num">Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {journalEntries.map((entry) => (
                      <React.Fragment key={entry.txnId}>
                        {entry.lines.map((line, li) => (
                          <tr key={`${entry.txnId}-${li}`} className={li === 0 ? "rpt-row-debit" : "rpt-row-credit"}>
                            <td className="rpt-nowrap">{li === 0 ? entry.date : ""}</td>
                            <td className="rpt-nowrap">{li === 0 ? entry.reference : ""}</td>
                            <td>{li === 0 ? entry.description : ""}</td>
                            <td className={li === 1 ? "rpt-credit-indent" : ""}>{line.accountTitle}</td>
                            <td className="rpt-num rpt-debit-amt">{line.debit ? money(line.debit, CURRENCY) : ""}</td>
                            <td className="rpt-num rpt-credit-amt">{line.credit ? money(line.credit, CURRENCY) : ""}</td>
                          </tr>
                        ))}
                        <tr className="rpt-row-sep"><td colSpan={6} /></tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• GENERAL LEDGER â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "accounting" && accountingView === "ledger" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header">
            <span className="rpt-report-title">General Ledger</span>
            <span className="rpt-report-badge">{ledgerAccounts.length} accounts</span>
          </div>
          {ledgerAccounts.length === 0 ? <RptEmpty msg="No transactions yet. Add transactions to populate the ledger." /> : (
            ledgerAccounts.map((acct) => (
              <div className="rpt-ledger-block" key={acct.account}>
                <div className="rpt-ledger-block-header">
                  <span className="rpt-ledger-acct-name">{acct.account}</span>
                  <span className={`rpt-ledger-balance ${acct.endingBalance < 0 ? "rpt-neg" : "rpt-pos"}`}>
                    {money(acct.endingBalance, CURRENCY)}
                  </span>
                </div>
                <p className="rpt-scroll-hint">Swipe to view all columns</p>
                <div className="rpt-tbl-wrap">
                  <table className="rpt-tbl">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Ref</th>
                        <th>Description</th>
                        <th className="rpt-num">Debit</th>
                        <th className="rpt-num">Credit</th>
                        <th className="rpt-num">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acct.rows.map((row, i) => (
                        <tr key={i}>
                          <td className="rpt-nowrap">{row.date}</td>
                          <td className="rpt-nowrap">{row.reference}</td>
                          <td>{row.description}</td>
                            <td className="rpt-num rpt-debit-amt">{row.debit ? money(row.debit, CURRENCY) : "-"}</td>
                            <td className="rpt-num rpt-credit-amt">{row.credit ? money(row.credit, CURRENCY) : "-"}</td>
                          <td className={`rpt-num rpt-balance-col${row.balance < 0 ? " rpt-neg" : ""}`}>{money(row.balance, CURRENCY)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="rpt-tbl-subtotal">
                        <td colSpan={3}>Total</td>
                        <td className="rpt-num">{money(acct.totalDebit, CURRENCY)}</td>
                        <td className="rpt-num">{money(acct.totalCredit, CURRENCY)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• TRIAL BALANCE â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "accounting" && accountingView === "trial_balance" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header">
            <span className="rpt-report-title">Trial Balance</span>
            <span className={`rpt-balanced-badge${trialBalance.balanced ? " ok" : " warn"}`}>
              {trialBalance.balanced ? "Balanced" : "Out of Balance"}
            </span>
          </div>
          {trialBalance.rows.length === 0 ? <RptEmpty msg="No data to display. Add transactions first." /> : (
            <div className="rpt-tbl-wrap">
              <table className="rpt-tbl">
                <thead>
                  <tr>
                    <th>Account Title</th>
                    <th className="rpt-num">Debit</th>
                    <th className="rpt-num">Credit</th>
                  </tr>
                </thead>
                <tbody>
                  {trialBalance.rows.map((r) => (
                    <tr key={r.account}>
                      <td>{r.account}</td>
                      <td className="rpt-num rpt-debit-amt">{r.debit ? money(r.debit, CURRENCY) : "-"}</td>
                      <td className="rpt-num rpt-credit-amt">{r.credit ? money(r.credit, CURRENCY) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="rpt-tbl-grandtotal">
                    <td>TOTAL</td>
                    <td className="rpt-num">{money(trialBalance.totalDebit, CURRENCY)}</td>
                    <td className="rpt-num">{money(trialBalance.totalCredit, CURRENCY)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• INCOME STATEMENT â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "statements" && statementView === "income_statement" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header"><span className="rpt-report-title">Income Statement</span></div>
          {tx.length === 0 ? <RptEmpty msg="No transactions found." /> : (
            <div className="rpt-stmt">
              <SRow type="section" label="REVENUE" />
              <SRow type="item" label="Service Revenue" amount={totalIncome} />
              <SRow type="subtotal" label="TOTAL REVENUE" amount={totalIncome} pos />
              <SRow type="spacer" />
              <SRow type="section" label="EXPENSES" />
              <SRow type="item" label="Operating Expenses" amount={totalExpenses} />
              <SRow type="subtotal" label="TOTAL EXPENSES" amount={totalExpenses} neg />
              <SRow type="spacer" />
              <SRow type="grandtotal" label="NET INCOME (LOSS)" amount={netIncome} pos={netIncome >= 0} neg={netIncome < 0} />
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• OWNER'S EQUITY â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "statements" && statementView === "owners_equity" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header"><span className="rpt-report-title">Statement of Owner's Equity</span></div>
          {tx.length === 0 ? <RptEmpty msg="No transactions found." /> : (
            <div className="rpt-stmt">
              <SRow type="section" label="OWNER'S EQUITY" />
              <SRow type="item" label="Beginning Capital" amount={0} />
              <SRow type="spacer" />
              <SRow type="section" label="ADDITIONS" />
              <SRow type="item" label="Owner Investment" amount={totalInvestment} />
              <SRow type="item" label="Net Income" amount={netIncome} pos={netIncome >= 0} neg={netIncome < 0} />
              <SRow type="subtotal" label="SUBTOTAL" amount={totalInvestment + Math.max(0, netIncome)} pos />
              <SRow type="spacer" />
              <SRow type="section" label="DEDUCTIONS" />
              <SRow type="item" label="Owner Drawings" amount={totalWithdrawal} />
              <SRow type="subtotal" label="TOTAL DEDUCTIONS" amount={totalWithdrawal} neg />
              <SRow type="spacer" />
              <SRow type="grandtotal" label="ENDING OWNER CAPITAL" amount={endingEquity} pos={endingEquity >= 0} neg={endingEquity < 0} />
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• BALANCE SHEET â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "statements" && statementView === "balance_sheet" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header"><span className="rpt-report-title">Balance Sheet</span></div>
          {tx.length === 0 ? <RptEmpty msg="No transactions found." /> : (
            <div className="rpt-stmt">
              <SRow type="section" label="ASSETS" />
              <SRow type="item" label="Cash" amount={cashBalance} />
              <SRow type="item" label="Accounts Receivable" amount={accountsReceivable} />
              <SRow type="total" label="TOTAL ASSETS" amount={cashBalance + accountsReceivable} pos />
              <SRow type="spacer" />
              <SRow type="section" label="LIABILITIES" />
              <SRow type="item" label="Accounts Payable" amount={accountsPayable} />
              <SRow type="total" label="TOTAL LIABILITIES" amount={accountsPayable} neg={accountsPayable > 0} />
              <SRow type="spacer" />
              <SRow type="section" label="OWNER'S EQUITY" />
              <SRow type="item" label="Owner Capital" amount={totalInvestment} />
              <SRow type="item" label="Less: Owner Drawings" amount={-totalWithdrawal} />
              <SRow type="item" label="Add: Net Income" amount={netIncome} />
              <SRow type="total" label="TOTAL OWNER'S EQUITY" amount={endingEquity} pos={endingEquity >= 0} />
              <SRow type="spacer" />
              <SRow type="grandtotal" label="TOTAL LIABILITIES + OWNER'S EQUITY" amount={accountsPayable + endingEquity} pos />
              {Math.abs((cashBalance + accountsReceivable) - (accountsPayable + endingEquity)) < 0.01 ? (
                <div className="rpt-eq-check rpt-eq-ok">Assets = Liabilities + Owner's Equity</div>
              ) : (
                <div className="rpt-eq-check rpt-eq-warn">Simplified model - balance may not match exactly</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â• CASH FLOW â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {mode === "statements" && statementView === "cash_flow" && (
        <div className="rpt-report-card">
          <div className="rpt-report-header"><span className="rpt-report-title">Cash Flow Statement</span></div>
          {tx.length === 0 ? <RptEmpty msg="No transactions found." /> : (
            <div className="rpt-stmt">
              <SRow type="section" label="OPERATING ACTIVITIES" />
              <SRow type="item" label="Cash Received from Customers" amount={opCashIn} />
              <SRow type="item" label="Cash Paid for Expenses" amount={-opExpOut} />
              <SRow type="subtotal" label="NET CASH FROM OPERATING ACTIVITIES" amount={opNet} pos={opNet >= 0} neg={opNet < 0} />
              <SRow type="spacer" />
              <SRow type="section" label="INVESTING ACTIVITIES" />
              <SRow type="item" label="Asset Purchases" amount={-invOut} />
              <SRow type="subtotal" label="NET CASH FROM INVESTING ACTIVITIES" amount={invNet} pos={invNet >= 0} neg={invNet < 0} />
              <SRow type="spacer" />
              <SRow type="section" label="FINANCING ACTIVITIES" />
              <SRow type="item" label="Owner Investment" amount={totalInvestment} />
              <SRow type="item" label="Owner Withdrawal" amount={-totalWithdrawal} />
              <SRow type="item" label="Payments on Liabilities" amount={-totalPaidLiab} />
              <SRow type="subtotal" label="NET CASH FROM FINANCING ACTIVITIES" amount={finNet} pos={finNet >= 0} neg={finNet < 0} />
              <SRow type="spacer" />
              <SRow type="item" label="Beginning Cash Balance" amount={0} />
              <SRow type="item" label="Net Increase / (Decrease) in Cash" amount={netCashChange} pos={netCashChange >= 0} neg={netCashChange < 0} />
              <SRow type="grandtotal" label="ENDING CASH BALANCE" amount={cashBalance} pos={cashBalance >= 0} neg={cashBalance < 0} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function RptEmpty({ msg }: { msg: string }) {
  return (
    <div className="rpt-empty">
      <div className="rpt-empty-icon">Report</div>
      <p className="rpt-empty-text">{msg}</p>
    </div>
  );
}

type SRowType = "section" | "item" | "subtotal" | "total" | "grandtotal" | "spacer";

function SRow({ type, label, amount, pos, neg }: { type: SRowType; label?: string; amount?: number; pos?: boolean; neg?: boolean }) {
  if (type === "spacer") return <div className="rpt-stmt-spacer" />;
  if (type === "section") return <div className="rpt-stmt-section">{label}</div>;

  const cls = ["rpt-stmt-row",
    type === "item" ? "rpt-stmt-item" : "",
    type === "subtotal" ? "rpt-stmt-subtotal" : "",
    type === "total" ? "rpt-stmt-total" : "",
    type === "grandtotal" ? "rpt-stmt-grandtotal" : "",
    pos ? "rpt-row-pos" : "",
    neg ? "rpt-row-neg" : "",
  ].filter(Boolean).join(" ");

  const v = amount ?? 0;
  const isNeg = v < 0;
  const display = money(Math.abs(v), CURRENCY);

  return (
    <div className={cls}>
      <span className="rpt-stmt-label">{label}</span>
      <span className={`rpt-stmt-amt${isNeg ? " rpt-neg" : ""}`}>{isNeg ? `(${display})` : display}</span>
    </div>
  );
}
