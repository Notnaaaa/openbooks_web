// src/pages/auth/SignUp.tsx
import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { AUTH_CALLBACK_URL } from "../../lib/authRedirect";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../../styles/globals.css";

function isEmailValid(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

const PW_RULES = [
  { label: "At least 8 characters",       test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter (A–Z)",  test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a–z)",  test: (p: string) => /[a-z]/.test(p) },
  { label: "One number (0–9)",            test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#…)",test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const STRENGTH_LABEL = ["", "Very Weak", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["#e5e7eb", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

export default function SignUp() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  // Live password rule checks
  const pwRules = PW_RULES.map((r) => ({ label: r.label, pass: r.test(pw) }));
  const passedCount = pwRules.filter((r) => r.pass).length;
  const allRulesPassed = passedCount === PW_RULES.length;
  const strengthColor = STRENGTH_COLOR[passedCount];
  const strengthLabel = STRENGTH_LABEL[passedCount];

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const em = email.trim();

    if (!em) e.email = "Email is required.";
    else if (!isEmailValid(em)) e.email = "Enter a valid email address.";

    if (!pw) e.pw = "Password is required.";
    else if (!allRulesPassed) e.pw = "Password does not meet all requirements.";

    if (!confirm) e.confirm = "Confirm your password.";
    else if (pw && confirm !== pw) e.confirm = "Passwords do not match.";

    if (!terms) e.terms = "You must accept the terms to continue.";

    return e;
  }, [email, pw, confirm, terms, allRulesPassed]);

  const disabled = useMemo(() => {
    if (submitting) return true;
    return false;
  }, [submitting]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    if (submitting) return;

    setSubmitting(true);
    setErrorMsg(null);
    setOkMsg(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pw,
        options: {
          // if email confirmation is enabled, Supabase will send the confirm email
          emailRedirectTo: AUTH_CALLBACK_URL,
        },
      });

      if (error) {
        // avoid revealing account existence too much
        setErrorMsg("Could not create account. Please try again.");
        return;
      }

      // ✅ IMPORTANT:
      // profiles row is created by SQL trigger (handle_new_user) — no insert here.

      // If email confirmation is ON, session is usually null
      if (!data.session) {
        setOkMsg(
          "Account created! Please check your email to verify, then sign in."
        );
        // send them to sign in (quick + clear)
        nav("/signin", { replace: true });
        return;
      }

      // If email confirmation is OFF, user is already signed in
      setOkMsg("Account created! Redirecting to business setup…");
      nav("/onboarding/business-setup", { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card" aria-label="Create account">
        <header className="auth-header">
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-sub">
            Use your email and password. We’ll send a verification link if required.
          </p>
        </header>

        {errorMsg ? (
          <div className="auth-alert is-error" role="alert" aria-live="polite">
            <div className="auth-alert-title">Sign up failed</div>
            <div>{errorMsg}</div>
          </div>
        ) : null}

        {okMsg ? (
          <div className="auth-alert is-ok" role="status" aria-live="polite">
            <div className="auth-alert-title">Success</div>
            <div>{okMsg}</div>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              className={`auth-input ${submitted && errors.email ? "is-invalid" : ""}`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-err" : undefined}
              placeholder="you@example.com"
            />
            {submitted && errors.email ? (
              <div className="auth-err" id="email-err">
                {errors.email}
              </div>
            ) : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="pw">
              Password
            </label>
            <div className="auth-input-wrap">
              <input
                id="pw"
                className={`auth-input ${submitted && errors.pw ? "is-invalid" : ""}`}
                type={showPw ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.pw}
                placeholder="Create a password"
              />
              <button
                type="button"
                className="auth-input-eye"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Strength bar */}
            {pw.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div className="pw-strength-bar">
                  {PW_RULES.map((_, i) => (
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
            {pw.length > 0 && (
              <ul className="pw-rules">
                {pwRules.map((r) => (
                  <li key={r.label} className={`pw-rule ${r.pass ? "pass" : "fail"}`}>
                    {r.pass ? "✓" : "✗"} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">
              Confirm password
            </label>
            <div className="auth-input-wrap">
              <input
                id="confirm"
                className={`auth-input ${submitted && errors.confirm ? "is-invalid" : ""}`}
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                aria-invalid={!!errors.confirm}
                placeholder="Repeat your password"
              />
              <button
                type="button"
                className="auth-input-eye"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirm && pw !== confirm && (
              <p className="auth-field-error">Passwords do not match.</p>
            )}
          </div>

          <div className="auth-check">
            <label className="auth-checkline">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
              />
              <span>
                I accept the <strong>Terms and Conditions</strong>
              </span>
            </label>
            {submitted && errors.terms ? (
              <div className="auth-err" id="terms-err">
                {errors.terms}
              </div>
            ) : null}
          </div>

          <button className="auth-btn" disabled={disabled}>
            {submitting ? "Creating…" : "Create Account"}
          </button>
        </form>
      </section>
    </main>
  );
}