import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { FORGOT_PASSWORD_URL } from "../../lib/authRedirect";
import "../../styles/globals.css";

export default function ResetPassword() {
  const nav = useNavigate();

  const [ready, setReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password rules
  const rules = [
    { label: "At least 8 characters",      pass: password.length >= 8 },
    { label: "One uppercase letter (A–Z)",  pass: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a–z)",  pass: /[a-z]/.test(password) },
    { label: "One number (0–9)",            pass: /[0-9]/.test(password) },
    { label: "One special character (!@#…)",pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const passedCount = rules.filter((r) => r.pass).length;
  const strengthLabel = ["Very Weak", "Weak", "Fair", "Good", "Strong"][passedCount - 1] ?? "";
  const strengthColor = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"][passedCount - 1] ?? "#e5e7eb";
  const allRulesPassed = passedCount === rules.length;

  // Supabase sends either:
  //   ?token_hash=xxx&type=recovery  (PKCE flow)
  //   #access_token=xxx&type=recovery (implicit flow)
  useEffect(() => {
    async function consumeToken() {
      const params = new URLSearchParams(window.location.search);
      const hashStr = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
      const hashParams = new URLSearchParams(hashStr);

      const tokenHash = params.get("token_hash");
      const type = (params.get("type") ?? hashParams.get("type")) as "recovery" | null;
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) { setTokenError("This reset link is invalid or has expired."); return; }
        setReady(true);
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) { setTokenError("This reset link is invalid or has expired."); return; }
        setReady(true);
      } else {
        setTokenError("No reset token found. Please request a new password reset link.");
      }
    }
    consumeToken();
  }, []);

  const disabled = !allRulesPassed || password !== confirmPassword || loading;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    setLoading(true);
    setErrorMsg(null);

    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (error) { setErrorMsg(error.message); return; }

    setSuccess(true);
    setTimeout(() => nav("/signin", { replace: true }), 2500);
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card" aria-label="Reset password">
        <header className="auth-header">
          <h1 className="auth-title">Reset Password</h1>
          <p className="auth-sub">Choose a new password for your account.</p>
        </header>

        {tokenError ? (
          <>
            <div className="auth-alert is-error" role="alert">
              <div className="auth-alert-title">Invalid link</div>
              <div>{tokenError}</div>
            </div>
            <div className="auth-note" style={{ marginTop: 12 }}>
              <a className="auth-link" href={FORGOT_PASSWORD_URL}>Request a new link</a>
            </div>
          </>
        ) : !ready ? (
          <p className="muted">Verifying your reset link…</p>
        ) : success ? (
          <div className="auth-alert is-success" role="status">
            <div className="auth-alert-title">Password updated!</div>
            <div>Your password has been reset. Redirecting to sign in…</div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="auth-alert is-error" role="alert">
                <div className="auth-alert-title">Error</div>
                <div>{errorMsg}</div>
              </div>
            )}

            <form className="auth-form" onSubmit={onSubmit} noValidate>
              <div className="auth-field">
                <label className="auth-label" htmlFor="rp-pw">New Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="rp-pw"
                    className="auth-input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-input-eye"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div style={{ marginTop: 6 }}>
                    <div className="pw-strength-bar">
                      {rules.map((_, i) => (
                        <div
                          key={i}
                          className="pw-strength-seg"
                          style={{ background: i < passedCount ? strengthColor : undefined }}
                        />
                      ))}
                    </div>
                    <p className="pw-strength-label" style={{ color: strengthColor }}>{strengthLabel}</p>
                  </div>
                )}

                {/* Rules checklist */}
                {password.length > 0 && (
                  <ul className="pw-rules">
                    {rules.map((r) => (
                      <li key={r.label} className={`pw-rule ${r.pass ? "pass" : "fail"}`}>
                        {r.pass ? "✓" : "✗"} {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="rp-confirm">Confirm Password</label>
                <div className="auth-input-wrap">
                  <input
                    id="rp-confirm"
                    className="auth-input"
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="auth-input-eye"
                    onClick={() => setShowConfirm((s) => !s)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="auth-field-error">Passwords do not match.</p>
                )}
              </div>

              <button className="auth-button" disabled={disabled}>
                {loading ? "Resetting…" : "Reset Password"}
              </button>
            </form>

            <div className="auth-note" style={{ marginTop: 12 }}>
              <Link className="auth-link" to="/signin">← Back to Sign in</Link>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
