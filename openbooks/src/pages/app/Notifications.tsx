// src/pages/app/Notifications.tsx
import { useEffect, useMemo, useState } from "react";
import { useBusiness } from "../../context/BusinessProvider";
import { listTransactions } from "../../services/transactions.service";
import { supabase } from "../../lib/supabase";
import "../../styles/globals.css";
import {
  getCurrentUserId,
  listMyNotifications,
  markAllMyNotificationsRead,
  markNotificationRead,
  type NotifRow,
} from "../../services/notifications.service";

function relTime(iso: string) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - t) / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return `${s}s ago`;
}

function badgeLabel(type: string) {
  const t = String(type || "").toLowerCase();
  if (t === "warning") return "Warning";
  if (t === "system") return "System";
  if (t.startsWith("staff_")) return "Staff";
  return "Notice";
}

function badgeClass(type: string) {
  const t = String(type || "").toLowerCase();
  if (t === "warning") return "badge badgeWarn";
  if (t === "system") return "badge badgeSys";
  return "badge";
}

function n2(n: any) {
  return Number(n || 0).toFixed(2);
}

export default function Notifications() {
  const { business } = useBusiness();

  const [rows, setRows] = useState<NotifRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const unreadCount = useMemo(() => rows.filter((r) => !r.is_read).length, [rows]);

  async function load() {
    setLoading(true);
    setMsg(null);

    const userId = await getCurrentUserId();
    if (!userId) {
      setLoading(false);
      setRows([]);
      setMsg("Not signed in.");
      return;
    }

    const res = await listMyNotifications({ userId, limit: 200 });

    setLoading(false);

    if (res.error) {
      setMsg(res.error.message);
      setRows([]);
      return;
    }

    setRows((res.data ?? []) as NotifRow[]);
  }

  async function generate() {
    if (!business?.id) { setMsg("No business found."); return; }

    setBusy(true);
    setMsg(null);

    const userId = await getCurrentUserId();
    if (!userId) { setBusy(false); setMsg("Not signed in."); return; }

    // Fetch all transactions to compute stats
    const txRes = await listTransactions(business.id);
    if (txRes.error) { setBusy(false); setMsg(txRes.error.message); return; }

    const rows = (txRes.data ?? []) as any[];
    const sum = (fn: (r: any) => boolean) =>
      rows.filter(fn).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);

    const totalIncome    = sum(r => r.txn_type === "income");
    const totalExpense   = sum(r => r.txn_type === "expense");
    const totalBuyAsset  = sum(r => r.txn_type === "buy_asset");
    const totalExpenses  = totalExpense + totalBuyAsset;
    const netIncome      = totalIncome - totalExpenses;
    const investment     = sum(r => r.txn_type === "investment");
    const creditPurchases = sum(r => (r.txn_type === "buy_asset" || r.txn_type === "expense") && r.payment === "credit");
    const paidLiability  = sum(r => r.txn_type === "pay_liability");
    const payable        = Math.max(0, creditPurchases - paidLiability);
    const pendingIncome  = rows.filter(r => r.txn_type === "income" && r.income_state === "pending");
    const cashInflows    = totalIncome + investment;
    const cashOutflows   = sum(r => r.txn_type === "expense"   && (!r.payment || r.payment === "cash"))
                         + sum(r => r.txn_type === "buy_asset" && (!r.payment || r.payment === "cash"))
                         + sum(r => r.txn_type === "withdrawal")
                         + paidLiability;
    const cashBalance    = cashInflows - cashOutflows;

    // Build notification inserts
    const notices: { user_id: string; type: string; title: string; message: string; data: any }[] = [];

    const fmt = (n: number) => `₱${n.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

    // Summary notice always
    notices.push({
      user_id: userId,
      type: "system",
      title: "Financial Summary",
      message: `Income: ${fmt(totalIncome)} | Expenses: ${fmt(totalExpenses)} | Net Income: ${fmt(netIncome)} | Cash Balance: ${fmt(cashBalance)}`,
      data: { totalIncome, totalExpenses, netIncome, cashBalance },
    });

    if (netIncome < 0) {
      notices.push({
        user_id: userId,
        type: "warning",
        title: "Negative Net Income",
        message: `Your expenses (${fmt(totalExpenses)}) exceed your income (${fmt(totalIncome)}) by ${fmt(Math.abs(netIncome))}.`,
        data: { netIncome },
      });
    } else if (netIncome > 0) {
      notices.push({
        user_id: userId,
        type: "system",
        title: "Positive Net Income",
        message: `Great! You have a net income of ${fmt(netIncome)} this period.`,
        data: { netIncome },
      });
    }

    if (payable > 0) {
      notices.push({
        user_id: userId,
        type: "warning",
        title: "Outstanding Payables",
        message: `You have ${fmt(payable)} in unpaid credit purchases. Consider settling them soon.`,
        data: { payable },
      });
    }

    if (pendingIncome.length > 0) {
      const pendingTotal = pendingIncome.reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
      notices.push({
        user_id: userId,
        type: "system",
        title: `${pendingIncome.length} Pending Income Transaction${pendingIncome.length > 1 ? "s" : ""}`,
        message: `You have ${fmt(pendingTotal)} in income marked as pending (not yet received).`,
        data: { pendingCount: pendingIncome.length, pendingTotal },
      });
    }

    if (cashBalance < 0) {
      notices.push({
        user_id: userId,
        type: "warning",
        title: "Negative Cash Balance",
        message: `Your estimated cash balance is ${fmt(cashBalance)}. Review your outflows.`,
        data: { cashBalance },
      });
    }

    if (investment > 0) {
      notices.push({
        user_id: userId,
        type: "system",
        title: "Investment Recorded",
        message: `Total capital/investment contributions: ${fmt(investment)}.`,
        data: { investment },
      });
    }

    if (rows.length === 0) {
      notices.push({
        user_id: userId,
        type: "system",
        title: "No transactions yet",
        message: "Start recording transactions to get insights here.",
        data: {},
      });
    }

    const { error: insErr } = await supabase.from("notifications").insert(notices);
    setBusy(false);

    if (insErr) { setMsg(insErr.message); return; }

    await load();
    setMsg(`${notices.length} notification${notices.length > 1 ? "s" : ""} generated.`);
  }

  async function markAllRead() {
    setBusy(true);
    setMsg(null);

    const userId = await getCurrentUserId();
    if (!userId) {
      setBusy(false);
      setMsg("Not signed in.");
      return;
    }

    const res = await markAllMyNotificationsRead({ userId });

    setBusy(false);

    if (res.error) {
      setMsg(res.error.message);
      return;
    }

    await load();
  }

  async function markOneRead(id: string) {
    setBusy(true);
    setMsg(null);

    const userId = await getCurrentUserId();
    if (!userId) {
      setBusy(false);
      setMsg("Not signed in.");
      return;
    }

    const res = await markNotificationRead({ id, userId });

    setBusy(false);

    if (res.error) {
      setMsg(res.error.message);
      return;
    }

    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="page">
      <div className="pageTop">
        <div>
          <h1 className="h1">Notifications</h1>
          <p className="muted">System notices and insights from your activity.</p>
        </div>

        <div className="btnRow" style={{ marginTop: 0 }}>
          <button className="btnGhostSmall" onClick={load} disabled={busy}>
            Refresh list
          </button>
          <button className="btnGhostSmall" onClick={generate} disabled={!business?.id || busy}>
            {busy ? "Generating…" : "Generate"}
          </button>
          <button className="btnGhostSmall" onClick={markAllRead} disabled={!rows.length || busy}>
            Mark all read{unreadCount ?  (` (${unreadCount})`) : ""}
          </button>
        </div>
      </div>

      {msg ? (
        <div className="infoBox" role="status" aria-live="polite">
          {msg}
        </div>
      ) : null}

      {loading ? <p className="muted">Loading…</p> : null}

      {!loading && !rows.length ? (
        <div className="cardWide" style={{ marginTop: 12 }}>
          <div className="cardTitle">No notifications</div>
          <p className="muted">You’re all caught up.</p>
        </div>
      ) : null}

      {rows.length ? (
        <div className="cardWide" style={{ marginTop: 12 }}>
          <div className="cardTitle">All notifications</div>

          <div className="notifList">
            {rows.map((n) => {
              const d = n.data && typeof n.data === "object" ? n.data : null;

              return (
                <div key={n.id} className={`notifItem ${n.is_read ? "" : "isUnread"}`}>
                  <div className="notifHead">
                    <div className="notifLeft">
                      <span className={badgeClass(n.type)}>{badgeLabel(n.type)}</span>
                      <div className="notifTitle">{n.title}</div>
                    </div>

                    <div className="notifRight">
                      <div className="muted small">{relTime(n.created_at)}</div>
                      {!n.is_read ? (
                        <button
                          className="btnGhostTiny"
                          onClick={() => markOneRead(n.id)}
                          aria-label="Mark notification as read"
                          disabled={busy}
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="notifMsg">{n.message}</div>

                  {/* Optional: show a few helpful fields if present */}
                  {d ? (
                    <div className="notifMeta muted small">
                      {typeof d.payables !== "undefined" ? (
                        <span className="pillTiny">payables: {n2(d.payables)}</span>
                      ) : null}
                      {typeof d.net !== "undefined" ? (
                        <span className="pillTiny">net: {n2(d.net)}</span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}