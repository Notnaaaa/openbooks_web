import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthProvider";
import { useBusiness } from "../../context/BusinessProvider";
import {
  LayoutDashboard,
  User,
  Bell,
  ArrowLeftRight,
  BarChart2,
  LogOut,
} from "lucide-react";

function cls({ isActive }: { isActive: boolean }) {
  return `sideLink ${isActive ? "isActive" : ""}`;
}

const NAV_ITEMS = [
  { to: "/app", end: true,  icon: LayoutDashboard, label: "Dashboard" },
  { to: "/app/profile",      icon: User,             label: "Profile" },
  { to: "/app/notifications",icon: Bell,             label: "Notifications" },
  { to: "/app/transactions", icon: ArrowLeftRight,   label: "Transactions" },
  { to: "/app/reports",      icon: BarChart2,        label: "Reports" },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const nav = useNavigate();
  const { signOut, profile } = useAuth();
  const { business } = useBusiness();

  const initials = (profile?.full_name ?? "")
    .split(" ").filter(Boolean)
    .map((w) => w[0].toUpperCase()).slice(0, 2).join("") || "?";

  async function logout() {
    await signOut();
    nav("/signin", { replace: true });
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sideTop">
        <span className="sideTitle">Menu</span>
        <button
          className="btnGhostTiny sideToggle"
          onClick={() => setCollapsed((s) => !s)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>

      <div className="sideUserCard">
        <div className="sideUserAvatar" title={profile?.full_name ?? undefined}>{initials}</div>
        <div className="sideUserInfo">
          <div className="sideUserName">{profile?.full_name || "—"}</div>
          <div className="sideUserMeta">
            {business?.name && <span className="sideUserBiz">{business.name}</span>}
            {business?.name && profile?.role && <span>·</span>}
            {profile?.role && <span style={{ textTransform: "capitalize" }}>{profile.username ? `@${profile.username}` : profile.role}</span>}
          </div>
        </div>
      </div>

      <nav className="sideNav" aria-label="Primary">
        {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={end} className={cls} title={label}>
            <span className="sideIconWrap"><Icon size={18} /></span>
            <span className="sideLinkLabel">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sideFooter">
        <span className="sideFooterText">Owner-only • Double-entry</span>
        <button
          onClick={logout}
          className="sideLink"
          style={{ marginTop: 8, width: "100%", cursor: "pointer", background: "none", border: "var(--stroke)", color: "var(--danger)" }}
          title="Logout"
        >
          <span className="sideIconWrap" style={{ borderColor: "var(--danger)" }}>
            <LogOut size={18} color="var(--danger)" />
          </span>
          <span className="sideLinkLabel">Logout</span>
        </button>
      </div>
    </aside>
  );
}