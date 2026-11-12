// ==========================================
// SERWIS: Autoryzacja w kliencie
// ==========================================
// Komunikuje się z trasami Next.js; token nigdy nie trafia do serwisu.

import { apiClient } from "@/lib/api/api-client";
import type { AuthSession, LoginCredentials, RegisterCredentials } from "./types";

export const authService = {
  // * Logowanie e-mailem i hasłem: POST /auth/login.
  login(credentials: LoginCredentials): Promise<AuthSession> {
    return apiClient.auth.post<AuthSession>("/login", { body: credentials });
  },

  // * Rejestracja i automatyczne logowanie: POST /tutors/register, następnie /auth/login.
  register(credentials: RegisterCredentials): Promise<AuthSession> {
    return apiClient.auth.post<AuthSession>("/register", { body: credentials });
  },

  // * Odtworzenie danych zalogowanego korepetytora: GET /auth/me.
  getSession(): Promise<AuthSession> {
    return apiClient.auth.get<AuthSession>("/me");
  },

  // * Usunięcie sesji w Next.js i wylogowanie w API: POST /auth/logout.
  async logout(): Promise<void> {
    await apiClient.auth.post("/logout");
  },

  // * Zmiana obecnego hasła z potwierdzeniem nowego: POST /auth/change-password.
  async changePassword(currentPassword: string, newPassword: string, newPasswordConfirm: string): Promise<void> {
    await apiClient.auth.post("/change-password", {
      body: { currentPassword, newPassword, newPasswordConfirm },
    });
  },

  // ! API resetowania hasła nie jest jeszcze podłączone; nie zgłaszamy pozornego sukcesu.
  async requestPasswordReset(email: string): Promise<void> {
    void email;
    throw new Error("Resetowanie hasła nie jest jeszcze dostępne.");
  },
};
