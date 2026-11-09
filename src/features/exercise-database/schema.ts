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
  EXERCISE_SOURCE_TYPE_LABELS,
  EXERCISE_TYPE_LABELS,
  type ExerciseDifficulty,
  type ExerciseMathLevel,
  type ExerciseSourceType,
  type ExerciseType,
} from "./types";

// ==========================================
// STAŁE: Limity plików
// ==========================================

// * Jedno źródło prawdy dla limitów — używane przez schemat, ExerciseBlockBuilder i actions.ts
export const EXERCISE_FILE_LIMITS = {
  // * Maksymalna liczba plików (obrazy + PDF) w jednej sekcji (treść LUB rozwiązanie)
  maxFilesPerSection: 5,
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
      .trim()
      .min(1, "Treść tekstu nie może być pusta")
      .max(10_000, "Maksymalnie 10 000 znaków"),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("image"),
    url: z.string().min(1, "Brak adresu pliku"),
    assetId: z.number().int(),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("pdf"),
    url: z.string().min(1, "Brak adresu pliku"),
    assetId: z.number().int(),
  }),
]);

export type ExerciseFormBlockData = z.infer<typeof exerciseBlockFormSchema>;

// * Lista bloków z limitem plików. Błąd limitu trafia do errors.<pole>.root.message,
// * skąd odczytuje go ExerciseBlockBuilder.
const exerciseBlockListSchema = z
  .array(exerciseBlockFormSchema)
  .refine(
    (blocks) =>
      blocks.filter((block) => block.type !== "text").length <=
      EXERCISE_FILE_LIMITS.maxFilesPerSection,
    {
      message: `Maksymalnie ${EXERCISE_FILE_LIMITS.maxFilesPerSection} plików w sekcji`,
    },
  );

// ==========================================
// SCHEMA: Formularz zadania (ExerciseForm)
// ==========================================

export const exerciseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Tytuł jest wymagany")
    .max(200, "Maksymalnie 200 znaków"),
  sourceTypeCode: labelKeySchema<ExerciseSourceType>(
    EXERCISE_SOURCE_TYPE_LABELS,
    "Wybierz źródło zadania",
  ),
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
    .max(999, "Maksymalnie 999 punktów")
    .nullable(),
  tagIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).min(1, "Wybierz co najmniej jeden dział"),
  content: exerciseBlockListSchema.min(
    1,
    "Dodaj przynajmniej jeden blok treści zadania",
  ),
  solution: exerciseBlockListSchema.default([]),
});

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>;
