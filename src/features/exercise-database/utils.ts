// ==========================================
// UTILS: Moduł Bazy Zadań
// ==========================================
// * Czyste funkcje i współdzielone stałe domenowe modułu exercise:
// * style trudności, ikony poziomu/źródła, wyszukiwarka z morfologią polską,
// * filtrowanie listy zadań, operacje na drzewie kategorii i wizualizacje zestawów.

import {
  Pencil,
  Backpack,
  BookOpen,
  GraduationCap,
  Landmark,
  User,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_SOURCE_TYPE_LABELS,
  EXERCISE_TYPE_LABELS,
  EXERCISE_DIFFICULTY_LABELS,
  type CategoryNode,
  type Exercise,
  type ExerciseDifficulty,
  type ExerciseListItem,
  type ExerciseMathLevel,
  type ExerciseSourceType,
  type ExerciseType,
  type Tag,
} from "./types";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

// ==========================================
// SORTOWANIE: Wspólny komparator
// ==========================================

// * Najnowsze (po updatedAt) najpierw. Używany przez przeglądarkę zadań i listy zestawów.
export const compareByUpdatedAtDesc = <T extends { readonly updatedAt: Date }>(
  a: T,
  b: T,
): number => b.updatedAt.getTime() - a.updatedAt.getTime();

// ==========================================
// TRUDNOŚĆ: Kolory i etykiety
// ==========================================

export interface DifficultyStyle {
  readonly bg: string;
  readonly text: string;
  readonly dot: string;
  // * Obramowanie badge'a (widok szczegółów)
  readonly border: string;
  // * Lewy pasek wiersza listy zadań
  readonly stripe: string;
}

// ! Klasy Tailwind muszą być zapisane w pełnych literałach
export const DIFFICULTY_STYLES: Record<ExerciseDifficulty, DifficultyStyle> = {
  easy: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
    border: "border-emerald-500/30",
    stripe: "border-l-4 border-l-emerald-500",
  },
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    dot: "bg-amber-500",
    border: "border-amber-500/30",
    stripe: "border-l-4 border-l-amber-500",
  },
  hard: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
    border: "border-destructive/30",
    stripe: "border-l-4 border-l-destructive",
  },
};

// * Styl neutralny dla zadań bez ustawionej trudności
const NO_DIFFICULTY_STYLE: DifficultyStyle = {
  bg: "bg-muted/50",
  text: "text-muted-foreground",
  dot: "bg-muted-foreground",
  border: "border-border/60",
  stripe: "border-l-4 border-l-muted-foreground/30",
};

export const getDifficultyLabel = (
  difficulty: ExerciseDifficulty | null,
): string => {
  if (!difficulty) return "Bez poziomu";
  return EXERCISE_DIFFICULTY_LABELS[difficulty];
};

export const getDifficultyStyle = (
  difficulty: ExerciseDifficulty | null,
): DifficultyStyle => {
  if (!difficulty) return NO_DIFFICULTY_STYLE;
  return DIFFICULTY_STYLES[difficulty];
};

// ==========================================
// POZIOM EDUKACJI (Szkoła / Matura)
// ==========================================

// * Jedyne źródło ikon poziomu — wiersz listy, legenda, widok szczegółów
export const MATH_LEVEL_ICONS: Record<ExerciseMathLevel, LucideIcon> = {
  primary_1_3: Pencil,
  primary_4_8: Backpack,
  highschool_basic: BookOpen,
  highschool_extended: GraduationCap,
};

export const getMathLevelLabel = (level: ExerciseMathLevel | null): string => {
  if (!level) return "";
  return EXERCISE_MATH_LEVEL_LABELS[level];
};

export const getMathLevelStyle = (level: ExerciseMathLevel | null): string => {
  if (level === "primary_1_3")
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (level === "primary_4_8")
    return "bg-teal-500/10 text-teal-700 border-teal-500/20";
  if (level === "highschool_basic")
    return "bg-sky-500/10 text-sky-700 border-sky-500/20";
  if (level === "highschool_extended")
    return "bg-violet-500/10 text-violet-700 border-violet-500/20";
  return "hidden";
};

// ==========================================
// TYP ZADANIA
// ==========================================

export const getExerciseTypeLabel = (type: ExerciseType): string =>
  EXERCISE_TYPE_LABELS[type];

// * Typ zadania ma jeden wspólny styl pigułki (indigo)
export const getExerciseTypeStyle = (): string =>
  "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";

// ==========================================
// ŹRÓDŁO ZADANIA
// ==========================================

// * Jedyne źródło ikon i kolorów źródła — wiersz, legenda, szczegóły, kafelki formularza
export const SOURCE_TYPE_ICONS: Record<ExerciseSourceType, LucideIcon> = {
  cke: Landmark,
  tutor: User,
  generated: Sparkles,
};

export const SOURCE_TYPE_ICON_COLORS: Record<ExerciseSourceType, string> = {
  cke: "text-rose-500",
  tutor: "text-blue-500",
  generated: "text-purple-500",
};

export const getSourceTypeLabel = (source: ExerciseSourceType): string =>
  EXERCISE_SOURCE_TYPE_LABELS[source];

export const getSourceTypeStyle = (source: ExerciseSourceType): string => {
  if (source === "cke")
    return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  if (source === "tutor")
    return "bg-blue-500/10 text-blue-600 border-blue-500/20";
  if (source === "generated")
    return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  return "";
};

// ==========================================
// JĘZYK POLSKI: Odmiana słów
// ==========================================

// * Polska odmiana liczebnika: 1 zadanie, 2-4 zadania, 5-21 zadań, 22-24 zadania...
// * Przykład: formatExerciseCount(12) → "12 zadań", formatExerciseCount(23) → "23 zadania"
export const formatExerciseCount = (count: number): string => {
  if (count === 1) return `${count} zadanie`;

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  // * Wyjątek liczb 12-14: odmieniają się jak 5+ ("zadań")
  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    (lastTwoDigits < 10 || lastTwoDigits >= 20)
  ) {
    return `${count} zadania`;
  }

  return `${count} zadań`;
};

// ==========================================
// TAGI
// ==========================================

// * Id tagu „Inne” — zawsze wyświetlany na końcu listy
export const OTHER_TAG_ID = "t-inne";

// * Filtruje tagi po fragmencie nazwy (case-insensitive, locale pl)
// * i sortuje alfabetycznie z tagiem „Inne” na końcu. Zwraca NOWĄ tablicę.
export const filterAndSortTags = (tags: readonly Tag[], query = ""): Tag[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const filtered = normalizedQuery
    ? tags.filter((tag) =>
        tag.name.toLocaleLowerCase("pl").includes(normalizedQuery),
      )
    : [...tags];

  return filtered.sort((a, b) => {
    if (a.id === OTHER_TAG_ID) return 1;
    if (b.id === OTHER_TAG_ID) return -1;
    return a.name.localeCompare(b.name, "pl");
  });
};

// ==========================================
// ZESTAWY: Obliczenia
// ==========================================

// * Zbiera do `limit` unikalnych tagów z kolejnych zadań zestawu (kolejność zachowana)
export const getPreviewTags = (
  allTags: readonly (readonly Tag[])[],
  limit = 3,
): Tag[] => {
  const seen = new Set<string>();
  const result: Tag[] = [];

  for (const tags of allTags) {
    for (const tag of tags) {
      if (seen.has(tag.id)) continue;
      seen.add(tag.id);
      result.push(tag);
      if (result.length >= limit) return result;
    }
  }

  return result;
};

// ==========================================
// SMART SEARCH: Wyszukiwanie z morfologią polską
// ==========================================

const POLISH_CHAR_MAP: Readonly<Record<string, string>> = {
  ą: "a",
  ć: "c",
  ę: "e",
  ł: "l",
  ń: "n",
  ó: "o",
  ś: "s",
  ź: "z",
  ż: "z",
};

// * Małe litery + usunięcie polskich znaków diakrytycznych
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .split("")
    .map((char) => POLISH_CHAR_MAP[char] ?? char)
    .join("");

const tokenize = (text: string): string[] =>
  normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 0);

// * Dopasowanie słowa zapytania do słowa tekstu:
// * - zapytanie ≤ 4 znaków: prefiks,
// * - dłuższe: wspólny prefiks ≥ 80% długości zapytania (łapie końcówki fleksyjne,
// *   np. „kwadratowe” ↔ „kwadratowa”).
const wordMatches = (queryWord: string, textWord: string): boolean => {
  if (queryWord.length <= 4) {
    return textWord.startsWith(queryWord);
  }

  const minPrefixLength = Math.ceil(queryWord.length * 0.8);
  const maxComparable = Math.min(queryWord.length, textWord.length);

  if (maxComparable < minPrefixLength) return false;

  let commonPrefix = 0;
  for (let i = 0; i < maxComparable; i++) {
    if (queryWord[i] !== textWord[i]) break;
    commonPrefix++;
  }

  return commonPrefix >= minPrefixLength;
};

// * Każde słowo zapytania musi pasować do któregoś słowa z dowolnego pola (AND).
// * Przykład: smartSearch("rownanie kwadr", ["Równanie kwadratowe"]) → true
export const smartSearch = (
  query: string,
  searchableTexts: readonly (string | null | undefined)[],
): boolean => {
  const queryWords = tokenize(query);
  if (queryWords.length === 0) return true;

  const allTextWords: string[] = [];
  for (const text of searchableTexts) {
    if (text) allTextWords.push(...tokenize(text));
  }

  return queryWords.every((queryWord) =>
    allTextWords.some((textWord) => wordMatches(queryWord, textWord)),
  );
};

// ==========================================
// KATEGORIE: Operacje na drzewie
// ==========================================

// * Minimalny kształt węzła drzewa kategorii — pasuje zarówno do CategoryNode,
// * jak i do lekkich typów w komponentach UI (children opcjonalne).
export interface CategoryTreeLike {
  readonly id: string;
  readonly name: string;
  readonly children?: readonly CategoryTreeLike[];
}

// * Rekurencyjnie wyszukuje węzeł po ID (DFS). Zwraca null, gdy nie istnieje.
export const findCategoryNode = (
  nodes: readonly CategoryTreeLike[],
  id: string,
): CategoryTreeLike | null => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findCategoryNode(node.children ?? [], id);
    if (found) return found;
  }
  return null;
};

// * ID wybranej kategorii ORAZ wszystkich jej potomków.
// * Dla ALL_FILTER_VALUE zwraca pusty zbiór (filtr wyłączony).
export const getValidCategoryIds = (
  tree: readonly CategoryTreeLike[],
  selectedId: string,
): Set<string> => {
  if (selectedId === ALL_FILTER_VALUE) return new Set();

  const targetNode = findCategoryNode(tree, selectedId);
  // * Nieznane ID (np. kategoria usunięta) filtrujemy dosłownie po nim samym
  if (!targetNode) return new Set([selectedId]);

  const ids = new Set<string>();
  const collect = (node: CategoryTreeLike): void => {
    ids.add(node.id);
    node.children?.forEach(collect);
  };
  collect(targetNode);

  return ids;
};

// ==========================================
// FILTROWANIE ZADAŃ (wspólne dla bazy i kreatora zestawu)
// ==========================================

// * Sentinel „brak filtra” używany w selectach i drzewie kategorii
export const ALL_FILTER_VALUE = "all" as const;

export interface ExerciseFilters {
  readonly query: string;
  // * ID kategorii (z potomkami) lub ALL_FILTER_VALUE
  readonly category: string;
  readonly difficulty: readonly ExerciseDifficulty[];
  readonly level: readonly ExerciseMathLevel[];
  readonly type: readonly ExerciseType[];
  readonly source: readonly ExerciseSourceType[];
  readonly hasPoints: boolean;
  readonly hasSolution: boolean;
}

export const DEFAULT_EXERCISE_FILTERS: ExerciseFilters = {
  query: "",
  category: ALL_FILTER_VALUE,
  difficulty: [],
  level: [],
  type: [],
  source: [],
  hasPoints: false,
  hasSolution: false,
};

// * Czy użytkownik zmienił jakikolwiek filtr względem wartości domyślnych
export const hasActiveExerciseFilters = (filters: ExerciseFilters): boolean =>
  filters.query.trim() !== "" ||
  filters.category !== ALL_FILTER_VALUE ||
  filters.difficulty.length > 0 ||
  filters.level.length > 0 ||
  filters.type.length > 0 ||
  filters.source.length > 0 ||
  filters.hasPoints ||
  filters.hasSolution;

// * Filtruje zadania wg ExerciseFilters i sortuje od najnowszych.
// * Zwraca NOWĄ tablicę — wejście nie jest mutowane.
export const filterExercises = (
  exercises: readonly ExerciseListItem[],
  filters: ExerciseFilters,
  categoriesTree: readonly CategoryNode[],
): ExerciseListItem[] => {
  // * Zbiór kategorii liczymy RAZ, nie dla każdego zadania
  const validCategoryIds =
    filters.category === ALL_FILTER_VALUE
      ? null
      : getValidCategoryIds(categoriesTree, filters.category);
  const hasQuery = filters.query.trim() !== "";

  return exercises
    .filter((exercise) => {
      if (
        hasQuery &&
        !smartSearch(filters.query, [
          exercise.title,
          ...exercise.tags.map((tag) => tag.name),
          ...exercise.categories.map((category) => category.name),
        ])
      ) {
        return false;
      }
      if (
        validCategoryIds &&
        !exercise.categories.some((category) =>
          validCategoryIds.has(category.id),
        )
      ) {
        return false;
      }
      if (
        filters.difficulty.length > 0 &&
        (!exercise.difficulty || !filters.difficulty.includes(exercise.difficulty))
      ) {
        return false;
      }
      if (
        filters.level.length > 0 &&
        (!exercise.mathLevel || !filters.level.includes(exercise.mathLevel))
      ) {
        return false;
      }
      if (
        filters.type.length > 0 &&
        !filters.type.includes(exercise.exerciseType)
      ) {
        return false;
      }
      if (
        filters.source.length > 0 &&
        !filters.source.includes(exercise.sourceType)
      ) {
        return false;
      }
      if (filters.hasPoints && exercise.points === null) return false;
      if (filters.hasSolution && !exercise.hasSolution) return false;
      return true;
    })
    .sort(compareByUpdatedAtDesc);
};

// ==========================================
// WIZUALIZACJE ZESTAWÓW I FOLDERÓW
// ==========================================

interface SetPalette {
  readonly glow: string;
  readonly hoverBorder: string;
  readonly stripe: string;
  readonly accentHex: string;
  readonly accentText: string;
  readonly hoverBg: string;
}

export type SetVisuals = SetPalette;

const COLOR_PALETTES: readonly SetPalette[] = [
  {
    glow: "bg-blue-500/15",
    hoverBorder: "hover:border-blue-500/50",
    stripe: "border-l-4 border-l-blue-500",
    accentHex: "#3b82f6",
    accentText: "text-blue-600",
    hoverBg: "hover:bg-blue-500/10",
  },
  {
    glow: "bg-emerald-500/15",
    hoverBorder: "hover:border-emerald-500/50",
    stripe: "border-l-4 border-l-emerald-500",
    accentHex: "#10b981",
    accentText: "text-emerald-600",
    hoverBg: "hover:bg-emerald-500/10",
  },
  {
    glow: "bg-violet-500/15",
    hoverBorder: "hover:border-violet-500/50",
    stripe: "border-l-4 border-l-violet-500",
    accentHex: "#8b5cf6",
    accentText: "text-violet-600",
    hoverBg: "hover:bg-violet-500/10",
  },
  {
    glow: "bg-rose-500/15",
    hoverBorder: "hover:border-rose-500/50",
    stripe: "border-l-4 border-l-rose-500",
    accentHex: "#f43f5e",
    accentText: "text-rose-600",
    hoverBg: "hover:bg-rose-500/10",
  },
  {
    glow: "bg-amber-500/15",
    hoverBorder: "hover:border-amber-500/50",
    stripe: "border-l-4 border-l-amber-500",
    accentHex: "#f59e0b",
    accentText: "text-amber-600",
    hoverBg: "hover:bg-amber-500/10",
  },
  {
    glow: "bg-cyan-500/15",
    hoverBorder: "hover:border-cyan-500/50",
    stripe: "border-l-4 border-l-cyan-500",
    accentHex: "#06b6d4",
    accentText: "text-cyan-600",
    hoverBg: "hover:bg-cyan-500/10",
  },
  {
    glow: "bg-fuchsia-500/15",
    hoverBorder: "hover:border-fuchsia-500/50",
    stripe: "border-l-4 border-l-fuchsia-500",
    accentHex: "#d946ef",
    accentText: "text-fuchsia-600",
    hoverBg: "hover:bg-fuchsia-500/10",
  },
  {
    glow: "bg-indigo-500/15",
    hoverBorder: "hover:border-indigo-500/50",
    stripe: "border-l-4 border-l-indigo-500",
    accentHex: "#6366f1",
    accentText: "text-indigo-600",
    hoverBg: "hover:bg-indigo-500/10",
  },
  {
    glow: "bg-teal-500/15",
    hoverBorder: "hover:border-teal-500/50",
    stripe: "border-l-4 border-l-teal-500",
    accentHex: "#14b8a6",
    accentText: "text-teal-600",
    hoverBg: "hover:bg-teal-500/10",
  },
  {
    glow: "bg-pink-500/15",
    hoverBorder: "hover:border-pink-500/50",
    stripe: "border-l-4 border-l-pink-500",
    accentHex: "#ec4899",
    accentText: "text-pink-600",
    hoverBg: "hover:bg-pink-500/10",
  },
];

// * Stabilny kolor zestawu lub folderu wyliczany z hasha jego ID.
// * (ten sam zestaw zawsze dostaje ten sam wygląd).
export const getSetVisuals = (setId: string): SetVisuals => {
  const hash = setId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_PALETTES[hash % COLOR_PALETTES.length];
};

// ==========================================
// SŁOWNIKI ETYKIET: Typowane helpery
// ==========================================

// * Typowane wpisy słownika etykiet (Object.entries gubi typ klucza).
// * Przykład: getLabelEntries(EXERCISE_TYPE_LABELS) → [ExerciseType, string][]
// ! Jedyne miejsce z rzutowaniem kluczy — klucze Record<T, string> z definicji należą do T.
export const getLabelEntries = <T extends string>(
  labels: Readonly<Record<T, string>>,
): [T, string][] =>
  (Object.keys(labels) as T[]).map((key): [T, string] => [key, labels[key]]);

// * Type guard: czy `value` jest kluczem słownika etykiet.
// * Zastępuje rzutowania wartości z <Select> (zawsze string) na typy domenowe.
export const isLabelKey = <T extends string>(
  labels: Readonly<Record<T, string>>,
  value: string,
): value is T => Object.hasOwn(labels, value);

// ==========================================
// DATY I PODSUMOWANIA ZADAŃ
// ==========================================

// * Data i godzina w polskim formacie, np. „12 cze 2025, 09:15”.
// * Wejście to Date zbudowany w mapperach z pełnych timestampów ISO (nie z „YYYY-MM-DD”).
export const formatDateTime = (date: Date): string =>
  format(date, "dd MMM yyyy, HH:mm", { locale: pl });

// * Czy zadanie ma zapisane rozwiązanie (niepusta lista bloków)
export const hasExerciseSolution = (
  exercise: Pick<Exercise, "solution">,
): boolean => (exercise.solution?.length ?? 0) > 0;

// * Suma punktów zadań, które je mają; null, gdy żadne zadanie nie ma punktacji
// * (wtedy UI nie pokazuje sumy zamiast mylącego „0 pkt”).
export const sumExercisePoints = (
  exercises: readonly Pick<Exercise, "points">[],
): number | null => {
  const scored = exercises.filter((exercise) => exercise.points !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, exercise) => sum + (exercise.points ?? 0), 0);
};
