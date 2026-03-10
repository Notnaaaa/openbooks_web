// src/pages/app/Admin.tsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthProvider";
import { Navigate } from "react-router-dom";
import "../../styles/globals.css";
type ProfileRow = {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  role: "owner" | "admin" | string;
  created_at: string;
};

type BusinessRow = {
  id: string;
  name: string;
  owner_user_id: string;
  created_at: string;
};

type PresenceRow = {
  user_id: string;
  is_online: boolean;
  is_active: boolean;
  last_seen: string;
};

function Tab({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={active}
      style={{
        padding: "10px 12px",
        borderRadius: 12,
        border: active ? "2px solid #111" : "2px solid #e9e9e9",
        background: active ? "#111" : "#fff",
        color: active ? "#fff" : "#111",
        fontWeight: 900,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function Card({
  title,
  value,
  items,
}: {
  title: string;
  value: string;
  items: [string, string][];
}) {
  return (
    <div
      style={{
        border: "2px solid #e9e9e9",
        borderRadius: 16,
        padding: 14,
        background: "#fff",
      }}
    >
      <div style={{ fontWeight: 950, fontSize: 16 }}>{title}</div>
      <div style={{ fontWeight: 950, fontSize: 34, marginTop: 6 }}>{value}</div>
      <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
        {items.map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div style={{ opacity: 0.8 }}>{k}</div>
            <div style={{ fontWeight: 900 }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, any> = {
  page: { padding: 24, background: "#fafafa", minHeight: "100vh" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  title: { margin: 0, fontSize: 34, fontWeight: 950 },
  sub: { marginTop: 8, opacity: 0.85 },
  refreshBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "2px solid #111",
    background: "#111",
    color: "#fff",
    fontWeight: 900,
    cursor: "pointer",
  },
  tabs: { display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" },
  errorBox: { marginTop: 16, border: "2px solid #b00020", borderRadius: 14, padding: 12, background: "#fff" },
  errorTitle: { fontWeight: 950, marginBottom: 6 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: 14,
    marginTop: 16,
  },
  tableWrap: { marginTop: 16, border: "2px solid #e9e9e9", borderRadius: 16, background: "#fff", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" as const },
  th: { textAlign: "left" as const, padding: 12, borderBottom: "2px solid #eee", fontWeight: 950, fontSize: 14 },
  td: { padding: 12, borderBottom: "1px solid #eee", fontSize: 14 },
};

export default function Admin() {
  const { profile, loading } = useAuth();

  // ✅ Hooks MUST be declared before any return
  const [tab, setTab] = useState<"overview" | "users" | "businesses" | "presence">("overview");
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [biz, setBiz] = useState<BusinessRow[]>([]);
  const [pres, setPres] = useState<PresenceRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function loadAll() {
    setBusy(true);
    setErr(null);

    const [u, b, p] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,phone_number,role,created_at")
        .order("created_at", { ascending: false })
        .limit(300),

      supabase
        .from("businesses")
        .select("id,name,owner_user_id,created_at")
        .order("created_at", { ascending: false })
        .limit(300),

      supabase
        .from("user_presence")
        .select("user_id,is_online,is_active,last_seen")
        .order("last_seen", { ascending: false })
        .limit(500),
    ]);

    if (u.error || b.error || p.error) {
      setErr(u.error?.message || b.error?.message || p.error?.message || "Failed to load admin data.");
      setBusy(false);
      return;
    }

    setUsers((u.data ?? []) as ProfileRow[]);
    setBiz((b.data ?? []) as BusinessRow[]);
    setPres((p.data ?? []) as PresenceRow[]);
    setBusy(false);
  }

  // ✅ Only start polling if admin
  useEffect(() => {
    if (loading) return;
    if (!profile) return;
    if (profile.role !== "admin") return;

    loadAll();
    const t = window.setInterval(loadAll, 10000);
    return () => window.clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, profile?.id, profile?.role]);

  const counts = useMemo(() => {
    const owners = users.filter((x) => x.role === "owner").length;
    const admins = users.filter((x) => x.role === "admin").length;
    const online = pres.filter((x) => x.is_online).length;
    const activeNow = pres.filter((x) => x.is_active).length;
    return { owners, admins, online, activeNow };
  }, [users, pres]);

  // ✅ Gate AFTER hooks (fixes hook-order crash)
  if (loading || !profile) return <div style={styles.page}>Loading…</div>;
  if (profile.role !== "admin") return <Navigate to="/app" replace />;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Console</h1>
          <div style={styles.sub}>Monitor owners, admins, businesses, and activity.</div>
        </div>

        <button style={styles.refreshBtn} onClick={loadAll} disabled={busy}>
          {busy ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      <div style={styles.tabs} role="tablist" aria-label="Admin sections">
        <Tab active={tab === "overview"} onClick={() => setTab("overview")} label="Overview" />
        <Tab active={tab === "users"} onClick={() => setTab("users")} label="Users" />
        <Tab active={tab === "businesses"} onClick={() => setTab("businesses")} label="Businesses" />
        <Tab active={tab === "presence"} onClick={() => setTab("presence")} label="Presence" />
      </div>

      {err ? (
        <div style={styles.errorBox} role="alert" aria-live="polite">
          <div style={styles.errorTitle}>Could not load admin data</div>
          <div>{err}</div>
          <div style={{ marginTop: 10, opacity: 0.85 }}>
            If you see <b>RLS</b> errors, allow admin read access in your policies.
          </div>
        </div>
      ) : null}

      {tab === "overview" ? (
        <div style={styles.grid}>
          <Card
            title="Users"
            value={String(users.length)}
            items={[
              ["Owners", String(counts.owners)],
              ["Admins", String(counts.admins)],
            ]}
          />
          <Card
            title="Businesses"
            value={String(biz.length)}
            items={[
              ["Online now", String(counts.online)],
              ["Active now", String(counts.activeNow)],
            ]}
          />
        </div>
      ) : null}

      {tab === "users" ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Phone</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={styles.td}>{u.full_name ?? "-"}</td>
                  <td style={styles.td}>{u.phone_number ?? "-"}</td>
                  <td style={styles.td}>{u.role}</td>
                  <td style={styles.td}>{new Date(u.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "businesses" ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Business</th>
                <th style={styles.th}>Owner</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {biz.map((b) => (
                <tr key={b.id}>
                  <td style={styles.td}>{b.name}</td>
                  <td style={styles.td}>{b.owner_user_id}</td>
                  <td style={styles.td}>{new Date(b.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "presence" ? (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>User ID</th>
                <th style={styles.th}>Online</th>
                <th style={styles.th}>Active</th>
                <th style={styles.th}>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {pres.map((p) => (
                <tr key={p.user_id}>
                  <td style={styles.td}>{p.user_id}</td>
                  <td style={styles.td}>{p.is_online ? "Yes" : "No"}</td>
                  <td style={styles.td}>{p.is_active ? "Yes" : "No"}</td>
                  <td style={styles.td}>{new Date(p.last_seen).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}