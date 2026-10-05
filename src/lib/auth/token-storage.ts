// Przechowywanie tokena JWT w localStorage i ciasteczku.

const TOKEN_KEY = "matcoreki:auth:token";

export const tokenStorage = {
  // Odczyt tokena z localStorage z pominięciem środowiska SSR.
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  // Zapis tokena w localStorage i ciasteczku przeglądarki.
  set(token: string): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(TOKEN_KEY, token);

      // Ciasteczko jest dostępne dla całej domeny przez 7 dni.
      document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${7 * 24 * 60 * 60}; samesite=lax`;
    } catch {}
  },

  // Usunięcie tokena z localStorage i ciasteczka.
  clear(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(TOKEN_KEY);

      // Natychmiastowe wygaszenie ciasteczka.
      document.cookie = `${TOKEN_KEY}=; path=/; max-age=0`;
    } catch {}
  },
};
