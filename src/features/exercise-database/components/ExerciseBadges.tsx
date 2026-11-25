// ==========================================
// KOMPONENTY: Pigułki atrybutów zadania
// ==========================================
// * Wspólne pigułki trudności, poziomu, źródła i typu zadania (widok zestawu).
// * Kolory i ikony pochodzą z utils.ts — jedno źródło prawdy dla całego modułu.

import { cn } from "@/lib/utils";
import { useExerciseMeta } from "../hook";
import type {
  ExerciseDifficulty,
  ExerciseMathLevel,
  ExerciseSourceType,
  ExerciseType,
} from "../types";
import {
  SOURCE_TYPE_ICONS,
  getDifficultyStyle,
  getExerciseTypeStyle,
  getMathLevelStyle,
  getSourceTypeLabel,
  getSourceTypeStyle,
  metaLabel,
} from "../utils";
import { MathLevelIcon } from "./MathLevelIcon";

// * Wspólny kształt pigułki
const PILL_CLASSES =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1 text-[11px] font-bold shadow-sm";

// ----- Trudność (kropka + etykieta; znaczenie niesie tekst, nie tylko kolor) -----

export function DifficultyBadge({
  difficulty,
}: {
  readonly difficulty: ExerciseDifficulty;
}) {
  const style = getDifficultyStyle(difficulty);
  const { meta, error } = useExerciseMeta();

  return (
    <span className={cn(PILL_CLASSES, style.border, style.bg, style.text)}>
      <span
        className={cn("h-1.5 w-1.5 rounded-full", style.dot)}
        aria-hidden="true"
      />
      {meta ? metaLabel(meta.difficulties, difficulty) : error ?? "Ładowanie..."}
    </span>
  );
}

// ----- Poziom edukacji (ikona + etykieta) -----

export function LevelBadge({ level }: { readonly level: ExerciseMathLevel }) {
  const { meta, error } = useExerciseMeta();
  return (
    <span className={cn(PILL_CLASSES, getMathLevelStyle(level))}>
      <MathLevelIcon level={level} className="h-3 w-3" />
      {meta ? metaLabel(meta.math_levels, level) : error ?? "Ładowanie..."}
    </span>
  );
}

// ----- Źródło (ikona + etykieta) -----

export function SourceBadge({
  source,
}: {
  readonly source: ExerciseSourceType;
}) {
  const Icon = SOURCE_TYPE_ICONS[source];

  return (
    <span className={cn(PILL_CLASSES, getSourceTypeStyle(source))}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {getSourceTypeLabel(source)}
    </span>
  );
}

// ----- Typ zadania (jeden wspólny styl indigo) -----

export function ExerciseTypeBadge({ type }: { readonly type: ExerciseType }) {
  const { meta, error } = useExerciseMeta();
  return (
    <span className={cn(PILL_CLASSES, getExerciseTypeStyle())}>
      {meta ? metaLabel(meta.exercise_types, type) : error ?? "Ładowanie..."}
    </span>
  );
}
