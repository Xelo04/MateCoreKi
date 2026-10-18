// ==========================================
// SCHEMA: Walidacja formularzy modułu zadań
// ==========================================

import { z } from "zod";
import type {
  ExerciseType,
  ExerciseSourceType,
  ExerciseMathLevel,
  ExerciseDifficulty,
} from "./types";

// * Uproszczony schemat na potrzeby testów Listy,
// * docelowo zostanie rozwinięty o tablice bloków (ExerciseBlockPayload).
export const exerciseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tytuł jest wymagany")
    .max(200, "Maksymalnie 200 znaków"),
  sourceTypeCode: z.custom<ExerciseSourceType>(),
  exerciseTypeCode: z.custom<ExerciseType>(),
  mathLevel: z.custom<ExerciseMathLevel | null>().nullable(),
  difficulty: z.custom<ExerciseDifficulty | null>().nullable(),
  points: z.number().nullable(),
  tagIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
  // Tymczasowe
  blocks: z.any(),
});

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

export const exerciseSetFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nazwa zestawu jest wymagana")
    .max(200, "Maksymalnie 200 znaków"),
  description: z.string().max(2000).optional().or(z.literal("")),
  items: z
    .array(z.object({ exercise_id: z.string(), position: z.number() }))
    .default([]),
});

export type ExerciseSetFormData = z.infer<typeof exerciseSetFormSchema>;
