// Ochrona tras na podstawie obecności tokena uwierzytelniającego.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Klucz musi być zgodny z kluczem używanym w tokenStorage.
const TOKEN_KEY = "matcoreki:auth:token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Odczyt tokena z ciasteczek dostępnych po stronie serwera.
  const token = request.cookies.get(TOKEN_KEY)?.value;

  // Trasy publiczne dostępne dla niezalogowanych użytkowników.
  const isPublicAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  // Trasy chronione dostępne dla zalogowanych użytkowników.
  const isProtectedRoute =
    pathname.startsWith("/dashboard") || pathname.startsWith("/board");

  // Przekierowanie zalogowanego użytkownika z formularzy uwierzytelniania.
  if (token && isPublicAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Przekierowanie niezalogowanego użytkownika do logowania.
  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    // Zachowanie adresu docelowego do użycia po zalogowaniu.
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Przekazanie żądania bez zmian, jeśli nie wymaga przekierowania.
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
  ],
};
