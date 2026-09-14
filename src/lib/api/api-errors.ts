// ==========================================
// API: Domenowe błędy i komunikaty HTTP
// ==========================================
// Plik definiuje strukturę błędów zgłaszanych przez klient API oraz mapuje kody
// odpowiedzi serwera na przyjazne dla użytkownika komunikaty w języku polskim.

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

// * Zwraca czytelny komunikat na podstawie kodu błędu HTTP
export function defaultMessageForStatus(status: number): string {
  if (status === 0) return "Brak połączenia z serwerem. Sprawdź internet.";
  if (status === 400) return "Nieprawidłowe dane w żądaniu.";
  if (status === 401) return "Nieprawidłowy email lub hasło.";
  if (status === 403) return "Brak uprawnień do tej operacji.";
  if (status === 404) return "Nie znaleziono zasobu.";
  if (status === 409) return "Konflikt - zasób już istnieje.";
  if (status === 422) return "Nieprawidłowe dane w formularzu.";
  if (status === 429) return "Zbyt wiele prób. Spróbuj za chwilę.";
  if (status >= 500) return "Błąd serwera. Spróbuj ponownie za chwilę.";
  return "Nieoczekiwany błąd.";
}
