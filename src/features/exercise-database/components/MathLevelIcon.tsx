// ==========================================
// KOMPONENT: Ikona poziomu edukacji
// ==========================================
// * Komponent na poziomie modułu zamiast `getMathLevelIcon()` w renderze
// * (reguła react-hooks/static-components zabrania tworzenia komponentów w trakcie renderu).

import type { ExerciseMathLevel } from "../types";
import { MATH_LEVEL_ICONS } from "../utils";

interface MathLevelIconProps {
  readonly level: ExerciseMathLevel;
  readonly className?: string;
}

export function MathLevelIcon({ level, className }: MathLevelIconProps) {
  const Icon = MATH_LEVEL_ICONS[level];
  return <Icon className={className} aria-hidden="true" />;
}
