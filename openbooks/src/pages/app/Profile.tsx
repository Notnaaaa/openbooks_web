import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthProvider";
import { supabase } from "../../lib/supabase";
import "../../styles/globals.css";

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "Not set";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function toTitleCase(value: string | null | undefined) {
  return (value ?? "")
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Profile() {
  const { profile, session, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [showPwSection, setShowPwSection] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const pwCriteria = [
    { label: "At least 8 characters", met: newPw.length >= 8 },
    { label: "Uppercase letter (A–Z)", met: /[A-Z]/.test(newPw) },
    { label: "Lowercase letter (a–z)", met: /[a-z]/.test(newPw) },
    { label: "Number (0–9)", met: /[0-9]/.test(newPw) },
    { label: "Special character (!@#…)", met: /[^A-Za-z0-9]/.test(newPw) },
  ];
  const pwStrength = pwCriteria.filter((criterion) => criterion.met).length;

  useEffect(() => {
    if (!profile) return;
    const parts = (profile.full_name ?? "").trim().split(/\s+/);
    setFirstName(parts.length >= 2 ? parts[0] : (parts[0] ?? ""));
    setMiddleName(parts.length >= 3 ? parts.slice(1, -1).join(" ") : "");
    setLastName(parts.length >= 2 ? parts[parts.length - 1] : "");
    setPhone(profile.phone_number ?? "");
    setBirthdate(profile.birthdate ?? "");
    setSex(profile.sex ?? "");
  }, [profile]);

  if (!profile) return <div className="profile-loading">Loading…</div>;

  const fullName = [firstName.trim(), middleName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase())
    .slice(0, 2)
    .join("");

  const email = session?.user?.email ?? "—";
  const memberSince = formatTimestamp(profile.created_at);
  const lastUpdated = formatTimestamp(profile.updated_at);
  const displayRole = toTitleCase(profile.role) || "User";
  const birthdateDisplay = formatDateOnly(birthdate);
  const sexDisplay = toTitleCase(sex) || "Not set";
  const profileCompletion = Math.round(
    ([firstName, lastName, phone, birthdate, sex].filter((value) => value.trim().length > 0).length / 5) * 100
  );

  async function save() {
    if (!profile) return;
    setSaving(true);
    setSaveMsg("");
    const id = (profile as any).id ?? (profile as any).user_id;
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone_number: phone || null,
        birthdate: birthdate || null,
        sex: sex || null,
      })
      .eq("id", id);
    setSaving(false);
    if (error) return setSaveMsg("Error: " + error.message);
    await refreshProfile();
    setSaveMsg("Profile saved successfully!");
    setTimeout(() => setSaveMsg(""), 3000);
  }

  async function changePassword() {
    if (!newPw || !confirmPw) return setPwMsg("Please fill in all fields.");
    if (newPw !== confirmPw) return setPwMsg("Passwords do not match.");
    if (newPw.length < 8) return setPwMsg("Password must be at least 8 characters.");

    setPwSaving(true);
    setPwMsg("");
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);

    if (error) return setPwMsg("Error: " + error.message);

    setPwMsg("Password updated successfully!");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => {
      setPwMsg("");
      setShowPwSection(false);
    }, 3000);
  }

  return (
    <div className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-main">
          <div className="profile-hero-avatar">{initials || "?"}</div>

          <div className="profile-hero-copy">
            <div className="profile-hero-kicker">Personal workspace</div>
            <h1 className="profile-hero-name">{fullName || "Complete your profile"}</h1>
            <p className="profile-hero-subtitle">
              Keep your account details accurate for activity, records, and personalized access.
            </p>

            <div className="profile-hero-meta">
              <span className="profile-badge">{displayRole}</span>
              {profile.username ? <span className="profile-hero-chip">@{profile.username}</span> : null}
              <span className="profile-hero-chip">{email}</span>
            </div>
          </div>
        </div>

        <div className="profile-hero-side">
          <div className="profile-progress-labels">
            <span>Profile completion</span>
            <strong>{profileCompletion}%</strong>
          </div>

          <div className="profile-progress">
            <span style={{ width: `${profileCompletion}%` }} />
          </div>

          <div className="profile-hero-notes">
            <div className="profile-hero-note">
              <span>Member since</span>
              <strong>{memberSince}</strong>
            </div>

            <div className="profile-hero-note">
              <span>Last updated</span>
              <strong>{lastUpdated}</strong>
            </div>
          </div>
        </div>
      </section>

      <div className="profile-grid">
        <div className="profile-main">
          <section className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <h2 className="profile-surface-title">Personal information</h2>
                <p className="profile-surface-subtitle">
                  Update the details used across your account and business workspace.
                </p>
              </div>

              <span className="profile-surface-badge">
                {profileCompletion === 100 ? "Complete" : "In progress"}
              </span>
            </div>

            <div className="profile-form">
              <div className="profile-two-col">
                <div className="profile-field-group">
                  <label className="profile-label">First name</label>
                  <input
                    className="profile-input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Last name</label>
                  <input
                    className="profile-input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div className="profile-field-group">
                <label className="profile-label">
                  Middle name <span className="profile-label-optional">(optional)</span>
                </label>
                <input
                  className="profile-input"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Leave blank if none"
                />
              </div>

              <div className="profile-field-group">
                <label className="profile-label">Phone number</label>
                <input
                  className="profile-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>

              <div className="profile-two-col">
                <div className="profile-field-group">
                  <label className="profile-label">Birthdate</label>
                  <input
                    className="profile-input"
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                  />
                </div>

                <div className="profile-field-group">
                  <label className="profile-label">Sex</label>
                  <select
                    className="profile-input profile-select"
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="profile-form-footer">
                {saveMsg ? (
                  <div className={`profile-msg ${saveMsg.startsWith("Error") ? "profile-msg-error" : "profile-msg-success"}`}>
                    {saveMsg}
                  </div>
                ) : null}

                <button type="button" className="profile-btn" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </section>

          <section className="profile-surface">
            <div className="profile-surface-head">
              <div>
                <h2 className="profile-surface-title">Security</h2>
                <p className="profile-surface-subtitle">
                  Update your password and keep access to your account protected.
                </p>
              </div>
            </div>

            <div className="profile-form">
              <button
                type="button"
                className="profile-btn-outline"
                onClick={() => setShowPwSection((value) => !value)}
              >
                {showPwSection ? "Cancel" : "Change password"}
              </button>

              {showPwSection ? (
                <>
                  <div className="profile-field-group">
                    <label className="profile-label">New password</label>
                    <div className="profile-pw-wrap">
                      <input
                        className="profile-input profile-pw-input"
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="Min. 8 characters"
                      />
                      <button
                        type="button"
                        className="profile-pw-toggle"
                        onClick={() => setShowNewPw((value) => !value)}
                        aria-label={showNewPw ? "Hide password" : "Show password"}
                      >
                        {showNewPw ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {newPw.length > 0 ? (
                      <div className="profile-pw-strength">
                        <div className="profile-pw-bar-track">
                          {[0, 1, 2, 3, 4].map((index) => (
                            <div
                              key={index}
                              className={`profile-pw-bar-seg ${
                                index < pwStrength
                                  ? pwStrength <= 2
                                    ? "pw-weak"
                                    : pwStrength <= 3
                                      ? "pw-fair"
                                      : pwStrength <= 4
                                        ? "pw-good"
                                        : "pw-strong"
                                  : ""
                              }`}
                            />
                          ))}
                        </div>

                        <span className="profile-pw-strength-label">
                          {pwStrength <= 2 ? "Weak" : pwStrength === 3 ? "Fair" : pwStrength === 4 ? "Good" : "Strong"}
                        </span>
                      </div>
                    ) : null}

                    {newPw.length > 0 ? (
                      <ul className="profile-pw-criteria">
                        {pwCriteria.map((criterion) => (
                          <li key={criterion.label} className={criterion.met ? "pw-crit-met" : "pw-crit-unmet"}>
                            <span className="pw-crit-icon">{criterion.met ? "✓" : "✗"}</span>
                            {criterion.label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div className="profile-field-group">
                    <label className="profile-label">Confirm new password</label>
                    <div className="profile-pw-wrap">
                      <input
                        className="profile-input profile-pw-input"
                        type={showConfirmPw ? "text" : "password"}
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Re-enter your password"
                      />
                      <button
                        type="button"
                        className="profile-pw-toggle"
                        onClick={() => setShowConfirmPw((value) => !value)}
                        aria-label={showConfirmPw ? "Hide password" : "Show password"}
                      >
                        {showConfirmPw ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                    </div>

                    {confirmPw.length > 0 ? (
                      <div className={`profile-pw-match ${confirmPw === newPw ? "pw-match-ok" : "pw-match-no"}`}>
                        {confirmPw === newPw ? "✓ Passwords match" : "✗ Passwords do not match"}
                      </div>
                    ) : null}
                  </div>

                  {pwMsg ? (
                    <div className={`profile-msg ${pwMsg.startsWith("Error") || pwMsg.includes("match") || pwMsg.includes("8") ? "profile-msg-error" : "profile-msg-success"}`}>
                      {pwMsg}
                    </div>
                  ) : null}

                  <button type="button" className="profile-btn" onClick={changePassword} disabled={pwSaving}>
                    {pwSaving ? "Updating…" : "Update password"}
                  </button>
                </>
              ) : null}
            </div>
          </section>
        </div>

        <aside className="profile-sidebar">
          <section className="profile-side-card">
            <h3 className="profile-side-card-title">Account details</h3>

            <div className="profile-detail-list">
              <div className="profile-detail-row">
                <span className="profile-detail-label">Email</span>
                <strong className="profile-detail-value">{email}</strong>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Role</span>
                <strong className="profile-detail-value">{displayRole}</strong>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Member since</span>
                <strong className="profile-detail-value">{memberSince}</strong>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Last updated</span>
                <strong className="profile-detail-value">{lastUpdated}</strong>
              </div>

              <div className="profile-detail-row">
                <span className="profile-detail-label">Status</span>
                <strong className="profile-detail-value">
                  {profileCompletion === 100 ? "Profile complete" : "Needs attention"}
                </strong>
              </div>
            </div>
          </section>

          <section className="profile-side-card">
            <h3 className="profile-side-card-title">Quick summary</h3>

            <div className="profile-summary-grid">
              <div className="profile-summary-item">
                <span className="profile-summary-label">Phone</span>
                <strong className="profile-summary-value">{phone.trim() || "Not set"}</strong>
              </div>

              <div className="profile-summary-item">
                <span className="profile-summary-label">Birthdate</span>
                <strong className="profile-summary-value">{birthdateDisplay}</strong>
              </div>

              <div className="profile-summary-item">
                <span className="profile-summary-label">Sex</span>
                <strong className="profile-summary-value">{sexDisplay}</strong>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
