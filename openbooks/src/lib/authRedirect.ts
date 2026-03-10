const configuredSiteUrl = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();

export const SITE_URL = (configuredSiteUrl || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173"))
  .replace(/\/+$/, "");

export const AUTH_CALLBACK_URL   = `${SITE_URL}/auth/callback`;
export const RESET_PASSWORD_URL  = `${SITE_URL}/reset-password`;
export const FORGOT_PASSWORD_URL = `${SITE_URL}/forgot-password`;
