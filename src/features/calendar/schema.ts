// ==========================================
// SCHEMA: Operacje na lekcji (modal kalendarza)
// ==========================================
// Schematy walidacyjne formularzy kalendarza za pomocą biblioteki Zod.

import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// * Schema dla anulowania lekcji
export const lessonCancelSchema = z.object({
  whoCancelled: z.enum(["tutor", "student"], {
    message: "Wybierz kto odwołał lekcję",
  }),
  tutorNotes: z
    .string()
    .max(2000, "Maksymalnie 2000 znaków")
    .optional()
    .or(z.literal("")),
});

export type LessonCancelData = z.infer<typeof lessonCancelSchema>;

// * Schema dla przesunięcia lekcji
export const lessonMoveSchema = z
  .object({
    scope: z.enum(["single", "all"]),
    date: z
      .string()
      .regex(DATE_REGEX, "Nieprawidłowy format daty")
      .optional()
      .or(z.literal("")),
    dayOfWeek: z.number().min(1).max(7).optional(),
    recurrence: z.enum(["none", "weekly", "biweekly"]).optional(),
    startTime: z.string().regex(TIME_REGEX, "Format czasu musi wynosić GG:MM"),
    durationMins: z
      .number({ message: "Podaj poprawny czas trwania" })
      .int()
      .min(15, "Minimum 15 minut")
      .max(300, "Maksymalnie 300 minut")
      .optional(),
    tutorNotes: z
      .string()
      .max(2000, "Maksymalnie 2000 znaków")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.scope === "single") return !!data.date;
      return true;
    },
    { message: "Wybierz datę spotkania", path: ["date"] },
  )
  .refine(
    (data) => {
      if (data.scope === "all") return !!data.dayOfWeek;
      return true;
    },
    { message: "Wybierz dzień tygodnia", path: ["dayOfWeek"] },
  )
  .refine(
    (data) => {
      if (data.scope === "all") return !!data.recurrence;
      return true;
    },
    { message: "Wybierz regularność", path: ["recurrence"] },
  );

export type LessonMoveData = z.infer<typeof lessonMoveSchema>;

// * Schema wyłącznie dla edycji notatek i tematów lekcji
export const lessonNotesSchema = z.object({
  topic: z
    .string()
    .max(200, "Temat może mieć maksymalnie 200 znaków")
    .optional()
    .or(z.literal("")),
  tutorNotes: z
    .string()
    .max(2000, "Maksymalnie 2000 znaków")
    .optional()
    .or(z.literal("")),
});

export type LessonNotesData = z.infer<typeof lessonNotesSchema>;

// * Baza schematu jako czysty ZodObject (bez refinements) — pozwala na użycie .omit()
export const lessonCreateBaseSchema = z.object({
  studentId: z.string({ message: "Wybierz ucznia" }).min(1, "Wybierz ucznia"),
  recurrence: z.enum(["none", "weekly", "biweekly"]),
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
  date: z
    .string()
    .regex(DATE_REGEX, "Nieprawidłowa data")
    .optional()
    .or(z.literal("")),
  startTime: z
    .string({ message: "Wybierz godzinę" })
    .min(1, "Wybierz godzinę")
    .regex(TIME_REGEX, "Format GG:MM (np. 16:30)"),
  durationMins: z
    .number({ message: "Podaj czas trwania" })
    .int("Podaj liczbę całkowitą")
    .min(15, "Minimum 15 minut")
    .max(300, "Maks. 300 minut"),
  topic: z.string().max(200).optional().or(z.literal("")),
  tutorNotes: z.string().max(2000).optional().or(z.literal("")),
});

// * Pełny schemat tworzenia lekcji z walidacją krzyżową (używany w LessonFormModal)
export const lessonCreateSchema = lessonCreateBaseSchema
  .refine(
    (data) => data.recurrence === "none" || data.dayOfWeek !== undefined,
    { message: "Wybierz dzień tygodnia", path: ["dayOfWeek"] },
  )
  .refine((data) => data.recurrence !== "none" || !!data.date, {
    message: "Wybierz datę spotkania",
    path: ["date"],
  });

export type LessonCreateData = z.infer<typeof lessonCreateSchema>;

// * Schemat dla osadzonego formularza lekcji (używany w LessonForm)
export const lessonFormSchema = lessonCreateBaseSchema
  .omit({ studentId: true })
  .refine(
    (data) => data.recurrence === "none" || data.dayOfWeek !== undefined,
    { message: "Wybierz dzień tygodnia", path: ["dayOfWeek"] },
  )
  .refine((data) => data.recurrence !== "none" || !!data.date, {
    message: "Wybierz datę spotkania",
    path: ["date"],
  });

export type LessonFormData = z.infer<typeof lessonFormSchema>;
