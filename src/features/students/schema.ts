// ==========================================
// SCHEMA: Walidacja formularza ucznia
// ==========================================

import { z } from "zod";

// * Telefon: dokładnie 9 cyfr (bez spacji - te są tylko w UI)
const PHONE_REGEX = /^\d{9}$/;
// * Regex format "HH:MM" (24h)
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
// * Regex format "YYYY-MM-DD"
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const scheduleSlotSchema = z
  .object({
    id: z.string(),
    dayOfWeek: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
        z.literal(6),
        z.literal(7),
      ])
      .optional(),
    startTime: z
      .string()
      .regex(TIME_REGEX, "Format godziny musi być GG:MM (np. 16:30)"),
    durationMins: z
      .number({ message: "Podaj czas trwania w minutach" })
      .int("Podaj liczbę całkowitą")
      .min(15, "Minimum 15 minut")
      .max(300, "Maksymalnie 300 minut"),
    recurrence: z.enum(["none", "weekly", "biweekly"]),
    date: z
      .string()
      .regex(DATE_REGEX, "Nieprawidłowy format daty")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (slot) => slot.recurrence === "none" || slot.dayOfWeek !== undefined,
    {
      message: "Wybierz dzień tygodnia",
      path: ["dayOfWeek"],
    },
  )
  .refine((slot) => slot.recurrence !== "none" || !!slot.date, {
    message: "Jednorazowe spotkanie wymaga wybrania daty",
    path: ["date"],
  });

export const studentFormSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, "Imię jest wymagane")
      .max(50, "Maksymalnie 50 znaków"),
    lastName: z
      .string()
      .trim()
      .min(1, "Nazwisko jest wymagane")
      .max(50, "Maksymalnie 50 znaków"),
    educationType: z.enum([
      "primary_school",
      "high_school",
      "technical_school",
    ]),
    classYear: z.number({ message: "Wybierz klasę" }).int().min(1).max(8),
    mathLevel: z.enum(["basic", "extended"]).nullable(),
    email: z
      .string()
      .trim()
      .email("Nieprawidłowy adres email")
      .max(100)
      .optional()
      .or(z.literal("")),
    phone: z
      .string()
      .regex(PHONE_REGEX, "Numer telefonu musi mieć dokładnie 9 cyfr")
      .optional()
      .or(z.literal("")),

    parentPhone: z
      .string()
      .regex(PHONE_REGEX, "Numer telefonu musi mieć dokładnie 9 cyfr")
      .optional()
      .or(z.literal("")),

    hourlyRate: z
      .number({ message: "Podaj kwotę" })
      .min(0, "Stawka nie może być ujemna")
      .max(9999, "Maksymalna stawka to 9999 zł")
      .nullable()
      .optional(),
    notes: z
      .string()
      .max(1000, "Maksymalnie 1000 znaków")
      .optional()
      .or(z.literal("")),
    scheduleSlots: z.array(scheduleSlotSchema),
  })
  // * Walidacja: LO/Technikum musi mieć wybrany poziom matmy
  .refine(
    (data) =>
      data.educationType === "primary_school" || data.mathLevel !== null,
    {
      message: "Wybierz poziom matematyki",
      path: ["mathLevel"],
    },
  )
  // * Walidacja: klasa musi pasować do typu szkoły
  .refine(
    (data) => {
      if (data.educationType === "primary_school")
        return data.classYear >= 1 && data.classYear <= 8;
      if (data.educationType === "high_school")
        return data.classYear >= 1 && data.classYear <= 4;
      if (data.educationType === "technical_school")
        return data.classYear >= 1 && data.classYear <= 5;
      return false;
    },
    {
      message: "Klasa nie pasuje do wybranego typu szkoły",
      path: ["classYear"],
    },
  );

export type StudentFormData = z.infer<typeof studentFormSchema>;
