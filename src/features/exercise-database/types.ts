// ==========================================
// TYPY: Moduł Bazy Zadań
// ==========================================
// Definiuje kontrakty danych dla bazy zadań nauczyciela:

// ==========================================
// TYPY ENUMERACYJNE
// ==========================================

// * Stopień trudności zadania (3 poziomy)
export const EXERCISE_DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type ExerciseDifficulty = (typeof EXERCISE_DIFFICULTIES)[number];

// * Poziom edukacji matematycznej
export const EXERCISE_MATH_LEVELS = ["primary_1_3", "primary_4_8", "highschool_basic", "highschool_extended"] as const;
export type ExerciseMathLevel = (typeof EXERCISE_MATH_LEVELS)[number];

// * Typ zadania - wymagany
export const EXERCISE_TYPES = ["open", "closed", "true_false", "multiple", "fill", "matching", "proof", "other"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];

// * Typ źródła zadania
export const EXERCISE_SOURCE_TYPES = ["cke", "tutor", "generated"] as const;
export type ExerciseSourceType = (typeof EXERCISE_SOURCE_TYPES)[number];

export const EXERCISE_SOURCE_TYPE_LABELS: Record<ExerciseSourceType, string> = {
  cke: "CKE",
  tutor: "Własne",
  generated: "AI",
};

// ==========================================
// BLOKI TREŚCI (DISCRIMINATED UNIONS)
// ==========================================

export type ApiExerciseBlock =
  | { type: "text"; text: string }
  | { type: "image"; asset_id: number; caption?: string | null; url: string }
  | { type: "file"; asset_id: number; name?: string | null; url: string };

export type ExerciseBlock =
  | { id: string; type: "text"; content: string }
  | { id: string; type: "image"; assetId: number; caption: string | null }
  | { id: string; type: "file"; assetId: number; name: string | null };

export type ExerciseBlockPayload =
  | { type: "text"; text: string }
  | { type: "image"; asset_id: number; caption: string | null }
  | { type: "file"; asset_id: number; name: string | null };

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
  path: string[];
}

// * Węzeł drzewa kategorii (do renderowania hierarchii)
export interface CategoryNode extends Omit<Category, "path"> {
  parentId: string | null;
  children: CategoryNode[];
}

// ==========================================
// DTO Z API
// ==========================================

export interface ApiTag {
  id: number;
  name: string;
  is_system: boolean;
}

export interface ApiCategoryRef {
  id: number;
  name: string;
  path: string[];
}

export interface ApiCategoryNode {
  id: number;
  name: string;
  slug: string;
  children: ApiCategoryNode[];
}

export interface ApiExerciseListItem {
  id: number;
  title: string;
  source_type: ExerciseSourceType;
  exercise_type: ExerciseType;
  math_level: ExerciseMathLevel | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  tags: ApiTag[];
  categories: ApiCategoryRef[];
  is_owner: boolean;
  has_solution: boolean;
  updated_at: string;
}

export interface ApiExercise extends Omit<ApiExerciseListItem, "has_solution"> {
  content: ApiExerciseBlock[];
  solution: ApiExerciseBlock[] | null;
  created_at: string;
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
  tags: Tag[];
  categories: Category[];
  isOwner: boolean;
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
  isOwner: boolean;
  updatedAt: Date;
}

// ==========================================
// PAYLOADY (DO WYSYŁKI)
// ==========================================

export interface ExerciseCreatePayload {
  exercise_type: ExerciseType;
  title: string;
  math_level: ExerciseMathLevel | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  content: ExerciseBlockPayload[];
  solution: ExerciseBlockPayload[] | null;
  tag_ids: number[];
  category_ids: number[];
}
