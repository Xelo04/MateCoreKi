// ==========================================
// KOMPONENT: Siatka metadanych zadania
// ==========================================
// * Wspólna dla ExerciseDetailView i ExerciseDetailModal (wcześniej dwie kopie,
// * z czego modalowa była uboższa). Ikony i kolory pochodzą z utils.ts.

"use client";

import type { ReactNode } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_SOURCE_TYPE_LABELS,
  EXERCISE_TYPE_LABELS,
  type Exercise,
} from "../types";
import {
  DIFFICULTY_STYLES,
  SOURCE_TYPE_ICONS,
  SOURCE_TYPE_ICON_COLORS,
} from "../utils";
import { MathLevelIcon } from "./MathLevelIcon";

// ==========================================
// STAŁE I POMOCNICZE
// ==========================================

const EMPTY_VALUE = "-";

// * Daty z API to pełne timestampy ISO (mappery w types.ts) — format polski
const formatDateTime = (date: Date): string =>
  format(date, "dd MMM yyyy, HH:mm", { locale: pl });

// ==========================================
// KOMPONENT WEWNĘTRZNY: Pojedyncza komórka
// ==========================================

function MetadataItem({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border/40 bg-muted/20 p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <div className="flex items-center text-sm font-medium text-foreground">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// KOMPONENT: Przycisk rozwijania szczegółów
// ==========================================

export function DetailsToggleButton({
  isOpen,
  onToggle,
  className,
}: {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onToggle}
      aria-expanded={isOpen}
      className={cn(
        "h-11 shrink-0 rounded-xl bg-white px-5 font-semibold shadow-sm transition-colors hover:bg-muted/30 hover:text-foreground",
        isOpen && "bg-muted/30",
        className,
      )}
    >
      {isOpen ? (
        <>
          <ChevronUp className="mr-2 h-4 w-4" aria-hidden="true" /> Ukryj
          szczegóły
        </>
      ) : (
        <>
          <ChevronDown className="mr-2 h-4 w-4" aria-hidden="true" /> Szczegóły
          zadania
        </>
      )}
    </Button>
  );
}

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExerciseMetadataGrid({
  exercise,
}: {
  readonly exercise: Exercise;
}) {
  const SourceIcon = SOURCE_TYPE_ICONS[exercise.sourceType];
  const difficultyStyle = exercise.difficulty
    ? DIFFICULTY_STYLES[exercise.difficulty]
    : null;

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {/* * Poziom edukacji (ikona + etykieta) */}
      <MetadataItem label="Poziom edukacji">
        {exercise.mathLevel ? (
          <>
            <MathLevelIcon
              level={exercise.mathLevel}
              className="mr-2 h-4 w-4 text-muted-foreground"
            />
            {EXERCISE_MATH_LEVEL_LABELS[exercise.mathLevel]}
          </>
        ) : (
          EMPTY_VALUE
        )}
      </MetadataItem>

      {/* * Trudność (badge w kolorze poziomu; etykieta niesie znaczenie, nie tylko kolor) */}
      <MetadataItem label="Trudność">
        {exercise.difficulty && difficultyStyle ? (
          <Badge
            variant="outline"
            className={cn(
              "rounded-full font-semibold",
              difficultyStyle.border,
              difficultyStyle.bg,
              difficultyStyle.text,
            )}
          >
            {EXERCISE_DIFFICULTY_LABELS[exercise.difficulty]}
          </Badge>
        ) : (
          EMPTY_VALUE
        )}
      </MetadataItem>

      {/* * Źródło (ikona + etykieta) */}
      <MetadataItem label="Źródło">
        <SourceIcon
          className={cn(
            "mr-2 h-4 w-4",
            SOURCE_TYPE_ICON_COLORS[exercise.sourceType],
          )}
          aria-hidden="true"
        />
        {EXERCISE_SOURCE_TYPE_LABELS[exercise.sourceType]}
      </MetadataItem>

      <MetadataItem label="Typ zadania">
        {EXERCISE_TYPE_LABELS[exercise.exerciseType]}
      </MetadataItem>

      {/* * Kategorie (działy) */}
      <MetadataItem label="Kategorie (Działy)">
        {exercise.categories.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {exercise.categories.map((category) => (
              <Badge
                key={category.id}
                variant="outline"
                className="rounded-sm font-normal"
              >
                {category.name}
              </Badge>
            ))}
          </div>
        ) : (
          EMPTY_VALUE
        )}
      </MetadataItem>

      {/* * Tagi dodatkowe */}
      <MetadataItem label="Dodatkowe Tagi">
        {exercise.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {exercise.tags.map((tag) => (
              <Badge
                key={tag.id}
                className="border-transparent bg-primary/10 font-medium text-primary hover:bg-primary/20"
              >
                #{tag.name}
              </Badge>
            ))}
          </div>
        ) : (
          EMPTY_VALUE
        )}
      </MetadataItem>

      <MetadataItem label="Utworzono">
        {formatDateTime(exercise.createdAt)}
      </MetadataItem>
      <MetadataItem label="Ostatnia edycja">
        {formatDateTime(exercise.updatedAt)}
      </MetadataItem>
    </div>
  );
}
