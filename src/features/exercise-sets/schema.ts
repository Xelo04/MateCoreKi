// ==========================================
// SCHEMA: Formularz zestawu zadań
// ==========================================

import { z } from "zod";

export const exerciseSetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nazwa zestawu jest wymagana")
    .max(200, "Maksymalnie 200 znaków"),
  description: z
    .string()
    .trim()
    .max(2000, "Maksymalnie 2000 znaków")
    .optional(),
  folderId: z.string().nullable(),
  items: z
    .array(
      z.object({
        exercise_id: z.string().min(1),
        position: z.number().int().min(0),
      }),
    )
    .min(1, "Zestaw musi zawierać co najmniej jedno zadanie"),
});

export type ExerciseSetFormData = z.infer<typeof exerciseSetFormSchema>;
