// ==========================================
// KOMPONENT: Wiersz zadania na liście
// ==========================================

"use client";

import {
  Lightbulb,
  MoreVertical,
  Pencil,
  Trash2,
  Landmark,
  User,
  Sparkles,
  Backpack,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ExerciseListItem } from "../types";
import {
  getMathLevelLabel,
  getExerciseTypeLabel,
  getExerciseTypeStyle,
  getSourceTypeLabel,
} from "../utils";

interface ExerciseRowProps {
  readonly exercise: ExerciseListItem;
  readonly onEdit: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function ExerciseRow({ exercise, onEdit, onDelete }: ExerciseRowProps) {
  // * Łączymy kategorie i tagi na jedną listę, priorytetyzując kategorie
  const allLabels = [
    ...exercise.categories.map((c) => ({
      id: c.id,
      name: c.name,
      type: "cat",
    })),
    ...exercise.tags.map((t) => ({ id: t.id, name: t.name, type: "tag" })),
  ];

  return (
    <div
      className={cn(
        "flex items-stretch rounded-xl border border-border/40 bg-card overflow-hidden transition-colors hover:bg-muted/20 group",
        exercise.difficulty === "easy" && "border-l-4 border-l-emerald-500",
        exercise.difficulty === "medium" && "border-l-4 border-l-amber-500",
        exercise.difficulty === "hard" && "border-l-4 border-l-destructive",
        !exercise.difficulty && "border-l-4 border-l-muted-foreground/30",
      )}
    >
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        {/* ========================================== */}
        {/* BLOK 1: Tytuł                              */}
        {/* ========================================== */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 sm:truncate sm:line-clamp-none">
            {exercise.title}
          </h4>
        </div>

        {/* ========================================== */}
        {/* BLOK 2: Kategorie, Tagi, Typ (Pigułki)     */}
        {/* ========================================== */}
        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap sm:shrink-0 mt-2 sm:mt-0">
          {allLabels.map((label, index) => (
            <span
              key={`${label.type}-${label.id}`}
              className={cn(
                "inline-flex items-center rounded-full bg-white border border-border/60 px-2.5 py-0.5 text-[10px] font-semibold text-foreground/80 shadow-sm whitespace-nowrap",
                index >= 2 && "sm:hidden",
              )}
            >
              {label.name}
            </span>
          ))}
          {allLabels.length > 2 && (
            <span className="hidden sm:inline text-[10px] text-muted-foreground font-medium pr-1">
              +{allLabels.length - 2}
            </span>
          )}

          {/* Typ zadania (nadal jako tekstowy tag) */}
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold shadow-sm whitespace-nowrap",
              getExerciseTypeStyle(),
            )}
          >
            {getExerciseTypeLabel(exercise.exerciseType)}
          </span>
        </div>

        {/* ========================================== */}
        {/* BLOK 3: Meta (Punkty, Ikonki statusu, Menu)*/}
        {/* ========================================== */}
        <div className="flex items-center justify-between sm:justify-end sm:shrink-0 w-full sm:w-auto mt-3 sm:mt-0 gap-3">
          {/* Punkty */}
          {exercise.points !== null ? (
            <span className="inline-flex items-center text-xs font-bold text-muted-foreground tabular-nums whitespace-nowrap pr-2">
              {exercise.points} pkt
            </span>
          ) : (
            <span className="sm:hidden" /> // Podtrzymuje flex-layout na mobile
          )}

          <div className="flex items-center gap-3">
            {/* Ikona Poziomu */}
            {exercise.mathLevel && (
              <span
                title={getMathLevelLabel(exercise.mathLevel)}
                className="flex items-center justify-center text-muted-foreground"
              >
                {exercise.mathLevel === "primary_1_3" && (
                  <Pencil className="h-4 w-4" />
                )}
                {exercise.mathLevel === "primary_4_8" && (
                  <Backpack className="h-4 w-4" />
                )}
                {exercise.mathLevel === "highschool_basic" && (
                  <BookOpen className="h-4 w-4" />
                )}
                {exercise.mathLevel === "highschool_extended" && (
                  <GraduationCap className="h-4 w-4" />
                )}
              </span>
            )}

            {/* Ikona Źródła */}
            {exercise.sourceType && (
              <span
                title={getSourceTypeLabel(exercise.sourceType)}
                className="flex items-center justify-center"
              >
                {exercise.sourceType === "cke" && (
                  <Landmark className="h-4 w-4 text-rose-500" />
                )}
                {exercise.sourceType === "tutor" && (
                  <User className="h-4 w-4 text-blue-500" />
                )}
                {exercise.sourceType === "generated" && (
                  <Sparkles className="h-4 w-4 text-purple-500" />
                )}
              </span>
            )}

            {/* Ikona Rozwiązania */}
            <span
              title="Posiada rozwiązanie"
              className="flex items-center justify-center"
            >
              <Lightbulb
                className={cn(
                  "h-4 w-4 transition-colors",
                  exercise.hasSolution
                    ? "text-amber-500"
                    : "text-muted-foreground/25",
                )}
              />
            </span>
          </div>

          {/* Menu Opcji */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground ml-1"
                aria-label="Opcje zadania"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => onEdit(exercise.id)}>
                <Pencil className="mr-2 h-4 w-4" /> Edytuj
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(exercise.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Usuń
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
