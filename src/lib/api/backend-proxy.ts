// ==========================================
// API SERWEROWE: Pośrednik chronionych żądań
// ==========================================
// Dopuszcza wybrane trasy, sprawdza sesję i przekazuje token do backendu.
// Mutacje wymagają zgodnego pochodzenia; obsługa plików nie jest tu podłączona.

import { NextRequest, NextResponse } from "next/server";
import {
  clearSessionCookie,
  getTutorSession,
  SESSION_COOKIE,
} from "@/features/auth/session";
import { backendFetch, isSameOrigin } from "./server";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// * Dozwolone są wyłącznie udokumentowane operacje; auth i pliki mają osobne przepływy.
const routes: ReadonlyArray<{ path: RegExp; methods: readonly Method[] }> = [
  { path: /^\/students\/$/, methods: ["GET", "POST"] },
  { path: /^\/students\/\d+$/, methods: ["GET"] },
  { path: /^\/tutors\/me$/, methods: ["GET"] },
  { path: /^\/api\/v1\/categories$/, methods: ["GET"] },
  { path: /^\/api\/v1\/tags$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/tags\/\d+$/, methods: ["PATCH", "DELETE"] },
  { path: /^\/api\/v1\/exercises\/meta$/, methods: ["GET"] },
  { path: /^\/api\/v1\/exercises$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/exercises\/\d+$/, methods: ["GET", "PATCH", "DELETE"] },
  { path: /^\/api\/v1\/exercises\/\d+\/tags$/, methods: ["PUT"] },
  { path: /^\/api\/v1\/exercise-sets$/, methods: ["GET", "POST"] },
  { path: /^\/api\/v1\/exercise-sets\/\d+$/, methods: ["GET", "PATCH", "DELETE"] },
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
    let body: string | undefined;
    if (method !== "GET") {
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

