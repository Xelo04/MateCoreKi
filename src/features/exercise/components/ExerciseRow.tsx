// ==========================================
// KOMPONENT: Wiersz zadania na liście
// ==========================================
// Wiersz z kolorowym obramowaniem trudności po lewej, tytułem, podglądem
// treści tekstowej, tagami, punktacją i ikonami formatów (zdjęcia, PDF, rozwiązanie).
// * Desktop (sm+): tytuł+treść po lewej, meta po prawej — w jednej linii.
// * Mobile: układ pionowy; tytuł (1-2 linie) → treść → tagi → meta z równymi odstępami dla KAŻDEJ ikony.

"use client";

import {
  Image as ImageIcon,
  FileText,
  Lightbulb,
  MoreVertical,
  Pencil,
  Trash2,
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

interface ExerciseRowProps {
  readonly exercise: ExerciseListItem;
  readonly onEdit: (id: string) => void;
  readonly onDelete: (id: string) => void;
}

export function ExerciseRow({ exercise, onEdit, onDelete }: ExerciseRowProps) {
  return (
    <div
      className={cn(
        "flex items-stretch rounded-xl border border-border/40 bg-card overflow-hidden transition-colors hover:bg-muted/20 group",
        // * Pasek trudności jako lewe obramowanie, które idealnie dopasowuje się do krawędzi i zaokrągleń karty
        exercise.difficulty === "easy" && "border-l-4 border-l-emerald-500",
        exercise.difficulty === "medium" && "border-l-4 border-l-amber-500",
        exercise.difficulty === "hard" && "border-l-4 border-l-destructive",
        !exercise.difficulty && "border-l-4 border-l-muted-foreground/30",
      )}
    >
      {/* ========================================== */}
      {/* TREŚĆ WIERSZA                              */}
      {/* ========================================== */}
      <div className="flex-1 min-w-0 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        {/* ========================================== */}
        {/* BLOK 1+2: Tytuł i treść                    */}
        {/* ========================================== */}
        <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 sm:truncate sm:line-clamp-none">
            {exercise.title}
          </h4>
          {exercise.contentText && (
            <p className="text-xs text-muted-foreground truncate">
              {exercise.contentText}
            </p>
          )}
        </div>

        {/* ========================================== */}
        {/* BLOK 3: Tagi                               */}
        {/* ========================================== */}
        {exercise.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap sm:flex-nowrap sm:shrink-0 mt-2 sm:mt-0">
            {/* * Na mobile pokazujemy wszystkie tagi, na desktopie max 2 */}
            {exercise.tags.map((tag, index) => (
              <span
                key={tag.id}
                className={cn(
                  "inline-flex items-center rounded-full bg-white border border-border/60 px-2 py-0.5 text-[10px] font-semibold text-foreground/80 shadow-sm whitespace-nowrap",
                  // * Na desktopie chowamy tagi powyżej indeksu 1
                  index >= 2 && "sm:hidden",
                )}
              >
                {tag.name}
              </span>
            ))}
            {/* * Licznik +N widoczny tylko na desktopie gdy jest > 2 tagów */}
            {exercise.tags.length > 2 && (
              <span className="hidden sm:inline text-[10px] text-muted-foreground font-medium">
                +{exercise.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* BLOK 4: Punkty, każda ikona i menu          */}
        {/* ========================================== */}
        {/* * Mobile: justify-between rozciąga każdy element osobno. Desktop: elementy naturalnie przylegają do prawej */}
        <div className="flex items-center justify-between sm:justify-start sm:shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
          {/* ----- Punkty ----- */}
          {exercise.points !== null ? (
            <span className="inline-flex items-center text-xs font-bold text-muted-foreground tabular-nums whitespace-nowrap sm:mr-4">
              {exercise.points} pkt
            </span>
          ) : (
            <span className="sm:hidden" /> // Pusty placeholder, by justify-between utrzymało równe odległości
          )}

          {/* ----- Poszczególne Ikony ----- */}
          <span title="Zdjęcia" className="flex justify-center sm:mr-3">
            <ImageIcon
              className={cn(
                "h-4 w-4 transition-colors",
                exercise.hasImages
                  ? "text-foreground/70"
                  : "text-muted-foreground/25",
              )}
            />
          </span>
          <span title="Pliki PDF" className="flex justify-center sm:mr-3">
            <FileText
              className={cn(
                "h-4 w-4 transition-colors",
                exercise.hasFiles
                  ? "text-foreground/70"
                  : "text-muted-foreground/25",
              )}
            />
          </span>
          <span title="Rozwiązanie" className="flex justify-center sm:mr-3">
            <Lightbulb
              className={cn(
                "h-4 w-4 transition-colors",
                exercise.hasSolution
                  ? "text-amber-500"
                  : "text-muted-foreground/25",
              )}
            />
          </span>

          {/* ----- Menu (trzy kropki) ----- */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
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
