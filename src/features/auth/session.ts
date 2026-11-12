// ==========================================
// MODUŁ AUTORYZACJI: Sesja po stronie serwera
// ==========================================
// Sprawdza użytkownika w API i zarządza wyłącznie ciasteczkiem Next.js.

import { z } from "zod";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api/server";

// ! Prefiks __Host- wymaga Secure, Path=/ i braku Domain; lokalne HTTP używa innej nazwy.
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-jukuspace_session"
    : "jukuspace_session";

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

// * Walidujemy odpowiedzi API przed użyciem danych w sesji.
export const userSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  first_name: z.string().nullish(),
  last_name: z.string().nullish(),
  role: z.string(),
  must_change_password: z.boolean(),
  created_at: z.string(),
});

export const loginResponseSchema = z.object({
  access_token: z.string().min(1),
  token_type: z.string().refine((value) => value.toLowerCase() === "bearer"),
  user: userSchema,
});

export type ApiUser = z.infer<typeof userSchema>;

export function toUser(user: ApiUser) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name ?? null,
    lastName: user.last_name ?? null,
    role: user.role,
    mustChangePassword: user.must_change_password,
    createdAt: user.created_at,
  };
}

// * 401 i inna rola kończą sesję; awaria API jej nie usuwa.
export async function getTutorSession(
  token: string,
): Promise<
  { kind: "ok"; user: ApiUser } | { kind: "unauthorized" } | { kind: "error" }
> {
  try {
    const response = await backendFetch("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) return { kind: "unauthorized" };
    if (!response.ok) return { kind: "error" };
    const user = userSchema.safeParse(await response.json());
    if (!user.success) return { kind: "error" };
    if (user.data.role !== "tutor") return { kind: "unauthorized" };
    return { kind: "ok", user: user.data };
  } catch (error) {
    console.error("Nie udało się zweryfikować sesji:", error);
    return { kind: "error" };
  }
}
