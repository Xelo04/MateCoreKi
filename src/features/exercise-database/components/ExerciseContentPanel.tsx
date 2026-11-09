// ==========================================
// KOMPONENT: Panel treści / rozwiązania zadania
// ==========================================
// * Wspólny panel widoku szczegółów (layout "page") i modala podglądu (layout "modal").
// * Wariant "solution" ma bursztynowy nagłówek. `ref` jako prop (React 19) służy do
// * przewijania panelu rozwiązania do widoku.

"use client";

import { useId } from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExerciseBlock } from "../types";
import { ExerciseContentRenderer } from "./ExerciseContentRenderer";

// ==========================================
// STAŁE
// ==========================================

// ! Pełne literały klas Tailwind (nie składać dynamicznie).
const LAYOUT_CLASSES = {
  // * Strona: stała wysokość na mobile, wypełnienie wysokości kolumny na desktopie
  page: "h-125 lg:h-auto lg:flex-1",
  // * Modal: stała wysokość względem okna, treść przewija się wewnątrz panelu
  modal: "h-[55vh] min-h-80 lg:flex-1",
} as const;

const PANEL_TITLES = {
  content: "Treść zadania",
  solution: "Rozwiązanie",
} as const;

// ==========================================
// KOMPONENT: Panel
// ==========================================

interface ExerciseContentPanelProps {
  readonly variant: "content" | "solution";
  readonly layout: "page" | "modal";
  readonly blocks: readonly ExerciseBlock[];
  readonly emptyMessage?: string;
  readonly ref?: React.Ref<HTMLDivElement>;
}

export function ExerciseContentPanel({
  variant,
  layout,
  blocks,
  emptyMessage,
  ref,
}: ExerciseContentPanelProps) {
  const titleId = useId();
  const isSolution = variant === "solution";

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
        LAYOUT_CLASSES[layout],
        isSolution && "scroll-mt-6 animate-in fade-in zoom-in-95 duration-300",
      )}
    >
      {/* * Nagłówek panelu */}
      <div
        className={cn(
          "flex-none border-b border-border/40 p-5 md:px-8",
          isSolution ? "bg-amber-500/5" : "bg-muted/5",
        )}
      >
        <h2
          id={titleId}
          className={cn(
            "text-xl font-bold tracking-tight",
            isSolution ? "text-amber-700" : "text-foreground/90",
          )}
        >
          {PANEL_TITLES[variant]}
        </h2>
      </div>

      {/* * Przewijana treść (bloki: tekst / obraz / PDF) */}
      <div className="scrollbar-stable min-h-0 flex-1 overflow-y-auto p-5 md:p-8">
        <ExerciseContentRenderer blocks={blocks} emptyMessage={emptyMessage} />
      </div>
    </section>
  );
}

// ==========================================
// KOMPONENT: Przycisk „Pokaż / Ukryj rozwiązanie”
// ==========================================

export function SolutionToggleButton({
  isVisible,
  onToggle,
  showLabel = "Pokaż rozwiązanie",
  hideLabel = "Ukryj rozwiązanie",
}: {
  readonly isVisible: boolean;
  readonly onToggle: () => void;
  readonly showLabel?: string;
  readonly hideLabel?: string;
}) {
  return (
    <Button
      type="button"
      onClick={onToggle}
      aria-expanded={isVisible}
      variant={isVisible ? "secondary" : "default"}
      className={cn(
        "h-11 rounded-xl font-semibold shadow-sm transition-colors",
        !isVisible && "bg-amber-500 text-white hover:bg-amber-600",
      )}
    >
      <Lightbulb
        className={cn("mr-2 h-4 w-4", isVisible && "text-amber-600")}
        aria-hidden="true"
      />
      {isVisible ? hideLabel : showLabel}
    </Button>
  );
}
