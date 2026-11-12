// ==========================================
// TRASA API: Autoryzacja aplikacji
// ==========================================
// Przeglądarka wysyła żądania do /api/auth/[action], a Next.js przekazuje
// obsługę do modułu auth. GET /me odtwarza sesję; POST obsługuje logowanie,
// rejestrację, zmianę hasła i wylogowanie. Token pozostaje w ciasteczku
// HttpOnly, którego JavaScript nie może odczytać.
// Walidacja danych, kontrola pochodzenia i komunikacja z backendem znajdują się
// w features/auth/handlers.ts; sesja i ciasteczka w features/auth/session.ts.

import type { NextRequest } from "next/server";
import { getAuthSession, handleAuthAction } from "@/features/auth/handlers";

type RouteContext = { params: Promise<{ action: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  return getAuthSession(request, (await params).action);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  return handleAuthAction(request, (await params).action);
}
