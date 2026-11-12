// ==========================================
// MODUŁ AUTORYZACJI: Definicje typów danych
// ==========================================
// Interfejsy TypeScript używane podczas logowania i rejestracji.

export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  mustChangePassword: boolean;
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
