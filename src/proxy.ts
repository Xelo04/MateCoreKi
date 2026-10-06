// ==========================================
// INFRASTRUKTURA: Proxy / Middleware Uwierzytelniania
// ==========================================
// Odpowiada za przekierowania między trasami publicznymi a chronionymi.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// * Klucz ciasteczka - musi być spójny z implementacją w klasie TokenStorage
const TOKEN_KEY = "matcoreki:auth:token";

// ----- Definicje zakresów tras -----

// * Trasy uwierzytelniania - dostępne wyłącznie dla niezalogowanych użytkowników
const PUBLIC_AUTH_ROUTES = ["/login", "/register", "/forgot-password"];

// * Wszystkie chronione trasy aplikacji - wymagają poprawnego tokena JWT
const PROTECTED_ROUTES = [
  "/dashboard",
  "/board",
  "/calendar",
  "/students",
  "/exercises",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // * Odczyt ciasteczka sesyjnego po stronie serwera
  const token = request.cookies.get(TOKEN_KEY)?.value;

  // * Sprawdzenie przynależności aktualnej ścieżki
  const isPublicAuthRoute = PUBLIC_AUTH_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  // ----- Logika przekierowań (Serwer-Side) -----
  // ! Zalogowany użytkownik wchodzi na stronę logowania/rejestracji
  if (token && isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ! Niezalogowany użytkownik próbuje wejść na chronioną trasę
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // * Zgoda na przejście dalej - brak konieczności przekierowania
  return NextResponse.next();
}

// Ścieżki obsługiwane przez middleware.
export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard",
    "/dashboard/:path*",
    "/board",
    "/board/:path*",
    "/calendar",
    "/calendar/:path*",
    "/students",
    "/students/:path*",
    "/exercises",
    "/exercises/:path*",
  ],
};
