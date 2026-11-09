// ==========================================
// WIDOK: Baza zadań (/exercise-database)
// ==========================================
// * Cienki orkiestrator wyłącznie dla pojedynczych zadań: wspólna przeglądarka
// * zadań (ExerciseBrowser) + modale (formularz zadania, potwierdzenie usunięcia).
// * Filtrowanie żyje w komponentach domenowych, tu tylko dane, mutacje i modale.

"use client";

import { useState } from "react";
import { LibraryBig, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ExerciseBrowser } from "../components/ExerciseBrowser";
import { ExerciseFormModal } from "../components/ExerciseFormModal";
import { ErrorState } from "@/components/ListStates";
import { useCategoriesTree, useExercisesList } from "../hook";

// ==========================================
// TYPY LOKALNE
// ==========================================

// * Jeden stan modala formularza: otwarcie + ID edytowanego zadania (undefined = dodawanie)
interface ExerciseModalState {
  readonly isOpen: boolean;
  readonly exerciseId?: string;
}

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExercisesView() {
  // ----- Dane i mutacje -----
  const {
    items: exercises,
    isLoading: exercisesLoading,
    error: exercisesError,
    refetch: refetchExercises,
    deleteExercise,
  } = useExercisesList();
  const { tree: categoriesTree } = useCategoriesTree();

  // ----- Stan modali -----
  const [exerciseModal, setExerciseModal] = useState<ExerciseModalState>({
    isOpen: false,
  });
  const [exerciseToDelete, setExerciseToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // ----- Handlery -----

  const handleExerciseSaved = () => refetchExercises();

  const handleConfirmDeleteExercise = async () => {
    if (!exerciseToDelete) return;
    setIsDeleting(true);
    try {
      if (await deleteExercise(exerciseToDelete)) {
        setExerciseToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================== */}
      {/* NAGŁÓWEK STRONY                            */}
      {/* ========================================== */}
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LibraryBig className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Baza zadań
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Twórz, edytuj i szybko znajduj zadania
            </p>
          </div>
        </div>

        {/* * Główne akcje bazy są w jednym miejscu: wyszukiwanie i dodawanie. */}
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="relative min-w-0 flex-1 sm:min-w-72 xl:w-80">
            <Search
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Szukaj w bazie zadań"
              placeholder="Szukaj po tytule, dziale lub tagu..."
              className="h-11 rounded-xl border-border/50 bg-card pl-11"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button
            type="button"
            className="h-11 shrink-0 rounded-xl font-semibold shadow-sm"
            onClick={() => setExerciseModal({ isOpen: true })}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Dodaj zadanie
          </Button>
        </div>
      </div>

      {/* ========================================== */}
      {/* SEKCJA: BAZA ZADAŃ                         */}
      {/* ========================================== */}
      {exercisesError ? (
        <ErrorState message={exercisesError} onRetry={refetchExercises} />
      ) : (
        <ExerciseBrowser
          exercises={exercises}
          isLoading={exercisesLoading}
          categoriesTree={categoriesTree}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onEdit={(id) => setExerciseModal({ isOpen: true, exerciseId: id })}
          onDelete={setExerciseToDelete}
        />
      )}

      {/* ========================================== */}
      {/* MODALE                                     */}
      {/* ========================================== */}
      <ExerciseFormModal
        open={exerciseModal.isOpen}
        onOpenChange={(isOpen) =>
          setExerciseModal((previous) => ({ ...previous, isOpen }))
        }
        exerciseId={exerciseModal.exerciseId}
        onSuccess={handleExerciseSaved}
      />

      <DeleteConfirmModal
        open={exerciseToDelete !== null}
        title="Usuń zadanie"
        description={
          <>
            Czy na pewno chcesz trwale usunąć to zadanie? Tej operacji{" "}
            <strong>nie można cofnąć</strong>, a zadanie zostanie usunięte ze
            wszystkich przypisanych zestawów.
          </>
        }
        isDeleting={isDeleting}
        onClose={() => setExerciseToDelete(null)}
        onConfirm={() => void handleConfirmDeleteExercise()}
      />
    </div>
  );
}
