/**
 * Canonical app origin for auth redirects (signup confirmation, etc.).
 * Set NEXT_PUBLIC_APP_URL in production so emails never point at localhost.
 */
export function getAppOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:3000";
}

export function getAuthCallbackUrl(): string {
  return `${getAppOrigin()}/auth/callback`;
}
