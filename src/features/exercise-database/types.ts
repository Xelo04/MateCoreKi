// ==========================================
// TYPY: Moduł Bazy Zadań
// ==========================================
// Definiuje kontrakty danych dla bazy zadań nauczyciela:

// ==========================================
// TYPY ENUMERACYJNE
// ==========================================

// * Stopień trudności zadania (3 poziomy)
export type ExerciseDifficulty = "easy" | "medium" | "hard";

// * Poziom edukacji matematycznej
export type ExerciseMathLevel =
  | "primary_1_3"
  | "primary_4_8"
  | "highschool_basic"
  | "highschool_extended";

// * Typ zadania - wymagany
export type ExerciseType =
  | "open"
  | "closed"
  | "true_false"
  | "multiple"
  | "fill"
  | "matching"
  | "proof"
  | "other";

// * Typ źródła zadania
export type ExerciseSourceType = "cke" | "tutor" | "generated";

// ==========================================
// SŁOWNIKI I MAPY LABELI (POLSKIE TŁUMACZENIA)
// ==========================================

export const EXERCISE_DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  easy: "Łatwe",
  medium: "Średnie",
  hard: "Trudne",
};

export const EXERCISE_MATH_LEVEL_LABELS: Record<ExerciseMathLevel, string> = {
  primary_1_3: "Szkoła Podstawowa (1-3)",
  primary_4_8: "Szkoła Podstawowa (4-8)",
  highschool_basic: "Maturalne (Podstawa)",
  highschool_extended: "Maturalne (Rozszerzenie)",
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  open: "Otwarte",
  closed: "Zamknięte",
  true_false: "Prawda / Fałsz",
  multiple: "Wielokrotny wybór",
  fill: "Luka do wypełnienia",
  matching: "Dopasowywanie",
  proof: "Na dowodzenie",
  other: "Inne",
};

export const EXERCISE_SOURCE_TYPE_LABELS: Record<ExerciseSourceType, string> = {
  cke: "CKE",
  tutor: "Własne",
  generated: "AI",
};

// ==========================================
// BLOKI TREŚCI (DISCRIMINATED UNIONS)
// ==========================================

/** Bloki w formie odbieranej z API (posiadają URL do wyświetlenia) */
export type ApiExerciseBlock =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "image"; url: string; asset_id: number }
  | { id: string; type: "pdf"; url: string; asset_id: number };

/** Bloki na potrzeby frontendu */
export type ExerciseBlock =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "image"; url: string; assetId: number }
  | { id: string; type: "pdf"; url: string; assetId: number };

/** Bloki wysyłane do API (wymagają asset_id dla plików, nie url) */
export type ExerciseBlockPayload =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "image"; asset_id: number }
  | { id: string; type: "pdf"; asset_id: number };

// ==========================================
// ENTITY POMOCNICZE
// ==========================================

// * Tag
export interface Tag {
  id: string;
  name: string;
  isGlobal: boolean; // Zmapowane z owner_tutor_id === null
}

// * Kategoria
export interface Category {
  id: string;
  name: string;
  parentId: string | null;
}

// * Węzeł drzewa kategorii (do renderowania hierarchii)
export interface CategoryNode extends Category {
  children: CategoryNode[];
}

// ==========================================
// DTO Z API
// ==========================================

export interface ApiExercise {
  id: string;
  title: string;
  source_type_code: ExerciseSourceType;
  exercise_type_code: ExerciseType;
  math_level: ExerciseMathLevel | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  content: ApiExerciseBlock[];
  solution: ApiExerciseBlock[] | null;
  grading_rules_url: string | null;
  tags: { id: string; name: string; is_global: boolean }[];
  categories: { id: string; name: string; parent_id: string | null }[];
  created_at: string;
  updated_at: string;
}

// ==========================================
// MODELE DOMENOWE FRONTEND
// ==========================================

export interface Exercise {
  id: string;
  title: string;
  sourceType: ExerciseSourceType;
  exerciseType: ExerciseType;
  mathLevel: ExerciseMathLevel | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  content: ExerciseBlock[];
  solution: ExerciseBlock[] | null;
  gradingRulesUrl: string | null;
  tags: Tag[];
  categories: Category[];
  createdAt: Date;
  updatedAt: Date;
}

// ==========================================
// MODELE WIDOKU (LISTY)
// ==========================================

export interface ExerciseListItem {
  id: string;
  title: string;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  mathLevel: ExerciseMathLevel | null;
  exerciseType: ExerciseType;
  sourceType: ExerciseSourceType;
  tags: Tag[];
  categories: Category[];
  hasSolution: boolean;
  updatedAt: Date;
}

// ==========================================
// PAYLOADY (DO WYSYŁKI)
// ==========================================

export interface ExerciseCreatePayload {
  source_type_code: ExerciseSourceType;
  exercise_type_code: ExerciseType;
  title: string;
  math_level: ExerciseMathLevel | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  content: ExerciseBlockPayload[];
  solution: ExerciseBlockPayload[] | null;
  grading_rules_asset_id: number | null;
  tag_ids: string[];
  category_ids: string[];
}

export type ExerciseUpdatePayload = Partial<ExerciseCreatePayload>;

// ==========================================
// MAPPERY
// ==========================================

/**
 * Mapuje blok pobrany z API na format frontendowy (camelCase).
 */
const mapApiBlockToExerciseBlock = (
  apiBlock: ApiExerciseBlock,
): ExerciseBlock => {
  if (apiBlock.type === "text") {
    return { id: apiBlock.id, type: "text", content: apiBlock.content };
  }
  return {
    id: apiBlock.id,
    type: apiBlock.type,
    url: apiBlock.url,
    assetId: apiBlock.asset_id,
  };
};

/**
 * Zmienia ApiExercise na obiekt używany w całej aplikacji (uwaga: tags i categories
 * muszą zostać dograne w warstwie serwisu na froncie, jeśli API zwraca tylko IDs).
 */
export const mapApiExerciseToExercise = (api: ApiExercise): Exercise => {
  return {
    id: api.id,
    sourceType: api.source_type_code,
    exerciseType: api.exercise_type_code,
    title: api.title,
    mathLevel: api.math_level,
    difficulty: api.difficulty,
    points: api.points,
    content: api.content.map(mapApiBlockToExerciseBlock),
    solution: api.solution
      ? api.solution.map(mapApiBlockToExerciseBlock)
      : null,
    gradingRulesUrl: api.grading_rules_url,
    tags: api.tags.map((t) => ({
      id: t.id,
      name: t.name,
      isGlobal: t.is_global,
    })),
    categories: api.categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
    })),

    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
};

/**
 * Mapuje bezpośrednio z formatu API na lekki model używany w liście zadań.
 */
export const mapApiExerciseToListItem = (
  api: ApiExercise,
): ExerciseListItem => {
  return {
    id: api.id,
    title: api.title,
    difficulty: api.difficulty,
    points: api.points,
    mathLevel: api.math_level,
    exerciseType: api.exercise_type_code,
    sourceType: api.source_type_code,
    tags: api.tags.map((t) => ({
      id: t.id,
      name: t.name,
      isGlobal: t.is_global,
    })),
    categories: api.categories.map((c) => ({
      id: c.id,
      name: c.name,
      parentId: c.parent_id,
    })),
    hasSolution: (api.solution?.length ?? 0) > 0,
    updatedAt: new Date(api.updated_at),
  };
};
