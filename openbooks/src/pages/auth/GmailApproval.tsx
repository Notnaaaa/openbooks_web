// src/pages/auth/GmailApproval.tsx
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function GmailApproval() {
  const nav = useNavigate();
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkApproval() {
    setChecking(true);
    setError(null);

    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      nav("/signin", { replace: true });
      return;
    }

    // ✅ Supabase email confirmation check
    if (!user.email_confirmed_at) {
      setError("Your email is not verified yet. Please check your Gmail.");
      setChecking(false);
      return;
    }

    nav("/auth/callback", { replace: true });
  }

  return (
    <div className="signin-wrapper">
      <div className="signin-card">
        <h2 className="signin-title">Email Approval Required</h2>
        <p className="signin-sub">
          We sent a confirmation email to your Gmail. Please click the confirmation link to continue.
        </p>

        {error && (
          <div className="signin-error">
            {error}
          </div>
        )}

        <button
          className="signin-button"
          onClick={checkApproval}
          disabled={checking}
        >
          {checking ? "Checking..." : "I Already Approved"}
        </button>
      </div>
    </div>
  );
}