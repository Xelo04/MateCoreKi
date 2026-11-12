// ==========================================
// KLIENT API: Żądania przeglądarki do serwera Next.js
// ==========================================
// Serwisy podają ścieżki i dane; token pozostaje w ciasteczku HttpOnly.

import { ApiError, defaultMessageForStatus } from "@/lib/api/api-errors";
import { useSessionStore } from "@/store/use-session-store";

interface RequestOptions {
  body?: object;
  headers?: Record<string, string>;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (Array.isArray(record.detail) && record.detail.length > 0) {
    const first: unknown = record.detail[0];
    if (typeof first === "object" && first !== null && "msg" in first && typeof first.msg === "string") {
      return first.msg;
    }
  }
  return null;
}

function errorCode(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("code" in payload)) return null;
  return typeof payload.code === "string" ? payload.code : null;
}

async function request<TResponse>(
  prefix: "/api/backend" | "/api/auth",
  method: Method,
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const pathname = path.split("?", 1)[0];
  if (!/^\/[a-zA-Z0-9_/-]+$/.test(pathname) || pathname.includes("//") || path.includes("#")) {
    throw new Error("Nieprawidłowa ścieżka API.");
  }
  const localPath = `${pathname.endsWith("/") ? pathname.slice(0, -1) : pathname}${path.slice(pathname.length)}`;
  const headers = new Headers(options.headers);
  let body: string | undefined;
  if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${prefix}${localPath}`, { method, headers, body, cache: "no-store" });
  } catch (networkError) {
    throw new ApiError(defaultMessageForStatus(0), 0, networkError);
  }

  const text = await response.text();
  let payload: unknown = text || undefined;
  if (text && response.headers.get("Content-Type")?.includes("application/json")) {
    try {
      payload = JSON.parse(text);
    } catch (err) {
      if (response.ok) throw new ApiError("Nieprawidłowa odpowiedź serwera.", 502, err);
      payload = undefined;
    }
  }

  if (!response.ok) {
    if (typeof window !== "undefined") {
      // ! 401 logowania oznacza błędne dane, a nie wygasłą sesję.
      const requiresSession = prefix === "/api/backend" ||
        (prefix === "/api/auth" && method === "POST" && pathname === "/change-password");
      if (requiresSession && response.status === 401) {
        useSessionStore.getState().clearSession();
        const redirect = window.location.pathname + window.location.search;
        // Pełne przeładowanie usuwa z pamięci routera poprzednie prywatne widoki.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign(`/login?${new URLSearchParams({ redirect })}`);
      } else if (prefix === "/api/backend" && response.status === 403 && errorCode(payload) === "PASSWORD_CHANGE_REQUIRED") {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/change-password");
      }
    }
    throw new ApiError(
      extractErrorMessage(payload) ?? defaultMessageForStatus(response.status),
      response.status,
      payload,
    );
  }

  return payload as TResponse;
}

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "body">): Promise<T> {
    return request<T>("/api/backend", "GET", path, options);
  },
  post<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("/api/backend", "POST", path, options);
  },
  put<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("/api/backend", "PUT", path, options);
  },
  patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("/api/backend", "PATCH", path, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("/api/backend", "DELETE", path, options);
  },
  auth: {
    get<T>(path: string): Promise<T> {
      return request<T>("/api/auth", "GET", path);
    },
    post<T>(path: string, options?: RequestOptions): Promise<T> {
      return request<T>("/api/auth", "POST", path, options);
    },
  },
};
