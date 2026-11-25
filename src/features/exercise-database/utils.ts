// ==========================================
// UTILS: Moduł Bazy Zadań
// ==========================================
// * Czyste funkcje i współdzielone stałe domenowe modułu exercise:
// * style trudności, ikony poziomu/źródła, wyszukiwarka z morfologią polską,
// * filtrowanie listy zadań, wybór kategorii i kodowanie wzorów.

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
  type CategoryNode,
  type Exercise,
  type ExerciseDifficulty,
  type ExerciseListItem,
  type ExerciseMathLevel,
  type ExerciseSourceType,
  EXERCISE_SOURCE_TYPE_LABELS,
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

interface DifficultyStyle {
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

// * Etykiety pochodzą z metadanych API; nieznany kod pozostaje widoczny.
export function metaLabel<T extends string>(
  options: readonly { code: T; name: string }[],
  code: T,
): string {
  return options.find((option) => option.code === code)?.name ?? `Nieznana wartość: ${code}`;
}

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

// * Filtruje tagi po fragmencie nazwy (case-insensitive, locale pl)
// * i sortuje alfabetycznie. Zwraca NOWĄ tablicę.
export const filterAndSortTags = (tags: readonly Tag[], query = ""): Tag[] => {
  const normalizedQuery = query.trim().toLocaleLowerCase("pl");
  const filtered = normalizedQuery
    ? tags.filter((tag) =>
        tag.name.toLocaleLowerCase("pl").includes(normalizedQuery),
      )
    : [...tags];

  return filtered.sort((a, b) => a.name.localeCompare(b.name, "pl"));
};

export const isPdfFile = (file: File): boolean =>
  file.type === "application/pdf" ||
  (!["image/png", "image/jpeg", "image/webp"].includes(file.type) && /\.pdf$/i.test(file.name));

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

// * Rodzic jest zaznaczony wizualnie także wtedy, gdy wybrano tylko jego potomka.
export function isCategorySelected(node: CategoryTreeLike, selectedIds: readonly string[]): boolean {
  return selectedIds.includes(node.id) || (node.children ?? []).some((child) => isCategorySelected(child, selectedIds));
}

// * Wybór potomka zastępuje ID przodków; odznaczenie usuwa ID poddrzewa.
export function toggleCategory(
  tree: readonly CategoryTreeLike[],
  selectedIds: readonly string[],
  categoryId: string,
  checked: boolean,
): string[] {
  const subtree = (node: CategoryTreeLike): string[] =>
    [node.id, ...(node.children ?? []).flatMap(subtree)];
  const find = (nodes: readonly CategoryTreeLike[], path: string[] = []): { node: CategoryTreeLike; path: string[] } | null => {
    for (const node of nodes) {
      const next = [...path, node.id];
      if (node.id === categoryId) return { node, path: next };
      const found = find(node.children ?? [], next);
      if (found) return found;
    }
    return null;
  };
  const found = find(tree);
  if (!found) throw new Error("Nieznany dział.");
  // * Przy wyborze usuwamy ID ze ścieżki; przy odznaczeniu tylko ID w poddrzewie.
  const removed = new Set(checked ? found.path : subtree(found.node));
  const next = selectedIds.filter((id) => !removed.has(id));
  return checked ? [...next, categoryId] : next;
}

// * Rekurencyjnie wyszukuje węzeł po ID (DFS). Zwraca null, gdy nie istnieje.
const findCategoryNode = (
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
const getValidCategoryIds = (
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
          ...exercise.categories.map((category) => category.path.join(" ")),
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

export const getExerciseNeighbors = (
  exercises: readonly ExerciseListItem[],
  exerciseId: string,
) => {
  const index = exercises.findIndex((exercise) => exercise.id === exerciseId);
  return {
    index,
    total: exercises.length,
    previous: index > 0 ? exercises[index - 1] : null,
    next: index >= 0 && index < exercises.length - 1 ? exercises[index + 1] : null,
  };
};

// * Liczniki każdej grupy uwzględniają pozostałe dwie grupy, ale nie jej własny wybór.
export const getExerciseFacetCounts = (
  exercises: readonly ExerciseListItem[],
  filters: ExerciseFilters,
  tree: readonly CategoryNode[],
) => {
  const facets: ExerciseFilters = {
    ...DEFAULT_EXERCISE_FILTERS,
    level: filters.level,
    category: filters.category,
    type: filters.type,
  };
  const levelItems = filterExercises(exercises, { ...facets, level: [] }, tree);
  const categoryItems = filterExercises(exercises, { ...facets, category: ALL_FILTER_VALUE }, tree);
  const typeItems = filterExercises(exercises, { ...facets, type: [] }, tree);
  const levels = new Map<ExerciseMathLevel, number>();
  const categories = new Map<string, number>();
  const types = new Map<ExerciseType, number>();
  const parents = new Map<string, string | null>();

  const visit = (nodes: readonly CategoryNode[], parentId: string | null) => {
    for (const node of nodes) {
      parents.set(node.id, parentId);
      categories.set(node.id, 0);
      visit(node.children, node.id);
    }
  };
  visit(tree, null);
  for (const exercise of levelItems) {
    if (exercise.mathLevel) levels.set(exercise.mathLevel, (levels.get(exercise.mathLevel) ?? 0) + 1);
  }
  for (const exercise of typeItems) {
    types.set(exercise.exerciseType, (types.get(exercise.exerciseType) ?? 0) + 1);
  }
  for (const exercise of categoryItems) {
    const counted = new Set<string>();
    for (const category of exercise.categories) {
      let id: string | null = category.id;
      while (id !== null && parents.has(id) && !counted.has(id)) {
        counted.add(id);
        id = parents.get(id) ?? null;
      }
    }
    for (const id of counted) categories.set(id, (categories.get(id) ?? 0) + 1);
  }
  return {
    levels, categories, types,
    allLevels: levelItems.length,
    allCategories: categoryItems.length,
    allTypes: typeItems.length,
  };
};

// ==========================================
// WZORY: Tekst i LaTeX w jednym bloku API
// ==========================================

export type MathContentPart =
  | { type: "text"; text: string }
  | { type: "math"; latex: string; display?: boolean };

// * Pojedynczy $ zamyka wzór inline, podwójny $$ blokowy; escapowany $ go nie zamyka.
// * Wzór inline nie może przekraczać końca wiersza, a pusty lub niedomknięty pozostaje tekstem.
function findMathEnd(value: string, start: number): number | null {
  const display = value[start + 1] === "$";
  const width = display ? 2 : 1;
  for (let end = start + width; end < value.length; end++) {
    if (!display && (value[end] === "\n" || value[end] === "\r")) return null;
    if (value[end] !== "$") continue;
    if (display && value[end + 1] !== "$") continue;
    let slashes = 0;
    for (let i = end - 1; i > start && value[i] === "\\"; i--) slashes++;
    if (slashes % 2 !== 0) continue;
    const latex = value.slice(start + width, end);
    if (!latex) return null;
    return end;
  }
  return null;
}

// * Rozdziela tekst API na tekst i wzory, zachowując rodzaj znacznika oraz kolejność.
export function decodeMathContent(value: string): MathContentPart[] {
  const parts: MathContentPart[] = [];
  let text = "";
  let index = 0;

  while (index < value.length) {
    let slashes = 0;
    while (value[index + slashes] === "\\") slashes++;
    if (slashes && value[index + slashes] !== "$") {
      text += "\\".repeat(slashes);
      index += slashes;
      continue;
    }

    const dollar = index + slashes;
    if (value[dollar] !== "$") {
      text += value[index];
      index++;
      continue;
    }
    // * Nieparzysta liczba ukośników oznacza dosłowny dolar, nie początek wzoru.
    if (slashes % 2 === 1) {
      text += "\\".repeat((slashes - 1) / 2) + "$";
      index = dollar + 1;
      continue;
    }

    const end = findMathEnd(value, dollar);
    if (end !== null) {
      text += "\\".repeat(slashes / 2);
      if (text) parts.push({ type: "text", text });
      const display = value[dollar + 1] === "$";
      const width = display ? 2 : 1;
      parts.push({ type: "math", latex: value.slice(dollar + width, end), display });
      text = "";
      index = end + width;
    } else {
      text += "\\".repeat(slashes) + "$";
      index = dollar + 1;
      if (value[index] === "$") {
        text += "$";
        index++;
      }
    }
  }
  if (text || parts.length === 0) parts.push({ type: "text", text });
  return parts;
}

// * Serializacja odwraca podział, escapując dosłowne dolary i ukośniki przed wzorem.
export function encodeMathContent(parts: readonly MathContentPart[]): string {
  let result = "";
  let text = "";
  const appendText = (beforeMath: boolean) => {
    let escaped = text.replace(/(\\*)\$/g, (_, slashes: string) => "\\".repeat(slashes.length * 2 + 1) + "$");
    if (beforeMath) escaped = escaped.replace(/\\+$/, (slashes) => slashes + slashes);
    result += escaped;
    text = "";
  };
  for (const part of parts) {
    if (part.type === "text") text += part.text;
    else {
      appendText(true);
      const delimiter = part.display ? "$$" : "$";
      result += `${delimiter}${part.latex}${delimiter}`;
    }
  }
  appendText(false);
  return result;
}

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
