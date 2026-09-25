// ==========================================
// SCHEMA: Operacje na lekcji (modal kalendarza)
// ==========================================

import { z } from "zod";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// * Tworzenie lekcji ad-hoc LUB materializacja z reguły
export const lessonUpsertSchema = z.object({
  studentId: z.string().min(1, "Wybierz ucznia"),
  date: z.string().regex(DATE_REGEX, "Nieprawidłowa data"),
  startTime: z.string().regex(TIME_REGEX, "Format GG:MM"),
  durationMins: z
    .number({ message: "Podaj czas trwania" })
    .int()
    .min(15, "Minimum 15 min")
    .max(300, "Maks. 300 min"),
  topic: z.string().max(200).optional().or(z.literal("")),
  tutorNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type LessonUpsertData = z.infer<typeof lessonUpsertSchema>;

// * Odwołanie
export const lessonCancelSchema = z.object({
  whoCancelled: z.enum(["tutor", "student"], {
    message: "Wybierz kto odwołał",
  }),
  tutorNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type LessonCancelData = z.infer<typeof lessonCancelSchema>;

// * Przesunięcie
export const lessonMoveSchema = z.object({
  date: z.string().regex(DATE_REGEX, "Nieprawidłowa data"),
  startTime: z.string().regex(TIME_REGEX, "Format GG:MM"),
  durationMins: z
    .number({ message: "Podaj czas trwania" })
    .int()
    .min(15)
    .max(300)
    .optional(),
  tutorNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type LessonMoveData = z.infer<typeof lessonMoveSchema>;

// * Notatka / temat (bez zmiany terminu)
export const lessonNotesSchema = z.object({
  topic: z.string().max(200).optional().or(z.literal("")),
  tutorNotes: z.string().max(2000).optional().or(z.literal("")),
});

export type LessonNotesData = z.infer<typeof lessonNotesSchema>;
