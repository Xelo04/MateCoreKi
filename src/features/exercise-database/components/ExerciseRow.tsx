// ==========================================
// KOMPONENT: Wiersz zadania na liście
// ==========================================
// * Wspólny wiersz bazy zadań i kreatora zestawu. Ikony poziomu/źródła i kolory
// * trudności pochodzą z utils.ts. Slot `action` zastępuje domyślne menu opcji
// * (np. przycisk „+” w kreatorze zestawu).

"use client";

import { useRouter } from "next/navigation";
import { Lightbulb, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ExerciseListItem } from "../types";
import { getDifficultyStyle } from "../utils";
import { ExerciseTypeBadge } from "./ExerciseBadges";
import {
  SOURCE_TYPE_ICONS,
  SOURCE_TYPE_ICON_COLORS,
  getMathLevelLabel,
  getSourceTypeLabel,
} from "../utils";
import { MathLevelIcon } from "./MathLevelIcon";

// ----- TYPY -----

interface ExerciseRowProps {
  readonly exercise: ExerciseListItem;
  readonly onEdit?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly onView?: (id: string) => void;
  readonly action?: React.ReactNode;
}

// * Ile pierwszych pigułek (kategorie + tagi) widać na szerokich ekranach
const VISIBLE_LABELS_ON_DESKTOP = 2;

// ----- KOMPONENT -----

export function ExerciseRow({
  exercise,
  onEdit,
  onDelete,
  onView,
  action,
}: ExerciseRowProps) {
  const router = useRouter();

  // * Kategorie i tagi w jednej liście pigułek (kategorie mają priorytet)
  const labels = [
    ...exercise.categories.map((category) => ({
      key: `cat-${category.id}`,
      name: category.name,
    })),
    ...exercise.tags.map((tag) => ({ key: `tag-${tag.id}`, name: tag.name })),
  ];

  const hasMenu = Boolean(onEdit || onDelete);
  const SourceIcon = SOURCE_TYPE_ICONS[exercise.sourceType];

  // * Kliknięcie w wiersz otwiera podgląd (onView) lub podstronę zadania
  const handleRowClick = () => {
    if (onView) {
      onView(exercise.id);
    } else {
      router.push(`/exercise-database/${exercise.id}`);
    }
  };

  return (
    <div
      onClick={handleRowClick}
      onKeyDown={(event) => {
        // ! Tylko klawisze samego wiersza — Enter na zagnieżdżonym przycisku
        // ! (akcja/menu) nie może otwierać zadania.
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          handleRowClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Otwórz zadanie: ${exercise.title}`}
      className={cn(
        "group relative flex cursor-pointer items-stretch overflow-hidden rounded-2xl border border-border/40 bg-card outline-none transition-colors hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary",
        getDifficultyStyle(exercise.difficulty).stripe,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-4 px-5 py-5">
        {/* ========================================== */}
        {/* BLOK 1: Tytuł                              */}
        {/* ========================================== */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          <h4 className="line-clamp-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary sm:line-clamp-none sm:truncate">
            {exercise.title}
          </h4>
        </div>

        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          {/* ========================================== */}
          {/* BLOK 2: Kategorie, tagi, typ (pigułki)     */}
          {/* ========================================== */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-0 sm:shrink-0 sm:flex-nowrap">
            {/* * Na desktopie widać tylko pierwsze pigułki, reszta jako licznik „+N” */}
            {labels.map((label, index) => (
              <span
                key={label.key}
                className={cn(
                  "inline-flex items-center whitespace-nowrap rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80 shadow-sm",
                  index >= VISIBLE_LABELS_ON_DESKTOP && "sm:hidden",
                )}
              >
                {label.name}
              </span>
            ))}
            {labels.length > VISIBLE_LABELS_ON_DESKTOP && (
              <span className="hidden pr-1 text-[10px] font-medium text-muted-foreground sm:inline">
                +{labels.length - VISIBLE_LABELS_ON_DESKTOP}
              </span>
            )}

            {/* * Typ zadania (tekstowa pigułka) */}
            <ExerciseTypeBadge type={exercise.exerciseType} />
          </div>

          {/* ========================================== */}
          {/* BLOK 3: Meta (punkty, ikony, akcja/menu)   */}
          {/* ========================================== */}
          <div className="mt-3 ml-auto flex w-full items-center justify-end gap-3 sm:mt-0 sm:w-auto sm:shrink-0 sm:pr-8">
            {/* * Punkty (na mobile pusty element zachowuje układ justify-between) */}
            {exercise.points !== null ? (
              <span className="inline-flex items-center whitespace-nowrap pr-2 text-xs font-bold tabular-nums text-muted-foreground">
                {exercise.points} pkt
              </span>
            ) : (
              <span className="sm:hidden" />
            )}

            {/* * Ikony statusu: poziom, źródło, rozwiązanie */}
            <div className="flex items-center gap-3">
              {exercise.mathLevel && (
                <span
                  role="img"
                  aria-label={`Poziom: ${getMathLevelLabel(exercise.mathLevel)}`}
                  title={getMathLevelLabel(exercise.mathLevel)}
                  className="flex items-center justify-center text-muted-foreground"
                >
                  <MathLevelIcon
                    level={exercise.mathLevel}
                    className="h-4 w-4"
                  />
                </span>
              )}

              <span
                role="img"
                aria-label={`Źródło: ${getSourceTypeLabel(exercise.sourceType)}`}
                title={getSourceTypeLabel(exercise.sourceType)}
                className="flex items-center justify-center"
              >
                <SourceIcon
                  className={cn(
                    "h-4 w-4",
                    SOURCE_TYPE_ICON_COLORS[exercise.sourceType],
                  )}
                  aria-hidden="true"
                />
              </span>

              {/* * Żarówka: kolor + etykieta tekstowa (znaczenie nie tylko kolorem) */}
              <span
                role="img"
                aria-label={
                  exercise.hasSolution
                    ? "Posiada rozwiązanie"
                    : "Brak rozwiązania"
                }
                title={
                  exercise.hasSolution
                    ? "Posiada rozwiązanie"
                    : "Brak rozwiązania"
                }
                className="flex items-center justify-center"
              >
                <Lightbulb
                  className={cn(
                    "h-4 w-4 transition-colors",
                    exercise.hasSolution
                      ? "text-amber-500"
                      : "text-muted-foreground/25",
                  )}
                  aria-hidden="true"
                />
              </span>
            </div>

            {/* * Slot akcji (np. „+” w kreatorze) ALBO menu opcji; kliknięcia nie otwierają wiersza */}
            {action ? (
              <div onClick={(event) => event.stopPropagation()}>{action}</div>
            ) : hasMenu ? (
              <div
                className="sm:absolute sm:right-3 sm:top-3"
                onClick={(event) => event.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-1 h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label="Opcje zadania"
                    >
                      <MoreVertical className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(exercise.id)}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                        Edytuj
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        onClick={() => onDelete(exercise.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                        Usuń
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
