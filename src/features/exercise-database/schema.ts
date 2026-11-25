// ==========================================
// SCHEMA: Walidacja formularzy modułu zadań
// ==========================================
// * Schematy Zod formularzy bazy pojedynczych zadań.
// * Mapowanie DTO i formularza na payload API żyje w service.ts.

import { z } from "zod";
import {
  EXERCISE_DIFFICULTIES,
  EXERCISE_MATH_LEVELS,
  EXERCISE_SOURCE_TYPES,
  EXERCISE_TYPES,
} from "./types";

// * Metadane API są walidowane przed udostępnieniem ich komponentom.
const metaOption = <T extends z.ZodType<string>>(code: T) =>
  z.object({ code, name: z.string().min(1) });
export const metaSchema = z.object({
  exercise_types: z.array(metaOption(z.enum(EXERCISE_TYPES))),
  source_types: z.array(metaOption(z.enum(EXERCISE_SOURCE_TYPES))),
  math_levels: z.array(metaOption(z.enum(EXERCISE_MATH_LEVELS))),
  difficulties: z.array(metaOption(z.enum(EXERCISE_DIFFICULTIES))),
});
export type ExerciseMeta = z.infer<typeof metaSchema>;

// ==========================================
// STAŁE: Limity plików
// ==========================================

// * Limit frontendu jest niezależny od konfigurowalnego limitu backendu.
export const EXERCISE_FILE_LIMITS = {
  maxFileSizeBytes: 10 * 1024 * 1024,
} as const;

// ==========================================
// SCHEMA: Bloki treści (ExerciseBlockBuilder)
// ==========================================

const exerciseBlockFormSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().optional(),
    type: z.literal("text"),
    content: z
      .string()
      .refine((value) => value.trim().length > 0, "Treść tekstu nie może być pusta")
      .refine((value) => Array.from(value).length <= 10_000, "Maksymalnie 10 000 znaków")
      .refine((value) => !/\\(href|url|includegraphics|html[A-Za-z]*)(?![A-Za-z])/.test(value), "Niedozwolone polecenie LaTeX"),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("image"),
    assetId: z.number().int().positive(),
    caption: z.string().refine((value) => Array.from(value).length <= 300, "Maksymalnie 300 znaków").nullable(),
  }),
  z.object({
    id: z.string().optional(),
    type: z.literal("file"),
    assetId: z.number().int().positive(),
    name: z.string().refine((value) => Array.from(value).length <= 255, "Maksymalnie 255 znaków").nullable(),
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
    .refine((value) => Array.from(value).length <= 200, "Maksymalnie 200 znaków"),
  exerciseTypeCode: z.enum(EXERCISE_TYPES, { message: "Wybierz typ zadania" }),
  mathLevel: z.enum(EXERCISE_MATH_LEVELS, { message: "Nieprawidłowy poziom" }).nullable(),
  difficulty: z.enum(EXERCISE_DIFFICULTIES, { message: "Nieprawidłowa trudność" }).nullable(),
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
  ).refine((blocks) => blocks.reduce((sum, block) => sum + (block.type === "text" ? Array.from(block.content).length : 0), 0) <= 50_000, "Łącznie maksymalnie 50 000 znaków"),
  solution: exerciseBlockListSchema.refine((blocks) => blocks.reduce((sum, block) => sum + (block.type === "text" ? Array.from(block.content).length : 0), 0) <= 50_000, "Łącznie maksymalnie 50 000 znaków").default([]),
});

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>;
