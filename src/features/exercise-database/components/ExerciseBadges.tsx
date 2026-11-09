// ==========================================
// KOMPONENTY: Pigułki atrybutów zadania
// ==========================================
// * Wspólne pigułki trudności, poziomu, źródła i typu zadania (widok zestawu).
// * Kolory i ikony pochodzą z utils.ts — jedno źródło prawdy dla całego modułu.

import { cn } from "@/lib/utils";
import type {
  ExerciseDifficulty,
  ExerciseMathLevel,
  ExerciseSourceType,
  ExerciseType,
} from "../types";
import {
  SOURCE_TYPE_ICONS,
  getDifficultyLabel,
  getDifficultyStyle,
  getExerciseTypeLabel,
  getExerciseTypeStyle,
  getMathLevelLabel,
  getMathLevelStyle,
  getSourceTypeLabel,
  getSourceTypeStyle,
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

  return (
    <span className={cn(PILL_CLASSES, style.border, style.bg, style.text)}>
      <span
        className={cn("h-1.5 w-1.5 rounded-full", style.dot)}
        aria-hidden="true"
      />
      {getDifficultyLabel(difficulty)}
    </span>
  );
}

// ----- Poziom edukacji (ikona + etykieta) -----

export function LevelBadge({ level }: { readonly level: ExerciseMathLevel }) {
  return (
    <span className={cn(PILL_CLASSES, getMathLevelStyle(level))}>
      <MathLevelIcon level={level} className="h-3 w-3" />
      {getMathLevelLabel(level)}
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
  return (
    <span className={cn(PILL_CLASSES, getExerciseTypeStyle())}>
      {getExerciseTypeLabel(type)}
    </span>
  );
}
