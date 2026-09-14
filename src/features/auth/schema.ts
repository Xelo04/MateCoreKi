// ==========================================
// MODUŁ AUTORYZACJI: Walidacja formularzy (Zod)
// ==========================================

import { z } from "zod";

// * Reguły walidacji dla logowania
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Podaj adres email.")
    .email("Nieprawidłowy adres email."),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
  rememberMe: z.boolean(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// * Reguły walidacji dla rejestracji
export const registerSchema = z.object({
  firstName: z.string().min(2, "Podaj imię (min. 2 znaki)."),
  lastName: z.string().min(2, "Podaj nazwisko (min. 2 znaki)."),
  email: z
    .string()
    .min(1, "Podaj adres email.")
    .email("Nieprawidłowy adres email."),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków."),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

// * Reguła walidacji dla odzyskiwania hasła
export const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Podaj adres email.")
    .email("Nieprawidłowy adres email."),
});

export type ForgotFormData = z.infer<typeof forgotSchema>;
