// src/pages/onboarding/StaffRequest.tsx
import { useMemo, useRef, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import "./roles.css";

type StaffMembershipView = {
  membership_id: string;
  business_id: string;
  business_name: string;
  status: "pending" | "active" | "approved" | "rejected" | "removed" | string;
  requested_at: string;
};

function isApprovedStatus(s: string | null | undefined) {
  // ✅ Your DB uses "active"
  return s === "active" || s === "approved";
}

export default function StaffRequest() {
  const nav = useNavigate();

  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const didRedirect = useRef(false);

  const disabled = useMemo(() => {
    if (!businessName.trim()) return true;
    if (!ownerEmail.trim()) return true;
    if (saving) return true;
    return false;
  }, [businessName, ownerEmail, saving]);

  async function request() {
    if (disabled) return;

    setSaving(true);
    setErr(null);
    setMsg(null);

    const { error } = await supabase.rpc("request_join_business", {
      p_business_name: businessName.trim(),
      p_owner_email: ownerEmail.trim(),
    });

    setSaving(false);

    if (error) {
      setErr(error.message);
      return;
    }

    // ✅ request created -> waiting page
    nav("/onboarding/waiting", { replace: true });
  }

  async function checkStatus() {
    if (checking) return;

    setChecking(true);
    setErr(null);
    setMsg(null);

    const { data, error } = await supabase
      .rpc("get_my_latest_membership_with_business")
      .limit(1);

    setChecking(false);

    if (error) {
      setErr(error.message);
      return;
    }

    const row = (data?.[0] ?? null) as StaffMembershipView | null;

    // ✅ no membership found -> STAY HERE (do NOT redirect)
    if (!row) {
      setErr("No request found yet. Please submit the business name and owner email first.");
      return;
    }

    // ✅ pending -> go waiting (ONLY place we redirect besides /app)
    if (row.status === "pending") {
      setMsg(`Still pending for: ${row.business_name || "Unknown business"}. Redirecting to Waiting…`);
      nav("/onboarding/waiting", { replace: true });
      return;
    }

    // ✅ approved/active -> go /app
    if (isApprovedStatus(row.status)) {
      localStorage.setItem("ob_active_business_id", row.business_id);
      localStorage.setItem("ob_active_business_name", row.business_name);

      setMsg(`Access granted ✅ Welcome to ${row.business_name}`);

      if (!didRedirect.current) {
        didRedirect.current = true;
        nav("/app", { replace: true });
      }
      return;
    }

    // ✅ rejected/removed/anything else -> stay here and show message
    if (row.status === "rejected") {
      setErr("Your request was rejected. Please verify the business name and owner email, then request again.");
      return;
    }

    if (row.status === "removed") {
      setErr("You were removed from the business. Please contact the owner.");
      return;
    }

    setMsg(`Current status: ${row.status}`);
  }

  return (
    <main className="ob-wrap">
      <section className="ob-card" aria-label="Staff request access">
        <header className="ob-header">
          <h1 className="ob-title">Staff Request</h1>
          <p className="ob-sub">
            Enter the <b>Business name</b> and the <b>Owner email</b>. Your owner must approve you.
          </p>
        </header>

        <div className="ob-form">
          <div className="ob-field">
            <label className="ob-label" htmlFor="biz">Business name</label>
            <input
              id="biz"
              className="ob-input"
              placeholder="Exact business name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoComplete="organization"
            />
          </div>

          <div className="ob-field">
            <label className="ob-label" htmlFor="owner">Owner email</label>
            <input
              id="owner"
              className="ob-input"
              placeholder="owner@email.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
            />
            <p className="ob-tip">Must match the email the owner used to register.</p>
          </div>

          {err ? (
            <div className="ob-error" role="alert" aria-live="polite">
              <div className="ob-error-title">Action needed</div>
              <div>{err}</div>
            </div>
          ) : null}

          {msg ? (
            <div className="ob-success" role="status" aria-live="polite">
              <div className="ob-success-title">Status</div>
              <div>{msg}</div>
            </div>
          ) : null}

          <button className="ob-button" disabled={disabled} onClick={request}>
            {saving ? "Sending request…" : "Request Access"}
          </button>

          <button className="ob-button" onClick={checkStatus} disabled={checking || saving}>
            {checking ? "Checking…" : "Check Approval Status"}
          </button>

          <p className="ob-note">
            Once approved, you’ll enter the main system automatically.
          </p>
        </div>
      </section>
    </main>
  );
}