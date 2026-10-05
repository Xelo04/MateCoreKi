// ==========================================
// MODUŁ AUTORYZACJI: Serwis komunikacji z API
// ==========================================
// Komunikacja HTTP z backendem FastAPI.

import { apiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-errors";
import { tokenStorage } from "@/lib/auth/token-storage";
import type {
  AuthSession,
  LoginCredentials,
  LoginApiResponse,
  UserApiResponse,
  RegisterCredentials,
  User,
} from "./types";

// * Funkcja pomocnicza: Tłumaczy obiekt z backendu na format przyjazny frontendu
function mapApiResponseToUser(dto: UserApiResponse): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.first_name,
    lastName: dto.last_name,
    createdAt: dto.created_at,
  };
}

export const authService = {
  // * Loguje użytkownika
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const form = new URLSearchParams();
    form.set("username", credentials.email);
    form.set("password", credentials.password);

    // TODO: Dodać form.set("remember_me", ...) gdy backend to wdroży
    const response = await apiClient.post<LoginApiResponse>("/tutors/login", {
      body: form,
    });

    tokenStorage.set(response.access_token);
    return { user: mapApiResponseToUser(response.user) };
  },

  // * Rejestruje nowego użytkownika, a następnie automatycznie go loguje
  async register(credentials: RegisterCredentials): Promise<AuthSession> {
    const body = {
      email: credentials.email,
      first_name: credentials.firstName,
      last_name: credentials.lastName,
      password: credentials.password,
      password_confirm: credentials.password,
    };

    await apiClient.post<UserApiResponse>("/tutors/register", { body });

    return await authService.login({
      email: credentials.email,
      password: credentials.password,
    });
  },

  // Weryfikacja sesji przez pobranie danych profilu.
  async getSession(): Promise<AuthSession | null> {
    const token = tokenStorage.get();
    if (!token) return null;

    try {
      const response = await apiClient.get<UserApiResponse>("/tutors/me", {
        auth: true,
      });
      return { user: mapApiResponseToUser(response) };
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStorage.clear();
        return null;
      }
      return null;
    }
  },

  // * Wylogowuje użytkownika poprzez wyczyszczenie tokena
  async logout(): Promise<void> {
    // TODO: Dodać żądanie do backendu /tutors/logout, gdy zostanie zaimplementowane
    tokenStorage.clear();
  },

  // * Wysyła żądanie zresetowania zapomnianego hasła
  async requestPasswordReset(email: string): Promise<void> {
    // TODO: Podmienić na właściwy endpoint po stronie Pythona
    void email;
    await new Promise((resolve) => setTimeout(resolve, 400));
  },
};
