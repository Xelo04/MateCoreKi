// ==========================================
// MODUŁ AUTORYZACJI: Definicje typów danych
// ==========================================
// Plik zawiera czytelne interfejsy TypeScript używane w procesie logowania i rejestracji.

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
}

export interface UserApiResponse {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export interface LoginApiResponse {
  access_token: string;
  token_type: string;
  user: UserApiResponse;
}
