// ==========================================
// KOMPONENT: Karta zestawu zadań
// ==========================================
// Karta wyświetlana na liście zestawów. Posiada subtelny gradient ozdobny
// (identyczny jak w ActiveStudentCard), podgląd tagów w zaokrąglonych
// kapsułkach, informację o przypisanym uczniu, menu kropkowe z opcją
// duplikacji oraz przycisk szybkiego przypisania jako pracy domowej z dynamicznym hoverem.

"use client";

import { useRouter } from "next/navigation";
import {
  FileText,
  User,
  Pencil,
  Trash2,
  MoreVertical,
  Copy,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ExerciseSetListItem } from "../types";
import { getSetVisuals, formatExerciseCount } from "../utils";

interface ExerciseSetCardProps {
  readonly set: ExerciseSetListItem;
  readonly onEdit: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onAssign: (id: string) => void;
}

export function ExerciseSetCard({
  set,
  onEdit,
  onDuplicate,
  onDelete,
  onAssign,
}: ExerciseSetCardProps) {
  const router = useRouter();

  // * Pobieranie spersonalizowanego wyglądu karty na podstawie jej ID (stabilny motyw wizualny)
  const visuals = getSetVisuals(set.id);
  const Icon = visuals.icon;

  // * Przejście do widoku szczegółów zestawu zadań
  const handleCardClick = () => {
    router.push(`/exercises/sets/${set.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Zestaw ${set.name}, ${formatExerciseCount(
        set.exerciseCount,
      )}`}
      className={cn(
        "cursor-pointer group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-60",
        visuals.hoverBorder,
      )}
    >
      {/* ========================================== */}
      {/* OZDOBNY GRADIENT W TLE                     */}
      {/* ========================================== */}
      {/* * Identyczny gradient jak w ActiveStudentCard - sprawdzony wzorzec */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity opacity-50 group-hover:opacity-100",
          visuals.glow,
        )}
      />

      {/* ========================================== */}
      {/* GŁÓWNA TREŚĆ KARTY                         */}
      {/* ========================================== */}
      <div className="relative z-10 flex flex-col h-full items-start w-full">
        {/* * Ikona matematyczna w białym kafelku */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-white shadow-sm">
          <Icon className={cn("h-5 w-5", visuals.iconColor)} />
        </div>

        {/* * Tytuł przeniesiony pod ikonę (zawsze w całości, bez ucinania) */}
        <h3 className="text-xl font-bold leading-tight text-foreground wrap-break-words mt-4 pr-8">
          {set.name}
        </h3>

        {/* * Opis zestawu (maksymalnie 2 linie) */}
        {set.description && (
          <p className="mt-2.5 text-sm font-medium text-muted-foreground line-clamp-2">
            {set.description}
          </p>
        )}

        {/* ========================================== */}
        {/* STOPKA: Metadane, Tagi i Akcja CTA         */}
        {/* ========================================== */}
        <div className="mt-auto flex flex-col gap-3 pt-5 w-full">
          {/* * Liczba zadań i uczeń - space-between gdy mieszczą się w jednej linii, bezpieczny wrap gdy za ciasno */}
          {/* ! Truncate i shrink-0 zabezpieczają przed kopaniem się ikonki i rozszerzaniem karty przy długich nazwiskach */}
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs font-semibold w-full">
            <span
              className={cn(
                "flex items-center gap-1.5 shrink-0",
                visuals.iconColor,
              )}
            >
              <FileText className="h-4 w-4" />
              {formatExerciseCount(set.exerciseCount)}
            </span>
            {set.studentName && (
              <span
                className="flex items-center gap-1.5 text-primary min-w-0 max-w-[65%]"
                title={set.studentName}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate">{set.studentName}</span>
              </span>
            )}
          </div>

          {/* * Tagi o białym tle z obramowaniem (zgodne z zasadą rounded-full dla badgy) */}
          {set.previewTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              {set.previewTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full bg-white border border-border/60 px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80 shadow-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* * Przycisk CTA przypisania zestawu jako pracy domowej */}
          {/* * Zastosowano dynamiczny, subtelny kolor tła hover z motywu zestawu, jak w ActiveStudentCard */}
          <div className="w-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="secondary"
              onClick={() => onAssign(set.id)}
              className={cn(
                "w-full justify-center text-sm font-semibold text-foreground/80 shadow-none transition-colors mt-1",
                visuals.hoverBg,
                "hover:text-foreground",
              )}
            >
              <Send className="mr-2 h-4 w-4 opacity-70" />
              Zadaj jako pracę domową
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MENU KROPKOWE (Dropdown)                   */}
      {/* ========================================== */}
      <div
        className="absolute right-4 top-4 z-20"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Opcje zestawu"
              className="rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-50">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(set.id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edytuj
            </DropdownMenuItem>
            {/* * Duplikacja - umożliwia szybkie stworzenie kopii dla innego ucznia */}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(set.id);
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Duplikuj
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete(set.id);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
