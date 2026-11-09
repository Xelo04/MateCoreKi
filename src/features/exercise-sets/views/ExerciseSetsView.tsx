// ==========================================
// WIDOK: Baza zestawów zadań
// ==========================================
// * Osobna zakładka dla zestawów. Wspólny core zadań pozostaje w exercise-database.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { ExerciseSetsSection } from "../components/ExerciseSetsSection";
import { useExerciseSetsList } from "../hook";

export function ExerciseSetsView() {
  const router = useRouter();
  const { items, isLoading, error, refetch, deleteExerciseSet, duplicateExerciseSet, moveExerciseSet } =
    useExerciseSetsList();
  const [setToDelete, setSetToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleDelete = async () => {
    if (!setToDelete) return;
    setIsDeleting(true);
    try {
      if (await deleteExerciseSet(setToDelete)) setSetToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* * Zakładka jasno opisuje, że służy wyłącznie do organizowania zestawów. */}
      <div className="flex flex-col justify-between gap-6 xl:flex-row xl:items-center">
        <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FolderOpen className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Zestawy zadań</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tutaj tworzysz zestawy, przypisujesz im foldery i układasz kolejność zadań.
          </p>
        </div>
      </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="relative min-w-0 flex-1 sm:min-w-72 xl:w-80">
            <Search
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              aria-label="Szukaj zestawów zadań"
              placeholder="Szukaj po nazwie lub opisie..."
              className="h-11 rounded-xl border-border/50 bg-card pl-11"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button
            type="button"
            className="h-11 shrink-0 rounded-xl font-semibold shadow-sm"
            onClick={() => router.push("/exercise-sets/builder")}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Dodaj zestaw
          </Button>
        </div>
      </div>

      {/* * Lista zestawów jest niezależna od zakładki pojedynczych zadań. */}
      <ExerciseSetsSection
        sets={items}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        searchQuery={searchQuery}
        onSetsChanged={refetch}
        onMoveSet={moveExerciseSet}
        onEdit={(id) => router.push(`/exercise-sets/builder/${id}`)}
        onDuplicate={(id) => void duplicateExerciseSet(id)}
        onDelete={setSetToDelete}
        onAssign={() => toast.info("Formularz przypisywania pracy domowej - wkrótce")}
      />

      <DeleteConfirmModal
        open={setToDelete !== null}
        title="Usuń zestaw"
        description="Zadania z zestawu pozostaną w bazie pojedynczych zadań."
        isDeleting={isDeleting}
        onClose={() => setSetToDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
