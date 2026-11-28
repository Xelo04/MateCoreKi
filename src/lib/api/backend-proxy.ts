// ==========================================
// API SERWEROWE: Pośrednik chronionych żądań
// ==========================================
// Dopuszcza wybrane trasy, sprawdza sesję i przekazuje token do backendu.
// Mutacje wymagają zgodnego pochodzenia; pliki mają osobną obsługę multipart.

import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  getTutorSession,
  SESSION_COOKIE,
} from "@/features/auth/session";
import { backendFetch, isSameOrigin } from "./server";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// * Dozwolone są wyłącznie udokumentowane operacje.
const routes: ReadonlyArray<{ path: RegExp; methods: readonly Method[] }> = [
  { path: /^\/students\/$/, methods: ["GET", "POST"] },
  { path: /^\/students\/\d+$/, methods: ["GET"] },
  { path: /^\/tutors\/me$/, methods: ["GET"] },
  { path: /^\/api\/v1\/categories$/, methods: ["GET"] },
  { path: /^\/api\/v1\/assets$/, methods: ["POST"] },
  { path: /^\/api\/v1\/assets\/[1-9]\d*$/, methods: ["GET", "DELETE"] },
  { path: /^\/api\/v1\/tags$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/exercises\/meta$/, methods: ["GET"] },
  { path: /^\/api\/v1\/exercises$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/exercises\/\d+$/, methods: ["GET", "PATCH", "DELETE"] },
  { path: /^\/api\/v1\/exercise-sets$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/exercise-sets\/\d+$/, methods: ["GET", "PATCH", "DELETE"] },
  { path: /^\/api\/v1\/exercise-sets\/\d+\/(archive|restore)$/, methods: ["POST"] },
  { path: /^\/api\/v1\/set-folders$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/set-folders\/\d+$/, methods: ["PATCH", "DELETE"] },
  { path: /^\/api\/v1\/set-folders\/\d+\/deletion-preview$/, methods: ["GET"] },
  { path: /^\/api\/v1\/assignments$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/assignments\/\d+$/, methods: ["GET", "PATCH", "DELETE"] },
  { path: /^\/api\/v1\/assignments\/\d+\/solutions$/, methods: ["PATCH"] },
  { path: /^\/api\/v1\/assignments\/\d+\/submissions\/\d+$/, methods: ["PATCH"] },
  { path: /^\/api\/v1\/my\/assignments$/, methods: ["GET"] },
  { path: /^\/api\/v1\/my\/assignments\/\d+$/, methods: ["GET"] },
  { path: /^\/api\/v1\/my\/assignments\/\d+\/submissions\/\d+$/, methods: ["PUT"] },
  { path: /^\/api\/v1\/my\/assignments\/\d+\/submit$/, methods: ["POST"] },
];

function error(detail: string, status: number, code?: string): NextResponse {
  return NextResponse.json(
    { detail, ...(code ? { code } : {}) },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

// * Ograniczenie obejmuje również multipart, zanim cała zawartość trafi do pamięci.
async function readUpload(request: Request): Promise<FormData | NextResponse> {
  const maxBytes = 10 * 1024 * 1024;
  const maxBodyBytes = maxBytes + 64 * 1024;
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^multipart\/form-data\s*;/i.test(contentType) || !request.body) {
    return error("Wybierz plik do przesłania.", 415);
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBodyBytes) {
      await reader.cancel();
      return error("Plik może mieć maksymalnie 10 MiB.", 413);
    }
    chunks.push(value);
  }
  let form: FormData;
  try {
    const body = new Blob(chunks.map((chunk) => Uint8Array.from(chunk)));
    form = await new Request(request.url, { method: "POST", headers: { "Content-Type": contentType }, body }).formData();
  } catch {
    return error("Nieprawidłowe dane przesyłanego pliku.", 400);
  }
  const entries = Array.from(form.entries());
  if (entries.length !== 1 || entries[0][0] !== "file" || !(entries[0][1] instanceof File)) {
    return error("Prześlij jeden plik.", 422);
  }
  if (entries[0][1].size > maxBytes) return error("Plik może mieć maksymalnie 10 MiB.", 413);
  return form;
}

export async function forwardBackendRequest(request: NextRequest, method: Method): Promise<NextResponse> {
  // * Mutacje wymagają żądania z naszej domeny, ponieważ przeglądarka dołącza ciasteczko.
  if (method !== "GET" && !isSameOrigin(request)) {
    return error("Niedozwolone źródło żądania.", 403);
  }

  const rawPath = request.nextUrl.pathname.slice("/api/backend".length);
  // * Next.js usuwa końcowy ukośnik, a endpoint listy uczniów go wymaga.
  const path = rawPath === "/students" ? "/students/" : rawPath;
  const route = routes.find((entry) => entry.path.test(path));
  if (!route) return error("Nie znaleziono zasobu.", 404);
  if (!route.methods.includes(method)) return error("Niedozwolona metoda.", 405);

  // * Każde żądanie danych sprawdza sesję niezależnie od ochrony widoków.
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return error("Sesja wygasła. Zaloguj się ponownie.", 401);

  const session = await getTutorSession(token);
  if (session.kind === "error") return error("Nie udało się sprawdzić sesji.", 503);
  if (session.kind === "unauthorized") {
    const response = error("Sesja wygasła lub brak dostępu do panelu.", 401);
    clearSessionCookie(response);
    return response;
  }
  if (session.user.must_change_password) {
    return error("Zmień hasło przed kontynuowaniem.", 403, "PASSWORD_CHANGE_REQUIRED");
  }

  try {
    // ! Nie przekazujemy nagłówków autoryzacji z przeglądarki: token pochodzi tylko z HttpOnly.
    const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: "application/json" });
    const assetDownload = method === "GET" && /^\/api\/v1\/assets\/[1-9]\d*$/.test(path);
    if (assetDownload) {
      // * Backend uwierzytelnia pobieranie pliku tym samym JWT w ciasteczku asset_token.
      if (!/^[\w.-]+$/.test(token)) return error("Nieprawidłowa sesja.", 401);
      headers.set("Cookie", `asset_token=${token}`);
      headers.set("Accept", "*/*");
    }
    let body: string | FormData | undefined;
    if (method === "POST" && path === "/api/v1/assets") {
      const upload = await readUpload(request);
      if (upload instanceof NextResponse) return upload;
      body = upload;
    } else if (method !== "GET") {
      body = await request.text();
      if (body) {
        const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
        if (contentType !== "application/json") {
          return error("Obsługiwane są wyłącznie dane JSON.", 415);
        }
        headers.set("Content-Type", "application/json");
      } else {
        body = undefined;
      }
    }

    const upstream = await backendFetch(`${path}${request.nextUrl.search}`, { method, headers, body });
    // * Przekazujemy typ treści i status, ale nie ciasteczka ani pozostałe nagłówki backendu.
    const responseHeaders = new Headers({ "Cache-Control": "no-store" });
    const contentType = upstream.headers.get("content-type");
    if (contentType) responseHeaders.set("Content-Type", contentType);
    if (assetDownload && upstream.ok) {
      const mime = contentType?.split(";", 1)[0].toLowerCase();
      if (!mime || !["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(mime)) {
        return error("Serwer zwrócił nieobsługiwany typ pliku.", 502);
      }
      responseHeaders.set("X-Content-Type-Options", "nosniff");
      responseHeaders.set("Content-Security-Policy", "default-src 'none'; sandbox");
      responseHeaders.set("Content-Disposition", mime === "application/pdf" ? `attachment; filename="zalacznik-${path.split("/").pop()}.pdf"` : "inline");
    }
    const response = new NextResponse(
      upstream.status === 204 || upstream.status === 205 || upstream.status === 304 ? null : upstream.body,
      { status: upstream.status, headers: responseHeaders },
    );
    if (upstream.status === 401) clearSessionCookie(response);
    return response;
  } catch (err) {
    console.error("Błąd komunikacji z API:", err);
    return error("Nie udało się połączyć z serwerem. Spróbuj ponownie.", 503);
  }
}

