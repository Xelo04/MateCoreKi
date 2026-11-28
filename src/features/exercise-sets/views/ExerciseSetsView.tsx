// ==========================================
// WIDOK: Baza zestawów zadań
// ==========================================
// * Osobna zakładka dla zestawów. Wspólny core zadań pozostaje w exercise-database.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, FolderOpen, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ErrorState } from "@/components/ListStates";
import { ExerciseSetsSection } from "../components/ExerciseSetsSection";
import { useExerciseSetsList } from "../hook";

export function ExerciseSetsView() {
  const router = useRouter();
  const { items, isLoading, error, refetch, deleteExerciseSet, moveExerciseSet, archiveExerciseSet } =
    useExerciseSetsList();
  const archive = useExerciseSetsList(true);
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
        onClearSearch={() => setSearchQuery("")}
        onCreate={() => router.push("/exercise-sets/builder")}
        onSetsChanged={refetch}
        onMoveSet={moveExerciseSet}
        onEdit={(id) => router.push(`/exercise-sets/builder/${id}`)}
        onDuplicate={() => toast.info("Wkrótce dostępne")}
        onDelete={setSetToDelete}
        onArchive={(id) => {
          void archiveExerciseSet(id).then((success) => { if (success) archive.refetch(); });
        }}
        onAssign={() => toast.info("Formularz przypisywania pracy domowej - wkrótce")}
      />

      <Accordion type="single" collapsible className="w-full pt-8">
        <AccordionItem value="archive" className="border-none bg-transparent p-0 shadow-none">
          <AccordionTrigger className="rounded-2xl border border-border/50 bg-card px-6 py-4 hover:no-underline">
            Archiwum zestawów ({archive.items.length})
          </AccordionTrigger>
          <AccordionContent className="pt-6">
            {archive.error ? <ErrorState message={archive.error} onRetry={archive.refetch} /> :
              archive.isLoading ? <p>Ładowanie archiwum...</p> :
              archive.items.length === 0 ? (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/60 bg-card px-6 py-12 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                    <Archive className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">Archiwum jest puste</h3>
                  <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                    Zarchiwizowane zestawy są ukryte z głównej listy, ale pozostają dostępne do wglądu i można je przywrócić. Zestaw przypisany jako praca domowa zarchiwizujesz w menu jego karty.
                  </p>
                </div>
              ) :
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {archive.items.map((set) => (
                  <div key={set.id} className="space-y-3 rounded-2xl border bg-card p-5">
                    <button type="button" className="block text-left font-semibold hover:underline" onClick={() => router.push(`/exercise-sets/${set.id}`)}>
                      {set.name}
                    </button>
                    <Button type="button" variant="outline" onClick={() => {
                      void archive.restoreExerciseSet(set.id).then((success) => { if (success) refetch(); });
                    }}>Przywróć</Button>
                  </div>
                ))}
              </div>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

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
