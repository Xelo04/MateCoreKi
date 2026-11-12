// ==========================================
// PROXY NEXT.JS: Ochrona widoków panelu
// ==========================================
// Weryfikuje sesję przed wyświetleniem strony i kieruje do zmiany hasła.
// Trasy API niezależnie sprawdzają uprawnienia dla każdego żądania.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearSessionCookie, getTutorSession, SESSION_COOKIE } from "@/features/auth/session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const isGuestPage = ["/login", "/register", "/forgot-password"].includes(request.nextUrl.pathname);
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);

  if (!token) return isGuestPage ? NextResponse.next() : NextResponse.redirect(loginUrl);

  const result = await getTutorSession(token);
  if (result.kind === "error") {
    return new NextResponse("Nie udało się sprawdzić sesji. Spróbuj ponownie później.", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (result.kind === "unauthorized") {
    const response = isGuestPage ? NextResponse.next() : NextResponse.redirect(loginUrl);
    clearSessionCookie(response);
    return response;
  }

  const isChangePassword = request.nextUrl.pathname === "/change-password";
  if (result.user.must_change_password && !isChangePassword) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }
  if (isGuestPage) return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/board/:path*",
    "/calendar/:path*",
    "/students/:path*",
    "/exercise-database/:path*",
    "/exercise-sets/:path*",
    "/change-password",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
