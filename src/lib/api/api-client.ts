// ==========================================
// API: Globalny klient HTTP (Fetch Wrapper)
// ==========================================
// Plik odpowiada za komunikację z backendem Python FastAPI. Automatycznie dokłada
// nagłówek autoryzacji, parsuje odpowiedzi JSON oraz obsługuje błędy sieciowe.

import { tokenStorage } from "@/lib/auth/token-storage";
import { ApiError, defaultMessageForStatus } from "@/lib/api/api-errors";

interface RequestOptions {
  auth?: boolean;
  body?: Record<string, unknown> | URLSearchParams;
  headers?: Record<string, string>;
}

// * Wyciąga user-friendly komunikat z payloadu błędu zwracanego przez FastAPI
function extractErrorMessage(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const record = payload as Record<string, unknown>;
  const detail = record["detail"];

  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Record<string, unknown> | undefined;
    const msg = first?.["msg"];
    if (typeof msg === "string") return msg;
  }
  return null;
}

// * Główna funkcja wykonująca żądanie HTTP do serwera
async function request<TResponse>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const url = `${baseUrl}${path}`;
  const headers = new Headers(options.headers);

  // Automatyczne dołączanie tokena JWT jeśli żądanie tego wymaga
  if (options.auth) {
    const token = tokenStorage.get();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // Automatyczne dopasowanie formatu danych w ciele żądania (JSON lub x-www-form-urlencoded)
  let body: BodyInit | undefined;
  if (options.body instanceof URLSearchParams) {
    body = options.body;
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    }
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { method, headers, body });
  } catch (networkError) {
    throw new ApiError(defaultMessageForStatus(0), 0, networkError);
  }

  const contentType = response.headers.get("Content-Type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload: unknown = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const message =
      extractErrorMessage(payload) ?? defaultMessageForStatus(response.status);
    throw new ApiError(message, response.status, payload);
  }

  return payload as TResponse;
}

// * Publiczne API klienta HTTP podzielone na metody
export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "body">): Promise<T> {
    return request<T>("GET", path, options);
  },
  post<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("POST", path, options);
  },
  put<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("PUT", path, options);
  },
  patch<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("PATCH", path, options);
  },
  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return request<T>("DELETE", path, options);
  },
};
