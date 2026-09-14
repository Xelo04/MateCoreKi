// ==========================================
// MIDDLEWARE: Automatyczna ochrona tras (Edge)
// ==========================================
// Ten plik wykonuje się na serwerze przed załadowaniem każdej wskazanej ścieżki.
// Sprawdza obecność ciasteczka z tokenem i steruje ruchem użytkownika:
// 1. Zalogowany -> próba wejścia na /login lub /register -> przekierowanie na /dashboard
// 2. Niezalogowany -> próba wejścia na /dashboard lub /board -> przekierowanie na /login

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Klucz ciasteczka musi być spójny z tym definiowanym w tokenStorage
const TOKEN_KEY = "matcoreki:auth:token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pobieramy token z ciasteczek HTTP dostępnych dla serwera
  const token = request.cookies.get(TOKEN_KEY)?.value;

  // Definicja tras publicznych (dostępnych tylko dla niezalogowanych)
  const isPublicAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  // Definicja tras chronionych (dostępnych tylko dla zalogowanych)
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/board");

  // * Scenariusz 1: Zalogowany użytkownik próbuje wejść na formularze logowania/rejestracji
  if (token && isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // * Scenariusz 2: Niezalogowany użytkownik próbuje wejść do panelu lub na tablicę
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    // Zapisujemy w query string adres, pod który użytkownik chciał wejść,
    // aby można było go tam wrzucić powtórnie po udanym zalogowaniu.
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jeśli warunki nie są spełnione, puszczamy żądanie dalej bez zmian
  return NextResponse.next();
}

// Konfiguracja dopasowania ścieżek (matcher), na których działa middleware
export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard",
    "/dashboard/:path*",
    "/board",
    "/board/:path*",
  ],
};
