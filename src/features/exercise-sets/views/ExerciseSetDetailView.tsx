// ==========================================
// WIDOK: Szczegóły zestawu zadań (/exercise-sets/:id)
// ==========================================
// * Zestaw jako „dokument”: nagłówek z metadanymi i kolorystycznym akcentem,
// * a pod nim ciągły arkusz ponumerowanych zadań z rozwijanymi rozwiązaniami.
// * Akcje: edycja (kreator), duplikacja, usunięcie, przypisanie pracy domowej, eksport PDF.
// * Dane: useExerciseSetDetail (zestaw z rozwiniętymi, pełnymi zadaniami).

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Clock,
  Copy,
  Edit2,
  FileDown,
  ListChecks,
  Loader2,
  Send,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContentLoader } from "@/components/layout/ContentLoader";
import { cn } from "@/lib/utils";

import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import { SolutionToggleButton } from "@/features/exercise-database/components/ExerciseContentPanel";
import { ErrorState } from "@/components/ListStates";
import { SetExerciseCard } from "../components/SetExerciseCard";
import { useExerciseSetDetail } from "../hook";
import { ExerciseSetService } from "../service";
import type { Exercise } from "@/features/exercise-database/types";
import {
  formatDateTime,
  formatExerciseCount,
  getPreviewTags,
  getSetVisuals,
  hasExerciseSolution,
  sumExercisePoints,
} from "@/features/exercise-database/utils";

// ==========================================
// STAŁE
// ==========================================

// * Stała modułowa: stabilna referencja dla useMemo, gdy zestaw jeszcze się ładuje
const EMPTY_EXERCISES: readonly Exercise[] = [];

// * Ile tagów (zebranych z zadań) pokazujemy w nagłówku
const MAX_HEADER_TAGS = 8;

// ==========================================
// KOMPONENTY POMOCNICZE
// ==========================================

// * Pojedyncza statystyka w nagłówku (ikona + tekst)
function StatItem({
  icon: Icon,
  children,
}: {
  readonly icon: LucideIcon;
  readonly children: React.ReactNode;
}) {
  return (
    <li className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
      <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      {children}
    </li>
  );
}

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExerciseSetDetailView({ setId }: { readonly setId: string }) {
  const router = useRouter();
  const { detail, isLoading, error, refetch } = useExerciseSetDetail(setId);

  // ----- Stan UI -----
  // * ID zadań z rozwiniętym rozwiązaniem (jeden zbiór dla przycisków lokalnych i globalnego)
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  // ----- Wartości pochodne (useMemo, nie efekty) -----
  const exercises = detail?.exercises ?? EMPTY_EXERCISES;

  // * ID zadań, które w ogóle mają rozwiązanie (tylko one dostają przycisk)
  const solutionIds = useMemo(
    () =>
      exercises
        .filter((exercise) => hasExerciseSolution(exercise))
        .map((exercise) => exercise.id),
    [exercises],
  );
  const totalPoints = useMemo(() => sumExercisePoints(exercises), [exercises]);
  const headerTags = useMemo(
    () =>
      getPreviewTags(
        exercises.map((exercise) => exercise.tags),
        MAX_HEADER_TAGS,
      ),
    [exercises],
  );

  // * Globalny przełącznik jest „włączony”, gdy rozwinięte są wszystkie dostępne rozwiązania
  const areAllSolutionsVisible =
    solutionIds.length > 0 && solutionIds.every((id) => expandedIds.has(id));

  // ----- Efekty -----

  // * Brak zestawu po zakończeniu ładowania → powrót do bazy.
  // * Stałe `id` toastu chroni przed dublem w StrictMode; błąd sieci obsługuje ErrorState.
  useEffect(() => {
    if (isLoading || detail || error) return;
    toast.error("Nie znaleziono zestawu", { id: "exercise-set-not-found" });
    router.push("/exercise-sets");
  }, [isLoading, detail, error, router]);

  // ----- Handlery -----

  const toggleSolution = (exerciseId: string) => {
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(exerciseId)) next.delete(exerciseId);
      else next.add(exerciseId);
      return next;
    });
  };

  const toggleAllSolutions = () => {
    setExpandedIds(areAllSolutionsVisible ? new Set() : new Set(solutionIds));
  };

  // * Duplikacja: po utworzeniu kopii przechodzimy od razu na jej stronę
  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      const copy = await ExerciseSetService.duplicate(setId);
      toast.success("Utworzono kopię zestawu");
      router.push(`/exercise-sets/${copy.id}`);
    } catch (err) {
      console.error("Duplicate exercise set error:", err);
      toast.error("Błąd duplikowania zestawu");
    } finally {
      setIsDuplicating(false);
    }
  };

  // * Usunięcie zestawu (zadania zostają w bazie); po sukcesie powrót do bazy
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ExerciseSetService.remove(setId);
      toast.success("Zestaw został usunięty");
      router.push("/exercise-sets");
    } catch (err) {
      console.error("Delete exercise set error:", err);
      toast.error("Nie udało się usunąć zestawu");
      setIsDeleting(false);
    }
  };

  // TODO: [BACKEND] Formularz przypisywania zestawu jako pracy domowej (moduł uczniów)
  const handleAssign = () => {
    toast.info("Formularz przypisywania pracy domowej - wkrótce");
  };

  // TODO: [BACKEND] Eksport zestawu do PDF (endpoint generujący plik)
  const handleExportPdf = () => {
    toast.info("Eksport do PDF będzie dostępny wkrótce.");
  };

  const goToBuilder = () => router.push(`/exercise-sets/builder/${setId}`);

  // ----- Stany: ładowanie → błąd → brak (guardy PO wszystkich hookach) -----

  if (isLoading && !detail) {
    return (
      <div className="space-y-12 pb-16">
        <ContentLoader minHeight="min-h-125" />
      </div>
    );
  }
  if (error && !detail) return <ErrorState message={error} onRetry={refetch} />;
  if (!detail) return null;

  // * Stabilny motyw karty zestawu (ten sam gradient i ikona co na kafelku)
  const visuals = getSetVisuals(setId);

  return (
    <div className="space-y-8 pb-16">
      {/* ========================================== */}
      {/* PASEK AKCJI                                */}
      {/* ========================================== */}
      {/* * Mobile: „Wróć” w osobnym wierszu nad akcjami; od lg w jednym rzędzie */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/exercise-sets")}
          className="-ml-3 h-11 self-start rounded-xl text-muted-foreground hover:text-foreground lg:ml-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Wróć do bazy
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleAssign}
            className="h-11 rounded-xl font-semibold shadow-sm"
          >
            <Send className="mr-2 h-4 w-4" aria-hidden="true" />
            Zadaj jako pracę domową
          </Button>

          {/* * Eksport widoczny od lg (jak w widoku szczegółów zadania) */}
          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            className="hidden h-11 rounded-xl bg-card shadow-sm lg:inline-flex"
          >
            <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
            Eksportuj PDF
          </Button>

          <Button
            type="button"
            onClick={goToBuilder}
            className="h-11 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Edytuj
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => void handleDuplicate()}
            disabled={isDuplicating}
            className="h-11 rounded-xl bg-card shadow-sm"
          >
            {isDuplicating ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            Duplikuj
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="h-11 rounded-xl shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Usuń
          </Button>
        </div>
      </div>

      {/* ========================================== */}
      {/* NAGŁÓWEK ZESTAWU                           */}
      {/* ========================================== */}
      <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        {/* * Ozdobny gradient w kolorze motywu zestawu (jak na kafelku) */}
        <div
          className={cn(
            "pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-70 blur-3xl",
            visuals.glow,
          )}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="min-w-0 flex-1 space-y-4">
            {/* * Nazwa i opis (opis to prywatna notatka korepetytora) */}
            <div className="space-y-2">
              <h1 className="wrap-break-word text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {detail.name}
              </h1>
              {detail.description && (
                <p className="whitespace-pre-wrap text-sm font-medium text-muted-foreground">
                  {detail.description}
                </p>
              )}
            </div>

            {/* * Statystyki: liczba zadań, suma punktów, ostatnia edycja */}
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <StatItem icon={ListChecks}>
                {formatExerciseCount(exercises.length)}
              </StatItem>
              {totalPoints !== null && (
                <StatItem icon={Award}>Razem: {totalPoints} pkt</StatItem>
              )}
              <StatItem icon={Clock}>
                Edytowano: {formatDateTime(detail.updatedAt)}
              </StatItem>
            </ul>

            {/* * Tagi zebrane z zadań zestawu */}
            {headerTags.length > 0 && (
              <ul
                aria-label="Tagi zestawu"
                className="flex flex-wrap items-center gap-1.5"
              >
                {headerTags.map((tag) => (
                  <li
                    key={tag.id}
                    className="inline-flex items-center rounded-full border border-border/60 bg-card px-2.5 py-0.5 text-[11px] font-semibold text-foreground/80 shadow-sm"
                  >
                    {tag.name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </header>

      {/* ========================================== */}
      {/* ARKUSZ ZADAŃ                               */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-foreground">
              Zadania w zestawie ({exercises.length})
            </h2>
          </div>

          {/* * Globalny przełącznik rozwiązań (tylko gdy jakiekolwiek zadanie je ma) */}
          {solutionIds.length > 0 && (
            <SolutionToggleButton
              isVisible={areAllSolutionsVisible}
              onToggle={toggleAllSolutions}
              showLabel="Pokaż wszystkie rozwiązania"
              hideLabel="Ukryj wszystkie rozwiązania"
            />
          )}
        </div>

        {exercises.length === 0 ? (
          // * Pusty zestaw (np. wszystkie zadania usunięto z bazy)
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/5 px-4 py-20 text-center">
            <p className="text-lg font-semibold text-foreground">
              Ten zestaw nie zawiera zadań
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Dodaj zadania w kreatorze, aby zbudować arkusz.
            </p>
            <Button
              type="button"
              onClick={goToBuilder}
              className="mt-6 h-11 rounded-xl font-semibold shadow-sm"
            >
              <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
              Edytuj zestaw
            </Button>
          </div>
        ) : (
          <ol className="space-y-6">
            {exercises.map((exercise, index) => (
              <li key={exercise.id}>
                <SetExerciseCard
                  exercise={exercise}
                  number={index + 1}
                  isSolutionVisible={expandedIds.has(exercise.id)}
                  onToggleSolution={() => toggleSolution(exercise.id)}
                  onOpen={() => router.push(`/exercise-sets/${exercise.id}`)}
                />
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* ========================================== */}
      {/* MODAL: POTWIERDZENIE USUNIĘCIA             */}
      {/* ========================================== */}
      <DeleteConfirmModal
        open={isDeleteOpen}
        title="Usuń zestaw"
        description={
          <>
            Czy na pewno chcesz trwale usunąć ten zestaw? Tej operacji{" "}
            <strong>nie można cofnąć</strong>. Zadania z zestawu pozostaną w
            bazie.
          </>
        }
        isDeleting={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
