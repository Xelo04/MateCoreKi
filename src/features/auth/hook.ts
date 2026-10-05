// ==========================================
// MODUŁ AUTORYZACJI: Hook stanu i akcji logowania
// ==========================================
// Integracja interfejsu użytkownika z serwisem autoryzacji i magazynem Zustand.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { authService } from "./service";
import { useSessionStore } from "@/store/use-session-store";
import type { LoginCredentials, RegisterCredentials } from "./types";
import { toast } from "sonner";

const DEFAULT_REDIRECT_URL = "/dashboard";

export function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const session = useSessionStore((state) => state.session);
  const isHydrated = useSessionStore((state) => state.isHydrated);
  const setSession = useSessionStore((state) => state.setSession);
  const clearSession = useSessionStore((state) => state.clearSession);
  const markHydrated = useSessionStore((state) => state.markHydrated);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // * Ustala, dokąd przekierować użytkownika po udanym zalogowaniu
  const resolveRedirectUrl = useCallback(
    (customRedirect?: string): string => {
      if (customRedirect) return customRedirect;
      const queryRedirect = searchParams.get("redirect");
      if (
        queryRedirect &&
        queryRedirect.startsWith("/") &&
        !queryRedirect.startsWith("//")
      ) {
        return queryRedirect;
      }
      return DEFAULT_REDIRECT_URL;
    },
    [searchParams],
  );

  // Weryfikacja sesji przy pierwszym załadowaniu aplikacji.
  useEffect(() => {
    if (isHydrated) return;
    let isCancelled = false;

    void authService.getSession().then((sessionData) => {
      if (isCancelled) return;
      markHydrated(sessionData);
    });

    return () => {
      isCancelled = true;
    };
  }, [isHydrated, markHydrated]);

  // * Obsługuje proces logowania użytkownika
  const login = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const sessionData = await authService.login(credentials);
        setSession(sessionData);

        toast.success("Zalogowano pomyślnie", {
          description: `Witaj z powrotem, ${sessionData.user.firstName}.`,
        });

        router.push(resolveRedirectUrl(redirectTo));
        return sessionData;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Nie udało się zalogować.";
        setError(message);
        toast.error("Błąd logowania", { description: message });
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setSession, resolveRedirectUrl],
  );

  // * Obsługuje proces rejestracji nowego użytkownika
  const register = useCallback(
    async (credentials: RegisterCredentials, redirectTo?: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const sessionData = await authService.register(credentials);
        setSession(sessionData);

        toast.success("Konto utworzone", {
          description: `Witaj w systemie, ${sessionData.user.firstName}.`,
        });

        router.push(resolveRedirectUrl(redirectTo));
        return sessionData;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Nie udało się utworzyć konta.";
        setError(message);
        toast.error("Błąd rejestracji", { description: message });
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [router, setSession, resolveRedirectUrl],
  );

  // * Wylogowuje użytkownika i przekierowuje do strony logowania
  const logout = useCallback(async () => {
    await authService.logout();
    clearSession();
    toast.info("Wylogowano pomyślnie");
    router.push("/login");
  }, [clearSession, router]);

  return {
    session,
    isAuthenticated: session !== null,
    isHydrated,
    isSubmitting,
    error,
    login,
    register,
    logout,
  };
}
