// ==========================================
// MODUŁ AUTORYZACJI: Obsługa żądań Next.js
// ==========================================
// Waliduje dane i pochodzenie mutacji, a następnie komunikuje się z API.
// Token jest przekazywany do przeglądarki wyłącznie w ciasteczku HttpOnly.

import { NextRequest, NextResponse } from "next/server";
import { backendFetch, isSameOrigin } from "@/lib/api/server";
import { changePasswordSchema, loginSchema, registerRequestSchema } from "./schema";
import type { LoginFormData } from "./schema";
import {
  clearSessionCookie,
  getTutorSession,
  loginResponseSchema,
  SESSION_COOKIE,
  toUser,
} from "./session";

function error(message: string, status: number) {
  return NextResponse.json({ detail: message }, { status, headers: { "Cache-Control": "no-store" } });
}

async function readJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return null;
  try {
    return await request.json();
  } catch {
    // * Niepoprawny JSON zostanie odrzucony walidacją jako 422, bez logowania danych wejściowych.
    return null;
  }
}

// ! Odpowiedź walidacji może zawierać hasła w polu input; nigdy jej nie przekazujemy ani nie logujemy.
async function passwordValidationError(upstream: Response): Promise<string> {
  try {
    const payload: unknown = await upstream.json();
    if (typeof payload === "object" && payload !== null && "detail" in payload && Array.isArray(payload.detail)) {
      for (const issue of payload.detail) {
        if (typeof issue !== "object" || issue === null || !("loc" in issue) || !("type" in issue)) continue;
        if (!Array.isArray(issue.loc) || issue.loc.length !== 2 || issue.loc[0] !== "body") continue;
        if (issue.loc[1] === "new_password" && issue.type === "string_too_short") {
          return "Backend wymaga nowego hasła o długości co najmniej 8 znaków.";
        }
        if (["current_password", "new_password", "new_password_confirm"].includes(issue.loc[1]) && issue.type === "missing") {
          return "Backend nie otrzymał wszystkich wymaganych pól zmiany hasła.";
        }
      }
    }
  } catch {
    console.error("Backend zwrócił nieprawidłową odpowiedź walidacji zmiany hasła.");
  }
  return "Backend odrzucił zmianę hasła. Sprawdź obecne hasło; nowe może wymagać dodatkowych zabezpieczeń. Spróbuj dłuższego hasła z wielkimi i małymi literami, cyframi i znakami specjalnymi.";
}

// * API zwraca token serwerowi Next.js; do przeglądarki trafia w ciasteczku HttpOnly.
async function login(credentials: LoginFormData): Promise<NextResponse> {
  const form = new URLSearchParams({ username: credentials.email, password: credentials.password });
  const upstream = await backendFetch("/auth/login", { method: "POST", body: form });
  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 400) return error("Nieprawidłowy e-mail lub hasło.", 401);
    return error("Nie udało się zalogować. Spróbuj ponownie.", upstream.status >= 500 ? 502 : upstream.status);
  }
  const result = loginResponseSchema.safeParse(await upstream.json());
  if (!result.success) return error("Nieprawidłowa odpowiedź serwera.", 502);
  // ! Panel ucznia nie istnieje, więc dopuszczamy wyłącznie konto korepetytora.
  if (result.data.user.role !== "tutor") return error("Panel jest dostępny tylko dla korepetytorów.", 403);
  const response = NextResponse.json({ user: toUser(result.data.user) }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(SESSION_COOKIE, result.data.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}

// * /api/auth/me odtwarza dane sesji; błąd połączenia nie usuwa ciasteczka.
export async function getAuthSession(request: NextRequest, action: string): Promise<NextResponse> {
  if (action !== "me") return error("Nie znaleziono zasobu.", 404);
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return error("Sesja wygasła. Zaloguj się ponownie.", 401);
  const result = await getTutorSession(token);
  if (result.kind === "error") return error("Nie udało się sprawdzić sesji. Spróbuj ponownie.", 503);
  if (result.kind === "unauthorized") {
    const response = error("Sesja wygasła lub brak dostępu do panelu.", 401);
    clearSessionCookie(response);
    return response;
  }
  return NextResponse.json({ user: toUser(result.user) }, { headers: { "Cache-Control": "no-store" } });
}

export async function handleAuthAction(request: NextRequest, action: string): Promise<NextResponse> {
  // * Żądania zmieniające stan muszą pochodzić z naszej aplikacji (ochrona CSRF).
  if (!isSameOrigin(request)) return error("Niedozwolone źródło żądania.", 403);
  try {
    if (action === "login") {
      // * Walidacja serwerowa jest konieczna nawet wtedy, gdy formularz użył tego samego schematu.
      const credentials = loginSchema.safeParse(await readJson(request));
      if (!credentials.success) return error("Nieprawidłowe dane logowania.", 422);
      return await login(credentials.data);
    }

    if (action === "register") {
      const credentials = registerRequestSchema.safeParse(await readJson(request));
      if (!credentials.success) return error("Nieprawidłowe dane rejestracji.", 422);
      const data = credentials.data;
      const upstream = await backendFetch("/tutors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, first_name: data.firstName, last_name: data.lastName, password: data.password, password_confirm: data.password }),
      });
      if (!upstream.ok) return error("Nie udało się utworzyć konta.", upstream.status >= 500 ? 502 : upstream.status);
      // * Istniejący formularz rejestracji loguje użytkownika po utworzeniu konta.
      return await login(data);
    }

    const token = request.cookies.get(SESSION_COOKIE)?.value;
    if (action === "logout") {
      // ! Usuwamy lokalne ciasteczko nawet wtedy, gdy API nie potwierdzi wylogowania.
      let failed = false;
      if (token) {
        try {
          const upstream = await backendFetch("/auth/logout", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
          failed = !upstream.ok && upstream.status !== 401;
        } catch (err) {
          console.error("Nie udało się wylogować na serwerze:", err);
          failed = true;
        }
      }
      const response = failed
        ? NextResponse.json(
            { detail: "Sesja lokalna została usunięta, ale serwer nie potwierdził wylogowania.", code: "LOCAL_SESSION_CLEARED" },
            { status: 502, headers: { "Cache-Control": "no-store" } },
          )
        : NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
      clearSessionCookie(response);
      return response;
    }

    if (action === "change-password") {
      if (!token) return error("Sesja wygasła. Zaloguj się ponownie.", 401);
      const password = changePasswordSchema.safeParse(await readJson(request));
      if (!password.success) return error("Sprawdź dane i potwierdzenie nowego hasła (minimum 8 znaków).", 422);
      const session = await getTutorSession(token);
      if (session.kind === "error") return error("Nie udało się sprawdzić sesji.", 503);
      if (session.kind === "unauthorized") {
        const response = error("Sesja wygasła lub brak dostępu do panelu.", 401);
        clearSessionCookie(response);
        return response;
      }
      // * Weryfikacja sesji pozwala też zmienić hasło, gdy jest to wymagane.
      const upstream = await backendFetch("/auth/change-password", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: password.data.currentPassword, new_password: password.data.newPassword, new_password_confirm: password.data.newPasswordConfirm }),
      });
      if (!upstream.ok) {
        if (upstream.status === 401) {
          const response = error("Sesja wygasła. Zaloguj się ponownie.", 401);
          clearSessionCookie(response);
          return response;
        }
        if (upstream.status === 422) return error(await passwordValidationError(upstream), 422);
        return error("Nie udało się zmienić hasła. Sprawdź obecne hasło i spróbuj ponownie.", upstream.status >= 500 ? 502 : upstream.status);
      }
      return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    }
    return error("Nie znaleziono zasobu.", 404);
  } catch (err) {
    console.error("Błąd komunikacji z backendem autoryzacji:", err);
    return error("Nie udało się połączyć z serwerem. Spróbuj ponownie.", 503);
  }
}
