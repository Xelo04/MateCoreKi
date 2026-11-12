// ==========================================
// API SERWEROWE: Komunikacja z backendem i pochodzenie żądań
// ==========================================
// API_URL jest konfiguracją serwera, a nie adresem podanym przez przeglądarkę.

export function backendUrl(path: string): string {
  const base = process.env.API_URL;
  if (!base) throw new Error("Brak konfiguracji API_URL.");
  const url = new URL(base);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname))) {
    throw new Error("API_URL musi używać HTTPS (HTTP jest dozwolone tylko lokalnie).");
  }
  if (url.username || url.password || url.search || url.hash) {
    throw new Error("Nieprawidłowa konfiguracja API_URL.");
  }
  return `${base.replace(/\/+$/, "")}${path}`;
}

export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(backendUrl(path), {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
}

// ! Kontrola Origin zakłada poprawną konfigurację nagłówka Host na hostingu i reverse proxy.
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    return parsed.host === host &&
      (parsed.protocol === "https:" ||
        (parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname)));
  } catch {
    // * Niepoprawne pochodzenie jest odrzucane, a nie traktowane jako zaufane.
    return false;
  }
}
