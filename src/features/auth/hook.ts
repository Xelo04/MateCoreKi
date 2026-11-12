// ==========================================
// MODUŁ AUTORYZACJI: Hook stanu i akcji logowania
// ==========================================
// Integracja interfejsu użytkownika z serwisem autoryzacji i magazynem Zustand.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useContext, useEffect, useState } from "react";
import { authService } from "./service";
import { InitialSessionContext, useSessionStore } from "@/store/use-session-store";
import type { AuthSession, LoginCredentials, RegisterCredentials } from "./types";
import { toast } from "sonner";
import { ApiError } from "@/lib/api/api-errors";

const DEFAULT_REDIRECT_URL = "/dashboard";
let hydrationRequest: Promise<AuthSession> | null = null;

// * Współdzielimy równoległą hydratację, aby wiele instancji hooka nie dublowało żądania.
function getHydrationSession(): Promise<AuthSession> {
  if (hydrationRequest) return hydrationRequest;
  const request = authService.getSession();
  hydrationRequest = request;
  void request.then(
    () => { if (hydrationRequest === request) hydrationRequest = null; },
    () => { if (hydrationRequest === request) hydrationRequest = null; },
  );
  return request;
}

export function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSession = useContext(InitialSessionContext);

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
      const queryRedirect = customRedirect ?? searchParams.get("redirect");
      if (queryRedirect?.startsWith("/") && !queryRedirect.includes("\\")) {
        try {
          const target = new URL(queryRedirect, window.location.origin);
          if (target.origin === window.location.origin) {
            return `${target.pathname}${target.search}${target.hash}`;
          }
        } catch {
          // * Niepoprawny adres odrzucamy i pozostajemy w aplikacji.
          return DEFAULT_REDIRECT_URL;
        }
      }
      return DEFAULT_REDIRECT_URL;
    },
    [searchParams],
  );

  // * Hydratacja używa sesji przekazanej przez serwer lub pobiera ją raz z API.
  // * Zależności reagują na zmianę danych i stanu hydratacji; sprzątanie blokuje
  //   zapis wyniku po odmontowaniu, nie przerywając współdzielonego żądania.
  useEffect(() => {
    if (isHydrated) return;
    let isCancelled = false;

    if (initialSession) {
      markHydrated(initialSession);
      return;
    }

    void getHydrationSession().then((sessionData) => {
      if (!isCancelled && !useSessionStore.getState().isHydrated) markHydrated(sessionData);
    }).catch((err: unknown) => {
      if (isCancelled || useSessionStore.getState().isHydrated) return;
      markHydrated(null);
      if (!(err instanceof ApiError && err.status === 401)) {
        console.error("Nie udało się odtworzyć sesji:", err instanceof ApiError ? err.status : "błąd połączenia");
        toast.error("Nie udało się odtworzyć sesji. Odśwież stronę i spróbuj ponownie.");
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [initialSession, isHydrated, markHydrated]);

  // * Obsługuje proces logowania użytkownika
  const login = useCallback(
    async (credentials: LoginCredentials, redirectTo?: string) => {
      setIsSubmitting(true);
      setError(null);

      try {
        const sessionData = await authService.login(credentials);
        setSession(sessionData);

        toast.success("Zalogowano pomyślnie");

        router.push(sessionData.user.mustChangePassword ? "/change-password" : resolveRedirectUrl(redirectTo));
        router.refresh();
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

        toast.success("Konto utworzone");

        router.push(sessionData.user.mustChangePassword ? "/change-password" : resolveRedirectUrl(redirectTo));
        router.refresh();
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
    try {
      await authService.logout();
      clearSession();
      toast.info("Wylogowano pomyślnie");
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Nie udało się potwierdzić wylogowania:", err instanceof ApiError ? err.status : "błąd żądania");
      toast.error(err instanceof Error ? err.message : "Nie udało się potwierdzić wylogowania.");
      if (
        err instanceof ApiError &&
        err.status === 502 &&
        typeof err.details === "object" &&
        err.details !== null &&
        "code" in err.details &&
        err.details.code === "LOCAL_SESSION_CLEARED"
      ) {
        clearSession();
        router.replace("/login");
        router.refresh();
      }
    }
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
