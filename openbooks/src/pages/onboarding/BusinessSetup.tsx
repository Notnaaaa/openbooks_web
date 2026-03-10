import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBusiness } from "../../context/BusinessProvider";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";
import "../../styles/globals.css";
export default function BusinessSetup() {
  const nav = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { business, loading: bizLoading, refresh } = useBusiness();

  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (business?.id) {
      setName(business.name ?? "");
    }
  }, [business?.id]);

  const disabled = useMemo(() => {
    if (authLoading || bizLoading) return true;
    if (!profile?.id) return true;
    if (!name.trim()) return true;
    if (busy) return true;
    return false;
  }, [authLoading, bizLoading, profile?.id, name, busy]);

  async function save() {
    if (disabled) return;

    setBusy(true);
    setMsg(null);

    try {
      if (business?.id) {
        const { error } = await supabase
          .from("businesses")
          .update({ name: name.trim() })
          .eq("id", business.id);

        if (error) {
          setMsg(error.message);
          return;
        }
      } else {
        const { error } = await supabase.from("businesses").insert({
          name: name.trim(),
          owner_user_id: profile!.id,
        });

        if (error) {
          setMsg(error.message);
          return;
        }
      }

      await refresh();
      nav("/app", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="biz-wrap">
      <section className="biz-card" aria-label="Business setup">
        <header className="biz-header">
          <h1 className="biz-title">Set up your business</h1>
          <p className="biz-sub">
            Create your business profile to access the accounting dashboard.
          </p>
        </header>

        {msg && (
          <div className="biz-alert" role="status" aria-live="polite">
            {msg}
          </div>
        )}

        <div className="biz-field">
          <label className="biz-label" htmlFor="bizname">
            Business Name
          </label>
          <input
            id="bizname"
            className="biz-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. OpenBooks Trading"
            autoComplete="organization"
          />
        </div>

        <button
          className="biz-button"
          onClick={save}
          disabled={disabled}
        >
          {busy ? "Saving…" : "Save & Continue"}
        </button>
      </section>
    </main>
  );
}