// ==========================================
// UTILS: Zestawy zadań i foldery
// ==========================================

import type { Exercise, Tag } from "@/features/exercise-database/types";

// * Zbiera do `limit` unikalnych tagów z kolejnych zadań zestawu.
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

interface SetPalette {
  readonly glow: string;
  readonly hoverBorder: string;
  readonly stripe: string;
  readonly accentHex: string;
  readonly accentText: string;
  readonly hoverBg: string;
}

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

// * Kolor zestawu lub folderu jest stabilny dla danego ID.
export const getSetVisuals = (setId: string): SetPalette => {
  const hash = setId
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLOR_PALETTES[hash % COLOR_PALETTES.length];
};

// * Object.keys gubi typ klucza słownika.
export const getLabelEntries = <T extends string>(
  labels: Readonly<Record<T, string>>,
): [T, string][] =>
  (Object.keys(labels) as T[]).map((key): [T, string] => [key, labels[key]]);

export const isLabelKey = <T extends string>(
  labels: Readonly<Record<T, string>>,
  value: string,
): value is T => Object.hasOwn(labels, value);

// * Brak punktowanych zadań oznacza brak sumy, a nie zero punktów.
export const sumExercisePoints = (
  exercises: readonly Pick<Exercise, "points">[],
): number | null => {
  const scored = exercises.filter((exercise) => exercise.points !== null);
  if (scored.length === 0) return null;
  return scored.reduce((sum, exercise) => sum + (exercise.points ?? 0), 0);
};
