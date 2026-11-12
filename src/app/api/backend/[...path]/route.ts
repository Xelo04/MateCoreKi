// ==========================================
// TRASA API: Pośrednik dla danych backendu
// ==========================================
// Klient przeglądarkowy wysyła żądania do /api/backend/* zamiast odczytywać
// token. Pośrednik w lib/api/backend-proxy.ts sprawdza dozwolony endpoint,
// sesję, rolę i wymaganie zmiany hasła, a przy mutacjach również pochodzenie
// żądania. Następnie odczytuje ciasteczko HttpOnly i przekazuje token jako
// Bearer do API. Odpowiedź wraca bez ciasteczek i pozostałych nagłówków API.
// Ten plik jedynie przypisuje metody HTTP wymagane przez Next.js.

import type { NextRequest } from "next/server";
import { forwardBackendRequest } from "@/lib/api/backend-proxy";

export const GET = (request: NextRequest) => forwardBackendRequest(request, "GET");
export const POST = (request: NextRequest) => forwardBackendRequest(request, "POST");
export const PUT = (request: NextRequest) => forwardBackendRequest(request, "PUT");
export const PATCH = (request: NextRequest) => forwardBackendRequest(request, "PATCH");
export const DELETE = (request: NextRequest) => forwardBackendRequest(request, "DELETE");
