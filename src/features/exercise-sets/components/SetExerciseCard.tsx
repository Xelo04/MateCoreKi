// ==========================================
// KOMPONENT: Zadanie w arkuszu zestawu
// ==========================================
// * Karta jednego zadania w widoku zestawu (tylko do odczytu): numer, tytuł,
// * pigułki atrybutów, pełna treść i rozwijane rozwiązanie.
// * Lewy pasek w kolorze trudności jak w ExerciseRow.

"use client";

import { useId } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Exercise } from "@/features/exercise-database/types";
import {
  getDifficultyLabel,
  getDifficultyStyle,
  hasExerciseSolution,
} from "@/features/exercise-database/utils";
import {
  ExerciseTypeBadge,
  LevelBadge,
  SourceBadge,
} from "@/features/exercise-database/components/ExerciseBadges";
import { SolutionToggleButton } from "@/features/exercise-database/components/ExerciseContentPanel";
import { ExerciseContentRenderer } from "@/features/exercise-database/components/ExerciseContentRenderer";

// ----- TYPY -----

interface SetExerciseCardProps {
  readonly exercise: Exercise;
  // * Numer porządkowy w zestawie (od 1)
  readonly number: number;
  readonly isSolutionVisible: boolean;
  readonly onToggleSolution: () => void;
  readonly onOpen: () => void;
}

// ----- KOMPONENT -----

export function SetExerciseCard({
  exercise,
  number,
  isSolutionVisible,
  onToggleSolution,
  onOpen,
}: SetExerciseCardProps) {
  const titleId = useId();
  const hasSolution = hasExerciseSolution(exercise);

  return (
    <article
      aria-labelledby={titleId}
      //   className={cn(
      //     "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
      //     getDifficultyStyle(exercise.difficulty).stripe,
      //   )}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
        getDifficultyStyle(exercise.difficulty).stripe,
      )}
    >
      {/* ========================================== */}
      {/* NAGŁÓWEK: numer, tytuł, pigułki, punkty    */}
      {/* ========================================== */}
      <header className="flex flex-col gap-3 border-b border-border/40 bg-muted/5 p-5 sm:flex-row sm:items-center sm:gap-4 md:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {/* * Numer zadania w kółku (jak w liście kreatora) */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm"
            aria-hidden="true"
          >
            {number}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <h3
              id={titleId}
              className="wrap-break-word text-lg font-bold leading-tight tracking-tight text-foreground/90"
            >
              <span className="sr-only">Zadanie {number}: </span>
              {exercise.title}
            </h3>

            {/* * Pigułki atrybutów; trudność i poziom pojawiają się tylko, gdy są ustawione */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* * Pasek koloru nie niesie tekstu, więc trudność czytają czytniki ekranu */}
              {exercise.difficulty && (
                <span className="sr-only">
                  Trudność: {getDifficultyLabel(exercise.difficulty)}
                </span>
              )}
              {exercise.mathLevel && <LevelBadge level={exercise.mathLevel} />}
              <SourceBadge source={exercise.sourceType} />
              <ExerciseTypeBadge type={exercise.exerciseType} />
              {exercise.points !== null && (
                <span className="pl-1 text-xs font-bold tabular-nums text-muted-foreground">
                  {exercise.points} pkt
                </span>
              )}
            </div>
          </div>
        </div>

        {/* * Przejście do pełnego widoku zadania (edycja, usuwanie, metadane) */}
        <Button
          type="button"
          variant="ghost"
          onClick={onOpen}
          className="h-10 shrink-0 self-end rounded-xl text-muted-foreground hover:text-foreground sm:self-center"
        >
          <ExternalLink className="mr-2 h-4 w-4" aria-hidden="true" />
          Szczegóły
        </Button>
      </header>

      {/* ========================================== */}
      {/* TREŚĆ ZADANIA                              */}
      {/* ========================================== */}
      <div className="p-5 md:p-8">
        <ExerciseContentRenderer blocks={exercise.content} />
      </div>

      {/* ========================================== */}
      {/* ROZWIĄZANIE (tylko gdy zadanie je ma)      */}
      {/* ========================================== */}
      {hasSolution && (
        <footer className="space-y-5 border-t border-border/40 p-5 md:px-8">
          <SolutionToggleButton
            isVisible={isSolutionVisible}
            onToggle={onToggleSolution}
          />

          {isSolutionVisible && (
            <section
              aria-label={`Rozwiązanie zadania ${number}`}
              className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 duration-200 animate-in fade-in slide-in-from-top-2"
            >
              <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-amber-700">
                Rozwiązanie
              </h4>
              <ExerciseContentRenderer blocks={exercise.solution ?? []} />
            </section>
          )}
        </footer>
      )}
    </article>
  );
}
