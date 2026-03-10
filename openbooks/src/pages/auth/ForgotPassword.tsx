import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { RESET_PASSWORD_URL } from "../../lib/authRedirect";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/globals.css";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: RESET_PASSWORD_URL,
    });

    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    setSent(true);
    // Supabase will redirect the user to /reset-password after they click the link
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card" aria-label="Forgot password">
        <header className="auth-header">
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-sub">
            Enter your email and we'll send you a reset link.
          </p>
        </header>

        {errorMsg && (
          <div className="auth-alert is-error" role="alert">
            <div className="auth-alert-title">Error</div>
            <div>{errorMsg}</div>
          </div>
        )}

        {sent ? (
          <div className="auth-alert is-success" role="status">
            <div className="auth-alert-title">Check your email!</div>
            <div>A password reset link has been sent. Click it to set a new password.</div>
          </div>
        ) : (
          <form className="auth-form" onSubmit={onSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="fp-email">Email</label>
              <input
                id="fp-email"
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
              />
            </div>

            <button className="auth-button" disabled={!email.trim() || loading}>
              {loading ? "Sending…" : "Send MPIN"}
            </button>
          </form>
        )}

        <div className="auth-note" style={{ marginTop: 12 }}>
          <Link className="auth-link" to="/signin">← Back to Sign in</Link>
        </div>
      </section>
    </main>
  );
}
