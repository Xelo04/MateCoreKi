// ==========================================
// MODUŁ AUTORYZACJI: Walidacja formularzy (Zod)
// ==========================================

import { z } from "zod";

const emailSchema = z.string()
  .min(1, "Podaj adres email.")
  .email("Nieprawidłowy adres email.")
  .max(320, "Adres email jest zbyt długi.");
const loginPasswordSchema = z.string().min(1, "Podaj hasło.").max(1024, "Hasło jest zbyt długie.");
const newPasswordSchema = z.string()
  .max(1024, "Hasło jest zbyt długie.")
  // * Backend liczy znaki Unicode, a nie jednostki UTF-16 używane przez string.length.
  .refine((value) => Array.from(value).length >= 8, "Hasło musi mieć co najmniej 8 znaków.");

// ==========================================
// SCHEMAT: Logowanie
// ==========================================
// * Schematy są używane zarówno przez formularze, jak i serwer.
export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});
export type LoginFormData = z.infer<typeof loginSchema>;

// ==========================================
// SCHEMAT: Żądanie rejestracji
// ==========================================
export const registerRequestSchema = z.object({
  firstName: z.string().min(1, "Podaj imię.").max(255, "Imię jest zbyt długie."),
  lastName: z.string().min(1, "Podaj nazwisko.").max(255, "Nazwisko jest zbyt długie."),
  email: emailSchema,
  password: newPasswordSchema,
});

// ==========================================
// SCHEMAT: Formularz rejestracji
// ==========================================
// * Formularz zachowuje wymaganie dwóch znaków, a serwer dotychczasowy kontrakt żądania.
export const registerSchema = registerRequestSchema.extend({
  firstName: registerRequestSchema.shape.firstName.min(2, "Podaj imię (min. 2 znaki)."),
  lastName: registerRequestSchema.shape.lastName.min(2, "Podaj nazwisko (min. 2 znaki)."),
});
export type RegisterFormData = z.infer<typeof registerSchema>;

// ==========================================
// SCHEMAT: Zmiana hasła
// ==========================================
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Podaj obecne hasło.").max(1024, "Hasło jest zbyt długie."),
  newPassword: newPasswordSchema,
  newPasswordConfirm: z.string().min(1, "Potwierdź nowe hasło.").max(1024, "Hasło jest zbyt długie."),
}).refine((value) => value.newPassword === value.newPasswordConfirm, {
  path: ["newPasswordConfirm"],
  message: "Hasła muszą być identyczne.",
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ==========================================
// SCHEMAT: Odzyskiwanie hasła
// ==========================================
export const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Podaj adres email.")
    .email("Nieprawidłowy adres email."),
});

export type ForgotFormData = z.infer<typeof forgotSchema>;
