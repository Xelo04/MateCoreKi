// ==========================================
// AUTH: Zarządzanie tokenem (LocalStorage + Cookie)
// ==========================================
// Moduł odpowiedzialny za bezpieczny zapis, odczyt i usuwanie tokena JWT.
// Zapisuje token jednocześnie w localStorage (dla klienta) oraz w ciasteczku
// (dzięki czemu Middleware na serwerze wie, czy użytkownik jest zalogowany).

const TOKEN_KEY = "matcoreki:auth:token";

export const tokenStorage = {
  // * Pobiera token z localStorage (zabezpieczone przed środowiskiem SSR)
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  // * Zapisuje token w localStorage oraz ustawia ciasteczko przeglądarki dla Middleware
  set(token: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);

      // Ustawiamy ciasteczko dostępne dla całej domeny (path=/), ważne przez 7 dni,
      // z polityką samesite=lax dla podstawowego bezpieczeństwa CSRF.
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    } catch {
      // ! Ignoruje błędy np. w trybie prywatnym przeglądarki
    }
  },

  // * Czyszczenie tokena z localStorage oraz kasowanie ciasteczka (wylogowanie)
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);

      // Natychmiastowe wygaszenie ciasteczka przez ustawienie max-age na 0
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    } catch {
      // ! Ignoruje błędy usuwania
    }
  },
};
