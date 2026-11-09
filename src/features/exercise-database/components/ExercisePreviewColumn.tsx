// ==========================================
// KOMPONENT: Kontekstowy podgląd zadania (prawa kolumna formularza)
// ==========================================
// * Pokazuje na żywo bloki treści lub rozwiązania wpisywane w kreatorach.
// * Renderowanie bloków deleguje do ExerciseContentRenderer (size="compact").

"use client";

import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExerciseFormBlockData } from "../schema";
import { ExerciseContentRenderer } from "./ExerciseContentRenderer";

// ==========================================
// TYPY
// ==========================================

interface ExercisePreviewColumnProps {
  readonly isVisible: boolean;
  readonly activeTab: "info" | "content" | "solution";
  readonly watchedContent: readonly ExerciseFormBlockData[];
  readonly watchedSolution: readonly ExerciseFormBlockData[];
}

// ==========================================
// KOMPONENT
// ==========================================

export function ExercisePreviewColumn({
  isVisible,
  activeTab,
  watchedContent,
  watchedSolution,
}: ExercisePreviewColumnProps) {
  // ! Kolumna jest montowana ZAWSZE (ukrywana klasą `hidden`, gdy !isVisible).
  // ! Dzięki temu pliki PDF wczytują się raz, a zmiana zakładki ich nie przeładowuje.
  return (
    <div className={cn("w-full min-w-0", !isVisible ? "hidden" : "lg:block")}>
      <div className="sticky top-6">
        {/* * Stała, umiarkowana wysokość okna; nagłówek zostaje na górze, treść przewija się w środku */}
        <div className="flex h-[60vh] max-h-170 min-h-80 flex-col overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
          {/* * Nagłówek panelu podglądu (nie przewija się) */}
          <div className="flex flex-none items-center gap-2 border-b border-border/30 px-6 py-3">
            <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Podgląd ({activeTab === "solution" ? "Rozwiązanie" : "Treść"})
            </span>
          </div>

          {/* * Przewijana zawartość: bloki treści / rozwiązania */}
          <div className="scrollbar-stable min-h-0 flex-1 overflow-y-auto p-6">
            {/* * Sekcja: Treść zadania (ukryta, gdy aktywna inna zakładka — stan PDF zostaje) */}
            <div className={cn(activeTab !== "content" && "hidden")}>
              <ExerciseContentRenderer
                blocks={watchedContent}
                size="compact"
                emptyMessage="Brak dodanych bloków treści."
              />
            </div>

            {/* * Sekcja: Rozwiązanie */}
            <div className={cn(activeTab !== "solution" && "hidden")}>
              <ExerciseContentRenderer
                blocks={watchedSolution}
                size="compact"
                emptyMessage="Brak dodanych bloków rozwiązania."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
