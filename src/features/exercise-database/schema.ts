// ==========================================
// SCHEMA: Walidacja formularzy modułu zadań
// ==========================================
// * Schematy Zod formularzy bazy pojedynczych zadań.
// * Mapowanie DTO ↔ model domenowy NIE należy tutaj — żyje w types.ts (mappery)
// * oraz service.ts (mapowanie formularza na payload API).

import { z } from "zod";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_TYPE_LABELS,
  type ExerciseDifficulty,
  type ExerciseMathLevel,
  type ExerciseType,
} from "./types";

// ==========================================
// STAŁE: Limity plików
// ==========================================

// * Limit odpowiada domyślnemu limitowi przesyłania plików backendu.
export const EXERCISE_FILE_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024,
} as const;

// ==========================================
// HELPERY WEWNĘTRZNE
// ==========================================

// * Waliduje, że wartość jest kluczem słownika etykiet (np. EXERCISE_TYPE_LABELS).
// * Zastępuje poprzednie z.custom<T>() sprawdzające tylko „niepusty string”.
function labelKeySchema<T extends string>(
  labels: Readonly<Record<T, string>>,
  message: string,
) {
  return z.custom<T>(
    (value) => typeof value === "string" && Object.hasOwn(labels, value),
    { message },
  );
}

// ==========================================
// SCHEMA: Bloki treści (ExerciseBlockBuilder)
// ==========================================

export const exerciseBlockFormSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().optional(),
    type: z.literal("text"),
    content: z
      .string()
      .refine((value) => value.trim().length > 0, "Treść tekstu nie może być pusta")
      .max(10_000, "Maksymalnie 10 000 znaków"),
    style: z.enum(["normal", "intro", "instruction"]),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("image"),
    assetId: z.number().int().positive(),
    caption: z.string().max(300).nullable(),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("file"),
    assetId: z.number().int().positive(),
    name: z.string().max(255).nullable(),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("pending"),
    file: z.custom<File>((value) => typeof File !== "undefined" && value instanceof File, "Wybierz plik"),
  }),
]);

export type ExerciseFormBlockData = z.infer<typeof exerciseBlockFormSchema>;

// * Każda sekcja ma limit liczby bloków zgodny z API.
const exerciseBlockListSchema = z.array(exerciseBlockFormSchema).max(100, "Maksymalnie 100 bloków w sekcji");

// ==========================================
// SCHEMA: Formularz zadania (ExerciseForm)
// ==========================================

export const exerciseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tytuł jest wymagany")
    .max(200, "Maksymalnie 200 znaków"),
  exerciseTypeCode: labelKeySchema<ExerciseType>(
    EXERCISE_TYPE_LABELS,
    "Wybierz typ zadania",
  ),
  mathLevel: labelKeySchema<ExerciseMathLevel>(
    EXERCISE_MATH_LEVEL_LABELS,
    "Nieprawidłowy poziom",
  ).nullable(),
  difficulty: labelKeySchema<ExerciseDifficulty>(
    EXERCISE_DIFFICULTY_LABELS,
    "Nieprawidłowa trudność",
  ).nullable(),
  // * null = zadanie bez punktacji. NaN (z setValueAs w formularzu) jest odrzucane przez z.number().
  points: z
    .number({ message: "Punkty muszą być liczbą" })
    .int("Punkty muszą być liczbą całkowitą")
    .min(0, "Punkty nie mogą być ujemne")
    .max(100, "Maksymalnie 100 punktów")
    .nullable(),
  tagIds: z.array(z.string()).max(7, "Wybierz maksymalnie 7 tagów").default([]),
  categoryIds: z.array(z.string()).min(1, "Wybierz co najmniej jeden dział").max(10, "Wybierz maksymalnie 10 działów"),
  content: exerciseBlockListSchema.min(
    1,
    "Dodaj przynajmniej jeden blok treści zadania",
  ),
  solution: exerciseBlockListSchema.default([]),
});

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>;
