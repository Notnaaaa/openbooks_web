// src/pages/auth/AuthCallback.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallback() {
  const nav = useNavigate();
  const [msg, setMsg] = useState("Signing you in…");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // ✅ Most important: convert the URL "code" into a real session
        const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

        if (cancelled) return;

        if (error) {
          setMsg("Verification link expired or invalid. Please sign in again.");
          // slight delay so user can read message
          setTimeout(() => nav("/signin", { replace: true }), 900);
          return;
        }

        // ✅ Now session should exist
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          nav("/app", { replace: true });
        } else {
          nav("/signin", { replace: true });
        }
      } catch (e) {
        if (cancelled) return;
        setMsg("Something went wrong verifying your email. Please try again.");
        setTimeout(() => nav("/signin", { replace: true }), 900);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nav]);

  return (
    <div className="page">
      <h1 className="h1">{msg}</h1>
      <p className="muted">Please wait.</p>
    </div>
  );
}