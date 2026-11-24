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

export type ExerciseTextStyle = "normal" | "intro" | "instruction";

export type ApiExerciseBlock =
  | { type: "text"; text: string; style?: ExerciseTextStyle }
  | { type: "image"; asset_id: number; caption?: string | null; url: string }
  | { type: "file"; asset_id: number; name?: string | null; url: string };

export type ExerciseBlock =
  | { id: string; type: "text"; content: string; style: ExerciseTextStyle }
  | { id: string; type: "image"; assetId: number; caption: string | null }
  | { id: string; type: "file"; assetId: number; name: string | null };

export type ExerciseBlockPayload =
  | { type: "text"; text: string; style: ExerciseTextStyle }
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
}

// * Węzeł drzewa kategorii (do renderowania hierarchii)
export interface CategoryNode extends Category {
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
  set_count: number;
  has_solution: boolean;
  updated_at: string;
}

export interface ApiExercisePage {
  items: ApiExerciseListItem[];
  total: number;
}

export interface ApiExercise extends Omit<ApiExerciseListItem, "has_solution"> {
  content: ApiExerciseBlock[];
  solution: ApiExerciseBlock[] | null;
  grading_rules_url: string | null;
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
  gradingRulesUrl: string | null;
  tags: Tag[];
  categories: Category[];
  isOwner: boolean;
  setCount: number;
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
  setCount: number;
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
