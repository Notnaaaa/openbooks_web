// src/pages/onboarding/ProfileSetup.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthProvider";
import "../../styles/globals.css";

type SexOption = "Male" | "Female" | "Prefer not to say" | "Custom";

function isValidDateStr(v: string) {
  // expects YYYY-MM-DD from <input type="date">
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export default function ProfileSetup() {
  const nav = useNavigate();
  const { profile, loading, refreshProfile } = useAuth();

  // Split stored full_name into parts on load
  const nameParts = (profile?.full_name ?? "").trim().split(/\s+/);
  const [firstName,  setFirstName]  = useState(nameParts.length >= 2 ? nameParts[0] : (nameParts[0] ?? ""));
  const [middleName, setMiddleName] = useState(nameParts.length >= 3 ? nameParts.slice(1, -1).join(" ") : "");
  const [lastName,   setLastName]   = useState(nameParts.length >= 2 ? nameParts[nameParts.length - 1] : "");
  const [sex, setSex] = useState<SexOption>(
    (profile?.sex as SexOption) || "Prefer not to say"
  );
  const [customSex, setCustomSex] = useState("");
  const [phone, setPhone] = useState(profile?.phone_number ?? "");
  const [birthdate, setBirthdate] = useState(
    profile?.birthdate ? String(profile.birthdate) : ""
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const errors = useMemo(() => {
    const e: Record<string, string> = {};

    if (!firstName.trim()) e.firstName = "First name is required.";
    if (!lastName.trim())  e.lastName  = "Last name is required.";

    if (!birthdate) e.birthdate = "Birthdate is required.";
    else if (!isValidDateStr(birthdate)) e.birthdate = "Use a valid date.";

    // phone is optional in your SQL, but you can require it if you want:
    if (phone && phone.trim().length < 7) e.phone = "Enter a valid phone number.";

    if (sex === "Custom" && !customSex.trim()) e.sex = "Please enter your custom sex value.";

    return e;
  }, [firstName, lastName, birthdate, phone, sex, customSex]);

  const disabled = useMemo(() => {
    if (loading) return true;
    if (!profile) return true;
    if (saving) return true;
    return Object.keys(errors).length > 0;
  }, [loading, profile, saving, errors]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    setSaving(true);
    setErrorMsg(null);

    const sexValue = sex === "Custom" ? customSex.trim() : sex;
    const fullName = [firstName.trim(), middleName.trim(), lastName.trim()]
      .filter(Boolean).join(" ");

    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      setSaving(false);
      setErrorMsg("Not signed in. Please sign in again.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        sex: sexValue,
        phone_number: phone.trim() || null,
        birthdate: birthdate, // YYYY-MM-DD
        updated_at: new Date().toISOString(),
      })
      .eq("id", uid);

    setSaving(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    await refreshProfile();
    nav("/onboarding/business-setup", { replace: true });
  }

  if (loading || !profile) {
    return (
      <main className="auth-wrap">
        <section className="auth-card">
          <header className="auth-header">
            <h1 className="auth-title">Loading…</h1>
            <p className="auth-sub">Preparing profile setup.</p>
          </header>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-wrap">
      <section className="auth-card" aria-label="Profile setup">
        <header className="auth-header">
          <h1 className="auth-title">Complete your profile</h1>
          <p className="auth-sub">
            This helps personalize your accounting workspace. You can edit this later in Profile.
          </p>
        </header>

        {errorMsg ? (
          <div className="auth-alert is-error" role="alert" aria-live="polite">
            <div className="auth-alert-title">Could not save profile</div>
            <div>{errorMsg}</div>
          </div>
        ) : null}

        <form className="auth-form" onSubmit={save} noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="firstName">First name</label>
            <input
              id="firstName"
              className={`auth-input ${errors.firstName ? "is-invalid" : ""}`}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              aria-invalid={!!errors.firstName}
            />
            {errors.firstName ? <div className="auth-err">{errors.firstName}</div> : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="middleName">Middle name <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional)</span></label>
            <input
              id="middleName"
              className="auth-input"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              autoComplete="additional-name"
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              className={`auth-input ${errors.lastName ? "is-invalid" : ""}`}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              autoComplete="family-name"
              aria-invalid={!!errors.lastName}
            />
            {errors.lastName ? <div className="auth-err">{errors.lastName}</div> : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="birthdate">Birthdate</label>
            <input
              id="birthdate"
              type="date"
              className={`auth-input ${errors.birthdate ? "is-invalid" : ""}`}
              value={birthdate}
              onChange={(e) => setBirthdate(e.target.value)}
              aria-invalid={!!errors.birthdate}
            />
            {errors.birthdate ? <div className="auth-err">{errors.birthdate}</div> : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="sex">Sex</label>
            <select
              id="sex"
              className={`auth-input ${errors.sex ? "is-invalid" : ""}`}
              value={sex}
              onChange={(e) => setSex(e.target.value as SexOption)}
              aria-invalid={!!errors.sex}
            >
              <option>Male</option>
              <option>Female</option>
              <option>Prefer not to say</option>
              <option>Custom</option>
            </select>

            {sex === "Custom" ? (
              <input
                className={`auth-input ${errors.sex ? "is-invalid" : ""}`}
                placeholder="Enter custom value"
                value={customSex}
                onChange={(e) => setCustomSex(e.target.value)}
                aria-invalid={!!errors.sex}
              />
            ) : null}

            {errors.sex ? <div className="auth-err">{errors.sex}</div> : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="phone">Phone number (optional)</label>
            <input
              id="phone"
              className={`auth-input ${errors.phone ? "is-invalid" : ""}`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={!!errors.phone}
            />
            {errors.phone ? <div className="auth-err">{errors.phone}</div> : null}
          </div>

          <button className="auth-button" disabled={disabled}>
            {saving ? "Saving…" : "Save & Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
