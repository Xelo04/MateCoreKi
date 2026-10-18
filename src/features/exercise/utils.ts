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
import type {
  ExerciseDifficulty,
  ExerciseMathLevel,
  ExerciseType,
  ExerciseSourceType,
  Tag,
  Category,
  CategoryNode,
} from "./types";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_TYPE_LABELS,
  EXERCISE_SOURCE_TYPE_LABELS,
} from "./types";

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

// ==========================================
// POZIOM EDUKACJI (Szkoła / Matura)
// ==========================================

export const getMathLevelLabel = (level: ExerciseMathLevel | null): string => {
  if (!level) return "";
  return EXERCISE_MATH_LEVEL_LABELS[level];
};

export const getMathLevelShort = (level: ExerciseMathLevel | null): string => {
  if (level === "primary_1_3") return "SP 1-3";
  if (level === "primary_4_8") return "SP 4-8";
  if (level === "highschool_basic") return "Matura P.";
  if (level === "highschool_extended") return "Matura R.";
  return "";
};

// Zmieniamy styl na standardową pigułkę z tłem, analogiczną do Typu Zadania
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

export const getExerciseTypeLabel = (type: ExerciseType): string => {
  return EXERCISE_TYPE_LABELS[type];
};

export const getExerciseTypeStyle = (): string => {
  return "bg-indigo-500/10 text-indigo-600 border-indigo-500/20";
};

// ==========================================
// ŹRÓDŁO ZADANIA
// ==========================================

export const getSourceTypeLabel = (source: ExerciseSourceType): string => {
  return EXERCISE_SOURCE_TYPE_LABELS[source];
};

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
// TAGI / KATEGORIE
// ==========================================

export const formatTagNames = (tags: Tag[]): string =>
  tags.map((t) => t.name).join(", ");

export const formatCategoryNames = (categories: Category[]): string =>
  categories.map((c) => c.name).join(", ");

// ==========================================
// ZESTAWY: Obliczenia
// ==========================================

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

// ==========================================
// SMART SEARCH: Wyszukiwanie z morfologią polską
// ==========================================

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

const normalizeText = (text: string): string =>
  text
    .toLowerCase()
    .split("")
    .map((char) => POLISH_CHAR_MAP[char] || char)
    .join("");

const tokenize = (text: string): string[] =>
  normalizeText(text)
    .split(/\s+/)
    .filter((word) => word.length > 0);

const wordMatches = (queryWord: string, textWord: string): boolean => {
  if (queryWord.length <= 4) {
    return textWord.startsWith(queryWord);
  }

  const minPrefixLength = Math.ceil(queryWord.length * 0.8);
  const maxComparable = Math.min(queryWord.length, textWord.length);

  if (maxComparable < minPrefixLength) return false;

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

export const smartSearch = (
  query: string,
  searchableTexts: (string | null | undefined)[],
): boolean => {
  const queryWords = tokenize(query);
  if (queryWords.length === 0) return true;

  const allTextWords: string[] = [];
  for (const text of searchableTexts) {
    if (text) {
      allTextWords.push(...tokenize(text));
    }
  }

  return queryWords.every((qWord) =>
    allTextWords.some((tWord) => wordMatches(qWord, tWord)),
  );
};

// ==========================================
// WIZUALIZACJE ZESTAWÓW (Kafelki) - Baza 50 motywów
// ==========================================

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

export const EXERCISE_SET_VISUALS = Array.from({ length: 50 }, (_, i) => {
  const icon = ICONS[i % ICONS.length];
  const palette = COLOR_PALETTES[i % COLOR_PALETTES.length];
  return { icon, ...palette };
});

export const getSetVisuals = (setId: string) => {
  const hash = setId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return EXERCISE_SET_VISUALS[hash % EXERCISE_SET_VISUALS.length];
};

// ==========================================
// KATEGORIE
// ==========================================

// * Spłaszcza drzewo kategorii do jednowymiarowej tablicy na potrzeby dropdownu Select.
// * Dodaje informację o "depth" (głębokości) by wygenerować wcięcia w UI.
export const flattenCategoryTree = (
  nodes: CategoryNode[],
  depth = 0,
): { cat: CategoryNode; depth: number }[] => {
  let flat: { cat: CategoryNode; depth: number }[] = [];
  for (const node of nodes) {
    flat.push({ cat: node, depth });
    if (node.children.length > 0) {
      flat = flat.concat(flattenCategoryTree(node.children, depth + 1));
    }
  }
  return flat;
};

// * Pobiera ID wybranej kategorii ORAZ wszystkich jej dzieci (rekurencyjnie)
export const getValidCategoryIds = (
  tree: CategoryNode[],
  selectedId: string,
): Set<string> => {
  if (selectedId === "all") return new Set();

  const findNode = (nodes: CategoryNode[], id: string): CategoryNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNode(node.children, id);
      if (found) return found;
    }
    return null;
  };

  const targetNode = findNode(tree, selectedId);
  if (!targetNode) return new Set([selectedId]);

  const collectIds = (node: CategoryNode): string[] => {
    let ids = [node.id];
    node.children.forEach((child) => {
      ids = ids.concat(collectIds(child));
    });
    return ids;
  };

  return new Set(collectIds(targetNode));
};
