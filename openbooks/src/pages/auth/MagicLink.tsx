import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { AUTH_CALLBACK_URL } from "../../lib/authRedirect";

export default function MagicLink() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const disabled = !email.trim() || busy;

  async function send() {
    if (disabled) return;
    setBusy(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: AUTH_CALLBACK_URL,
      },
    });

    setBusy(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Magic link sent. Check your email.");
  }

  return (
    <div className="authWrap">
      <div className="authCard" aria-label="Magic link sign in">
        <h1 className="h1">Magic Link</h1>
        <p className="muted">We’ll send you a secure sign-in link.</p>

        <label className="labelBlock" htmlFor="email">Email</label>
        <input
          id="email"
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          inputMode="email"
          autoComplete="email"
        />

        {msg ? <div className="infoBox" role="status" aria-live="polite">{msg}</div> : null}

        <button className="btn" disabled={disabled} onClick={send}>
          {busy ? "Sending…" : "Send Magic Link"}
        </button>
      </div>
    </div>
  );
}