// ==========================================
// UTILS: Moduł Bazy Zadań
// ==========================================
// Funkcje pomocnicze do formatowania, obliczeń i wyszukiwania.

import {
  Sigma,
  Calculator,
  Percent,
  Divide,
  Hash,
  Asterisk,
  FunctionSquare,
  Binary,
  Pi,
  Infinity as InfinityIcon,
  Equal,
  Minus,
  Plus,
  SquareRadical,
  X,
  Superscript,
  BarChart,
  LineChart,
  PieChart,
  Torus,
  TriangleRight,
  Hexagon,
  Cone,
  Cylinder,
  Cuboid,
  type LucideIcon,
} from "lucide-react";
import type { ExerciseDifficulty, Tag, ExerciseSet } from "./types";
import { EXERCISE_DIFFICULTY_LABELS } from "./types";

// ==========================================
// TRUDNOŚĆ: Kolory i etykiety
// ==========================================

export const DIFFICULTY_STYLES: Record<
  ExerciseDifficulty,
  { bg: string; text: string; dot: string }
> = {
  easy: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  medium: {
    bg: "bg-amber-500/10",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  hard: {
    bg: "bg-destructive/10",
    text: "text-destructive",
    dot: "bg-destructive",
  },
};

// * Kolor paska bocznego karty na podstawie poziomu trudności
export const DIFFICULTY_BAR_COLORS: Record<ExerciseDifficulty, string> = {
  easy: "bg-emerald-500",
  medium: "bg-amber-500",
  hard: "bg-destructive",
};

export const getDifficultyLabel = (
  difficulty: ExerciseDifficulty | null,
): string => {
  if (!difficulty) return "Bez poziomu";
  return EXERCISE_DIFFICULTY_LABELS[difficulty];
};

export const getDifficultyStyle = (
  difficulty: ExerciseDifficulty | null,
): { bg: string; text: string; dot: string } => {
  if (!difficulty) {
    return {
      bg: "bg-muted/50",
      text: "text-muted-foreground",
      dot: "bg-muted-foreground",
    };
  }
  return DIFFICULTY_STYLES[difficulty];
};

// * Zwraca kolor paska bocznego wiersza dla danej trudności (lub szary jeśli brak)
export const getDifficultyBarColor = (
  difficulty: ExerciseDifficulty | null,
): string => {
  if (!difficulty) return "bg-muted-foreground/30";
  return DIFFICULTY_BAR_COLORS[difficulty];
};

// ==========================================
// JĘZYK POLSKI: Odmiana słów
// ==========================================

// * Poprawna odmiana słowa "zadanie" w zależności od liczby
// * Przykłady: 1 zadanie, 2 zadania, 5 zadań, 12 zadań, 22 zadania
export const formatExerciseCount = (count: number): string => {
  if (count === 1) return `${count} zadanie`;

  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

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

export const formatTagNames = (tags: Tag[]): string =>
  tags.map((t) => t.name).join(", ");

// ==========================================
// ZESTAWY: Obliczenia
// ==========================================

export const countSetsForExercise = (
  exerciseId: string,
  sets: readonly ExerciseSet[],
): number => sets.filter((s) => s.exerciseIds.includes(exerciseId)).length;

export const getPreviewTags = (allTags: Tag[][], limit = 3): Tag[] => {
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

export const getContentFormatsLabel = (
  hasText: boolean,
  hasImages: boolean,
  hasFiles: boolean,
): string => {
  const formats: string[] = [];
  if (hasText) formats.push("Tekst");
  if (hasImages) formats.push("Zdjęcia");
  if (hasFiles) formats.push("Pliki");
  return formats.length > 0 ? formats.join(", ") : "Brak treści";
};

// ==========================================
// SMART SEARCH: Wyszukiwanie z morfologią polską
// ==========================================
// * Algorytm przeszukuje tytuł, treść tekstową i nazwy tagów.
// * Normalizuje polskie znaki diakrytyczne (ą→a, ś→s, itp.).
// * Dla każdego słowa zapytania sprawdza, czy istnieje słowo w tekście,
// * które ma wspólny prefix o długości >= 80% długości szukanego słowa.
// *
// * Przykłady:
// *   "kwadratowa" → matchuje "kwadratową", "kwadratowe", "kwadratowej" ✅
// *   "kwadratowa" → NIE matchuje "kwadrat" ❌ (za krótki prefix)
// *   "funkcja" → matchuje "funkcje", "funkcji", "funkcją" ✅
// *   "log" → matchuje "logarytm", "logiczny" ✅ (krótkie słowa = prefix match)

// ----- Mapa normalizacji polskich znaków diakrytycznych -----
const POLISH_CHAR_MAP: Record<string, string> = {
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

// * Zamienia polskie znaki diakrytyczne na łacińskie odpowiedniki i konwertuje na lowercase
const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .split("")
    .map((char) => POLISH_CHAR_MAP[char] || char)
    .join("");

// * Dzieli tekst na unikalne słowa po normalizacji
const tokenize = (text: string): string[] =>
  normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 0);

// * Sprawdza czy jedno słowo z zapytania matchuje jakiekolwiek słowo w tekście
// * Dla krótkich zapytań (<=4 znaki) — prosty prefix match
// * Dla dłuższych — wspólny prefix musi mieć >= 80% długości zapytania
const wordMatches = (queryWord: string, textWord: string): boolean => {
  // * Krótkie zapytania (1-4 znaki) — klasyczny prefix match
  if (queryWord.length <= 4) {
    return textWord.startsWith(queryWord);
  }

  // * Dłuższe zapytania — wymagamy wspólnego prefixu o długości >= 80% zapytania
  const minPrefixLength = Math.ceil(queryWord.length * 0.8);
  const maxComparable = Math.min(queryWord.length, textWord.length);

  // * Tekst jest za krótki, aby spełnić wymaganie prefixu
  if (maxComparable < minPrefixLength) return false;

  // * Porównujemy prefix znak po znaku
  let commonPrefix = 0;
  for (let i = 0; i < maxComparable; i++) {
    if (queryWord[i] === textWord[i]) {
      commonPrefix++;
    } else {
      break;
    }
  }

  return commonPrefix >= minPrefixLength;
};

// * Główna funkcja smart search — sprawdza czy WSZYSTKIE słowa zapytania
// * matchują w podanych tekstach (AND logic: każde słowo musi trafić gdzieś)
export const smartSearch = (
  query: string,
  searchableTexts: (string | null | undefined)[],
): boolean => {
  const queryWords = tokenize(query);

  // * Puste zapytanie — matchuje wszystko
  if (queryWords.length === 0) return true;

  // * Łączymy wszystkie przeszukiwane teksty w jeden zbiór słów
  const allTextWords: string[] = [];
  for (const text of searchableTexts) {
    if (text) {
      allTextWords.push(...tokenize(text));
    }
  }

  // * Każde słowo zapytania musi mieć match w przynajmniej jednym słowie tekstu
  return queryWords.every((qWord) =>
    allTextWords.some((tWord) => wordMatches(qWord, tWord)),
  );
};

// ==========================================
// WIZUALIZACJE ZESTAWÓW (Kafelki) - Baza 50 motywów
// ==========================================

// * Rozszerzone o dynamiczne klasy hoverBg, aby przyciski akcji
// * w kartach idealnie adoptowały kolor motywu przy najechaniu.
const COLOR_PALETTES = [
  {
    glow: "bg-blue-500/15",
    hoverBorder: "hover:border-blue-500/50",
    iconColor: "text-blue-600",
    hoverBg: "hover:bg-blue-500/10",
  },
  {
    glow: "bg-emerald-500/15",
    hoverBorder: "hover:border-emerald-500/50",
    iconColor: "text-emerald-600",
    hoverBg: "hover:bg-emerald-500/10",
  },
  {
    glow: "bg-violet-500/15",
    hoverBorder: "hover:border-violet-500/50",
    iconColor: "text-violet-600",
    hoverBg: "hover:bg-violet-500/10",
  },
  {
    glow: "bg-rose-500/15",
    hoverBorder: "hover:border-rose-500/50",
    iconColor: "text-rose-600",
    hoverBg: "hover:bg-rose-500/10",
  },
  {
    glow: "bg-amber-500/15",
    hoverBorder: "hover:border-amber-500/50",
    iconColor: "text-amber-600",
    hoverBg: "hover:bg-amber-500/10",
  },
  {
    glow: "bg-cyan-500/15",
    hoverBorder: "hover:border-cyan-500/50",
    iconColor: "text-cyan-600",
    hoverBg: "hover:bg-cyan-500/10",
  },
  {
    glow: "bg-fuchsia-500/15",
    hoverBorder: "hover:border-fuchsia-500/50",
    iconColor: "text-fuchsia-600",
    hoverBg: "hover:bg-fuchsia-500/10",
  },
  {
    glow: "bg-indigo-500/15",
    hoverBorder: "hover:border-indigo-500/50",
    iconColor: "text-indigo-600",
    hoverBg: "hover:bg-indigo-500/10",
  },
  {
    glow: "bg-teal-500/15",
    hoverBorder: "hover:border-teal-500/50",
    iconColor: "text-teal-600",
    hoverBg: "hover:bg-teal-500/10",
  },
  {
    glow: "bg-pink-500/15",
    hoverBorder: "hover:border-pink-500/50",
    iconColor: "text-pink-600",
    hoverBg: "hover:bg-pink-500/10",
  },
];

const ICONS: LucideIcon[] = [
  Sigma,
  Calculator,
  Percent,
  Divide,
  Hash,
  Asterisk,
  FunctionSquare,
  Binary,
  Pi,
  InfinityIcon,
  Equal,
  Minus,
  Plus,
  SquareRadical,
  X,
  Superscript,
  BarChart,
  LineChart,
  PieChart,
  Torus,
  TriangleRight,
  Hexagon,
  Cone,
  Cylinder,
  Cuboid,
];

// * Generuje 50 stabilnych kombinacji (ikona + paleta)
export const EXERCISE_SET_VISUALS = Array.from({ length: 50 }, (_, i) => {
  const icon = ICONS[i % ICONS.length];
  const palette = COLOR_PALETTES[i % COLOR_PALETTES.length];
  return { icon, ...palette };
});

// * Zwraca konsekwentny wizualnie motyw na podstawie ID zestawu
export const getSetVisuals = (setId: string) => {
  const hash = setId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return EXERCISE_SET_VISUALS[hash % EXERCISE_SET_VISUALS.length];
};
