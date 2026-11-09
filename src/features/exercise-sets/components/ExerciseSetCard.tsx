// ==========================================
// KOMPONENT: Karta zestawu zadań
// ==========================================
// * Karta na liście zestawów: ozdobny gradient (jak w ActiveStudentCard), opis,
// * podgląd tagów w kapsułkach, menu kropkowe (edycja / duplikacja / usuwanie)
// * oraz przycisk szybkiego przypisania jako pracy domowej.

"use client";

import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { Copy, MoreVertical, Pencil, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ExerciseSetListItem } from "../types";
import { formatExerciseCount, getSetVisuals } from "@/features/exercise-database/utils";

// ----- TYPY -----

interface ExerciseSetCardProps {
  readonly set: ExerciseSetListItem;
  readonly onEdit: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onAssign: (id: string) => void;
}

// ----- KOMPONENT -----

export function ExerciseSetCard({
  set,
  onEdit,
  onDuplicate,
  onDelete,
  onAssign,
}: ExerciseSetCardProps) {
  const router = useRouter();
  const visuals = getSetVisuals(set.id);

  // * Kliknięcie karty otwiera zestaw w kreatorze
  const handleCardClick = () => {
    router.push(`/exercise-sets/${set.id}`);
  };

  return (
    <Card
      draggable
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/exercise-set-id", set.id);
        const dragPreview = document.createElement("div");
        dragPreview.className = "set-drag-preview";
        const previewIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        previewIcon.setAttribute("class", "set-drag-preview-icon");
        previewIcon.setAttribute("viewBox", "0 0 24 24");
        previewIcon.setAttribute("fill", "none");
        previewIcon.setAttribute("stroke", "currentColor");
        previewIcon.setAttribute("stroke-width", "2");
        previewIcon.setAttribute("stroke-linecap", "round");
        previewIcon.setAttribute("stroke-linejoin", "round");
        previewIcon.innerHTML =
          '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/>';
        const previewName = document.createElement("span");
        previewName.className = "set-drag-preview-name";
        previewName.textContent = set.name;
        dragPreview.append(previewIcon, previewName);
        document.body.appendChild(dragPreview);
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (context) {
          context.font = "700 14px sans-serif";
          const textWidth = Math.ceil(context.measureText(set.name).width);
          dragPreview.style.width = `${Math.max(180, textWidth + 58)}px`;
        }
        event.dataTransfer.setDragImage(dragPreview, 18, 22);
        window.setTimeout(() => dragPreview.remove(), 0);
      }}
      onClick={handleCardClick}
      onKeyDown={(event) => {
        // ! Tylko klawisze samej karty — Enter na przycisku „Zadaj…” lub w menu
        // ! (elementy zagnieżdżone) nie może nawigować do kreatora.
        if (
          event.target === event.currentTarget &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Zestaw ${set.name}, ${formatExerciseCount(set.exerciseCount)}`}
      className={cn(
        "group relative flex min-h-60 cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border-2 border-transparent bg-card p-6 shadow-sm outline-none transition-all hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary set-card-border",
      )}
      style={{ "--set-accent": visuals.accentHex } as CSSProperties}
    >
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity opacity-50 group-hover:opacity-100 ${visuals.glow}`}
        aria-hidden="true"
      />
      {/* ========================================== */}
      {/* GŁÓWNA TREŚĆ KARTY                         */}
      {/* ========================================== */}
      <div className="relative z-10 flex h-full w-full flex-col items-start">
        {/* * Tytuł pod ikoną (zawsze w całości, bez ucinania) */}
        <h3 className="wrap-break-words pr-8 text-xl font-bold leading-tight text-foreground">
          {set.name}
        </h3>

        {/* * Opis zestawu (maksymalnie 2 linie) */}
        {set.description && (
          <p className="mt-2.5 line-clamp-2 text-sm font-medium text-muted-foreground">
            {set.description}
          </p>
        )}

        {/* ========================================== */}
        {/* STOPKA: tagi i akcja CTA                   */}
        {/* ========================================== */}
        <div className="mt-auto flex w-full flex-col gap-3 pt-5">
          {/* * Tagi podglądowe (białe kapsułki z obramowaniem) */}
          {set.previewTags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {set.previewTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80 shadow-sm"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          {/* * CTA: przypisanie zestawu jako pracy domowej (hover w kolorze motywu karty) */}
          <div className="w-full" onClick={(event) => event.stopPropagation()}>
            <Button
              variant="secondary"
              onClick={() => onAssign(set.id)}
              className={cn(
                "mt-1 w-full justify-center text-sm font-semibold text-foreground/80 shadow-none transition-colors hover:text-foreground",
                visuals.hoverBg,
              )}
            >
              <Send className="mr-2 h-4 w-4 opacity-70" aria-hidden="true" />
              Zadaj jako pracę domową
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* MENU KROPKOWE                              */}
      {/* ========================================== */}
      {/* * Wrapper zatrzymuje propagację także z zawartości portalu menu (zdarzenia React */}
      {/* * bąbelkują przez portal), więc pojedyncze pozycje nie muszą tego robić same. */}
      <div
        className="absolute right-4 top-4 z-20"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Opcje zestawu"
              className="rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50 w-44">
            <DropdownMenuItem onClick={() => onEdit(set.id)}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Edytuj
            </DropdownMenuItem>
            {/* * Duplikacja: szybka kopia zestawu dla innego ucznia */}
            <DropdownMenuItem onClick={() => onDuplicate(set.id)}>
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" /> Duplikuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(set.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
