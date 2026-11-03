import { readClaims } from "@/shared/session/claims";

const STORAGE_KEY = "dn.session";

export type Session = {
  token: string;
  email: string;
  expiresAt: number;
};

const listeners = new Set<() => void>();

let session: Session | null = null;
let loaded = false;
let listening = false;
let expiryTimer: ReturnType<typeof setTimeout> | null = null;

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): Session | null {
  ensureLoaded();
  return session;
}

export function getServerSnapshot(): null {
  return null;
}

export function getToken(): string | null {
  return getSnapshot()?.token ?? null;
}

export function setSession(token: string): void {
  const claims = readClaims(token);
  if (!claims || claims.exp * 1000 <= Date.now()) {
    throw new Error("The access token is missing a valid expiry.");
  }
  const next: Session = {
    token,
    email: claims.email,
    expiresAt: claims.exp * 1000,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token }));
  session = next;
  loaded = true;
  ensureListening();
  armExpiry();
  emit();
}

export function clearSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
  session = null;
  loaded = true;
  ensureListening();
  clearExpiry();
  emit();
}

function ensureLoaded(): void {
  if (loaded) {
    return;
  }
  loaded = true;
  if (typeof window === "undefined") {
    return;
  }
  session = readStoredSession();
  armExpiry();
  ensureListening();
}

function ensureListening(): void {
  if (typeof window === "undefined" || listening) {
    return;
  }
  window.addEventListener("storage", onStorage);
  listening = true;
}

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  if (!isTokenRecord(parsed)) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  const claims = readClaims(parsed.token);
  if (!claims || claims.exp * 1000 <= Date.now()) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
  return {
    token: parsed.token,
    email: claims.email,
    expiresAt: claims.exp * 1000,
  };
}

function onStorage(event: StorageEvent): void {
  if (event.key !== STORAGE_KEY) {
    return;
  }
  session = readStoredSession();
  armExpiry();
  emit();
}

function armExpiry(): void {
  clearExpiry();
  if (!session) {
    return;
  }
  const delay = session.expiresAt - Date.now();
  if (delay <= 0) {
    clearSession();
    return;
  }
  expiryTimer = setTimeout(() => {
    clearSession();
  }, delay);
}

function clearExpiry(): void {
  if (expiryTimer !== null) {
    clearTimeout(expiryTimer);
    expiryTimer = null;
  }
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

function isTokenRecord(value: unknown): value is { token: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "token" in value &&
    typeof value.token === "string"
  );
}
