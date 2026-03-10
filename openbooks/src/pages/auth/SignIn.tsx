import { useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "../../styles/globals.css";

export default function SignIn() {
  const nav = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const disabled = useMemo(
    () => !email.trim() || !password || loading,
    [email, password, loading]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1) Attempt sign-in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // if they never signed up OR password wrong
        setErrorMsg("Invalid email or password.");
        return;
      }

      const user = data.user ?? data.session?.user;
      if (!user) {
        setErrorMsg("Sign in failed. Please try again.");
        return;
      }

      // 2) If email not verified (magic link confirm pending)
      if (!user.email_confirmed_at) {
        setErrorMsg("Check your Gmail verification link, then sign in again.");
        // optional: keep them signed out for clean flow
        await supabase.auth.signOut();
        return;
      }
      
// inside onSubmit AFTER email_confirmed_at check

const uid = user.id;

// 3) Load profile INCLUDING role
const { data: profile, error: pErr } = await supabase
  .from("profiles")
  .select("id, role, full_name, phone_number, birthdate, sex")
  .eq("id", uid)
  .maybeSingle();

if (pErr) {
  setErrorMsg(pErr.message);
  return;
}

if (!profile) {
  nav("/onboarding/profile-setup", { replace: true });
  return;
}

/* =========================
   🔵 ADMIN ROUTE
========================= */
if (profile.role === "admin") {
  nav("/app/admin", { replace: true });
  return;
}

/* =========================
   🟢 OWNER FLOW
========================= */

const profileIncomplete =
  !profile.full_name ||
  !profile.sex ||
  !profile.birthdate ||
  !profile.phone_number;

if (profileIncomplete) {
  nav("/onboarding/profile-setup", { replace: true });
  return;
}

// Business check (owner only)
const { data: biz, error: bErr } = await supabase
  .from("businesses")
  .select("id")
  .eq("owner_user_id", uid)
  .maybeSingle();

if (bErr) {
  setErrorMsg(bErr.message);
  return;
}

if (!biz) {
  nav("/onboarding/business-setup", { replace: true });
  return;
}

// Final enter app
nav("/app", { replace: true });
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card" aria-label="Sign in">
        <header className="auth-header">
          <h1 className="auth-title">Sign in</h1>
          <p className="auth-sub">Use your verified email to continue.</p>
        </header>

        {errorMsg ? (
          <div className="auth-alert is-error" role="alert" aria-live="polite">
            <div className="auth-alert-title">Sign in</div>
            <div>{errorMsg}</div>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="auth-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="pw">Password</label>
            <div className="auth-input-wrap">
              <input
                id="pw"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
          </div>

          <button className="auth-button" disabled={disabled}>
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div className="auth-note">            <Link className="auth-link" to="/forgot-password">Forgot password?</Link>
          </div>

          <div className="auth-note">            Don’t have an account?{" "}
            <Link className="auth-link" to="/signup">Create one</Link>
          </div>
        </form>
      </section>
    </main>
  );
}
