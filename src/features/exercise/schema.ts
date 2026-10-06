// ==========================================
// SCHEMA: Walidacja formularzy modułu zadań
// ==========================================
// Schematy Zod dla tworzenia i edycji zadań oraz zestawów.

import { z } from "zod";

// ==========================================
// FORMULARZ: Zadanie (Exercise)
// ==========================================
// * Pola obowiązkowe: title + przynajmniej jeden format treści
// * Pola opcjonalne: solution, description, difficulty, points, tags

export const exerciseFormSchema = z
  .object({
    // * Tytuł zadania - obowiązkowy
    title: z
      .string()
      .trim()
      .min(1, "Tytuł jest wymagany")
      .max(200, "Maksymalnie 200 znaków"),

    // * Treść zadania - przynajmniej jeden z trzech formatów
    contentText: z.string().max(10000).optional().or(z.literal("")),
    contentImages: z.array(z.string()).default([]),
    contentFiles: z.array(z.string()).default([]),

    // * Rozwiązanie - całkowicie opcjonalne
    solutionText: z.string().max(10000).optional().or(z.literal("")),
    solutionImagesUrls: z.array(z.string()).default([]),
    solutionFilesUrls: z.array(z.string()).default([]),

    // * Tagi tematyczne - ID z backendu
    tagIds: z.array(z.string()).default([]),

    // * Opis zadania - opcjonalny, widoczny dla nauczyciela
    description: z.string().max(2000).optional().or(z.literal("")),

    // * Stopień trudności - opcjonalny
    difficulty: z.enum(["easy", "medium", "hard"]).nullable().default(null),

    // * Punktacja - opcjonalna, liczba całkowita >= 0
    points: z
      .number({ message: "Podaj liczbę całkowitą" })
      .int("Podaj liczbę całkowitą")
      .min(0, "Punktacja nie może być ujemna")
      .max(999, "Maksymalnie 999 punktów")
      .nullable()
      .default(null),
  })
  // * Walidacja krzyżowa: przynajmniej jeden format treści musi być niepusty
  .refine(
    (data) => {
      const hasText = !!data.contentText && data.contentText.trim().length > 0;
      const hasImages = data.contentImages.length > 0;
      const hasFiles = data.contentFiles.length > 0;
      return hasText || hasImages || hasFiles;
    },
    {
      message: "Dodaj treść zadania (tekst, zdjęcie lub plik)",
      path: ["contentText"],
    },
  );

export type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

// ==========================================
// FORMULARZ: Zestaw zadań (ExerciseSet)
// ==========================================
// * Pola obowiązkowe: name + przynajmniej jedno zadanie
// * Pola opcjonalne: description, studentId

export const exerciseSetFormSchema = z
  .object({
    // * Nazwa zestawu - obowiązkowa
    name: z
      .string()
      .trim()
      .min(1, "Nazwa zestawu jest wymagana")
      .max(200, "Maksymalnie 200 znaków"),

    // * Opis zestawu - opcjonalny
    description: z.string().max(2000).optional().or(z.literal("")),

    // * Lista ID zadań w zestawie - kolejność ma znaczenie
    exerciseIds: z.array(z.string()).default([]),

    // * Opcjonalne przypisanie do ucznia
    studentId: z.string().optional().or(z.literal("")),
  })
  // * Walidacja: zestaw musi zawierać przynajmniej jedno zadanie
  .refine((data) => data.exerciseIds.length > 0, {
    message: "Dodaj przynajmniej jedno zadanie do zestawu",
    path: ["exerciseIds"],
  });

export type ExerciseSetFormData = z.infer<typeof exerciseSetFormSchema>;
