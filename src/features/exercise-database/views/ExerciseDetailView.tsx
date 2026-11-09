// ==========================================
// WIDOK: Szczegóły pojedynczego zadania
// ==========================================
// * ExerciseDetailView — pełna strona /exercise-database/:id (akcje: edycja, usuwanie, eksport).
// * ExerciseDetailModal — lekki podgląd w modalu (np. z kreatora zestawu).
// * Oba korzystają z useExerciseDetails oraz wspólnych komponentów: metadane,
// * panele treści i przycisk rozwiązania.

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit2,
  FileDown,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";

import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import {
  ExerciseContentPanel,
  SolutionToggleButton,
} from "../components/ExerciseContentPanel";
import { ExerciseFormModal } from "../components/ExerciseFormModal";
import {
  DetailsToggleButton,
  ExerciseMetadataGrid,
} from "../components/ExerciseMetadataGrid";
import { useExerciseDetails } from "../hook";
import { ExerciseService } from "../service";

// ==========================================
// KOMPONENT POMOCNICZY: Stan ładowania
// ==========================================

function ExerciseLoadingState() {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-muted-foreground"
    >
      <Loader2
        className="h-10 w-10 animate-spin text-primary"
        aria-hidden="true"
      />
      <p className="text-sm font-medium">Ładowanie zadania...</p>
    </div>
  );
}

// ==========================================
// WIDOK: Pełna strona zadania
// ==========================================

export function ExerciseDetailView({
  exerciseId,
}: {
  readonly exerciseId: string;
}) {
  const router = useRouter();
  const { exercise, isLoading, error, refetch } =
    useExerciseDetails(exerciseId);

  // * Kontrola UI
  const [isSolutionVisible, setIsSolutionVisible] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // * Stan modali (edycja i usuwanie)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // * Referencja panelu rozwiązania (przewijanie po jego pokazaniu)
  const solutionRef = useRef<HTMLDivElement>(null);

  // * Brak zadania po zakończeniu ładowania → powrót do listy.
  // * Błąd sieci jest już zatoastowany przez hook; „nie znaleziono” toastujemy tu
  // * (stałe `id` zapobiega podwójnemu toastowi w StrictMode).
  useEffect(() => {
    if (isLoading || exercise) return;
    if (!error) {
      toast.error("Nie znaleziono zadania o podanym ID", {
        id: "exercise-not-found",
      });
    }
    router.push("/exercise-database");
  }, [isLoading, exercise, error, router]);

  // * Po pokazaniu rozwiązania przewijamy je do widoku. Cleanup anuluje zaplanowaną klatkę.
  useEffect(() => {
    if (!isSolutionVisible) return;
    const frameId = window.requestAnimationFrame(() => {
      solutionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isSolutionVisible]);

  // * Usunięcie zadania; po sukcesie nawigacja do listy
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ExerciseService.deleteExercise(exerciseId);
      toast.success("Zadanie zostało usunięte");
      router.push("/exercise-database");
    } catch (err) {
      console.error("Delete exercise error:", err);
      toast.error("Nie udało się usunąć zadania");
      setIsDeleting(false);
    }
  };

  // TODO: [BACKEND] Eksport zadania do PDF (endpoint generujący plik)
  const handleExportPdf = () => {
    toast.info("Eksport do PDF będzie dostępny wkrótce.");
  };

  // * Loader tylko przy pierwszym ładowaniu; refetch po edycji nie zasłania strony
  if (isLoading && !exercise) return <ExerciseLoadingState />;
  if (!exercise) return null;

  const hasSolution = Boolean(exercise.solution?.length);

  return (
    <div className="flex w-full flex-col gap-6 pb-16 lg:h-[calc(100vh-6rem)] lg:overflow-hidden lg:pb-0">
      {/* ========================================== */}
      {/* PASEK AKCJI                                */}
      {/* ========================================== */}
      <div className="flex flex-none flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/exercise-database")}
          className="h-11 rounded-xl text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Wróć do listy
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          {/* * Przełącznik rozwiązania (tylko gdy zadanie je ma) */}
          {hasSolution && (
            <SolutionToggleButton
              isVisible={isSolutionVisible}
              onToggle={() => setIsSolutionVisible((visible) => !visible)}
            />
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleExportPdf}
            className="hidden h-11 rounded-xl bg-white shadow-sm lg:flex"
          >
            <FileDown className="mr-2 h-4 w-4" aria-hidden="true" />
            Eksportuj PDF
          </Button>

          <Button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="h-11 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Edytuj
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-11 rounded-xl shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Usuń
          </Button>
        </div>
      </div>

      {/* ========================================== */}
      {/* TYTUŁ + PRZYCISK SZCZEGÓŁÓW                */}
      {/* ========================================== */}
      <div className="flex flex-none flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold tracking-tight text-foreground/90 md:text-3xl">
            {exercise.title}
          </h1>
        </div>
        <DetailsToggleButton
          isOpen={isDetailsOpen}
          onToggle={() => setIsDetailsOpen((open) => !open)}
        />
      </div>

      {/* * Rozwijane metadane zadania */}
      {isDetailsOpen && (
        <div className="w-full flex-none animate-in fade-in slide-in-from-top-2 duration-200">
          <ExerciseMetadataGrid exercise={exercise} />
        </div>
      )}

      {/* ========================================== */}
      {/* GŁÓWNY GRID: PANELE ZE SCROLLEM            */}
      {/* ========================================== */}
      <div className="flex flex-col gap-6 lg:min-h-0 lg:flex-1 lg:flex-row">
        <ExerciseContentPanel
          variant="content"
          layout="page"
          blocks={exercise.content}
        />

        {isSolutionVisible && (
          <ExerciseContentPanel
            ref={solutionRef}
            variant="solution"
            layout="page"
            blocks={exercise.solution ?? []}
            emptyMessage="To zadanie nie posiada zapisanego rozwiązania."
          />
        )}
      </div>

      {/* ========================================== */}
      {/* MODALE                                     */}
      {/* ========================================== */}
      <ExerciseFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        exerciseId={exerciseId}
        onSuccess={refetch}
      />

      <DeleteConfirmModal
        open={isDeleteDialogOpen}
        title="Usuń zadanie"
        description={
          <>
            Czy na pewno chcesz trwale usunąć to zadanie? Tej operacji{" "}
            <strong>nie można cofnąć</strong>, a zadanie zostanie usunięte ze
            wszystkich przypisanych zestawów.
          </>
        }
        isDeleting={isDeleting}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

// ==========================================
// KOMPONENT: Treść modala podglądu
// ==========================================
// * Montowany tylko przy otwartym modalu (key={exerciseId}) — każde otwarcie i każda
// * zmiana zadania zaczyna od czystego stanu (bez ręcznych resetów w efekcie).
// * Górny pasek: tytuł + akcje (rozwiązanie, szczegóły, edycja, usuwanie).

interface ExerciseDetailModalBodyProps {
  readonly exerciseId: string;
  readonly onClose: () => void;
  readonly onUpdated?: () => void;
  readonly onDeleted?: (id: string) => void;
}

function ExerciseDetailModalBody({
  exerciseId,
  onClose,
  onUpdated,
  onDeleted,
}: ExerciseDetailModalBodyProps) {
  const { exercise, isLoading, error, refetch } =
    useExerciseDetails(exerciseId);

  const [isSolutionVisible, setIsSolutionVisible] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // * Usunięcie zadania; po sukcesie informujemy rodzica i zamykamy podgląd
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await ExerciseService.deleteExercise(exerciseId);
      toast.success("Zadanie zostało usunięte");
      onDeleted?.(exerciseId);
      onClose();
    } catch (err) {
      console.error("Delete exercise error:", err);
      toast.error("Nie udało się usunąć zadania");
      setIsDeleting(false);
    }
  };

  // * Loader tylko przy pierwszym ładowaniu — refetch po edycji nie może odmontować modali
  if (isLoading && !exercise) return <ExerciseLoadingState />;

  if (!exercise) {
    return (
      <p
        role="alert"
        className="py-16 text-center text-sm font-medium text-destructive"
      >
        {error ?? "Nie znaleziono zadania o podanym ID."}
      </p>
    );
  }

  const hasSolution = Boolean(exercise.solution?.length);

  return (
    <div className="flex w-full flex-col gap-6 pb-2">
      {/* ========================================== */}
      {/* GÓRNY PASEK: tytuł + akcje                 */}
      {/* ========================================== */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold tracking-tight text-foreground/90">
          {exercise.title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:flex-nowrap">
          {/* * Przełącznik rozwiązania (tylko gdy zadanie je ma) */}
          {hasSolution && (
            <SolutionToggleButton
              isVisible={isSolutionVisible}
              onToggle={() => setIsSolutionVisible((visible) => !visible)}
            />
          )}

          <DetailsToggleButton
            isOpen={isDetailsOpen}
            onToggle={() => setIsDetailsOpen((open) => !open)}
          />

          <Button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="h-11 rounded-xl bg-blue-600 font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Edit2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Edytuj
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

      {/* * Rozwijane metadane */}
      {isDetailsOpen && <ExerciseMetadataGrid exercise={exercise} />}

      {/* ========================================== */}
      {/* PANELE: treść i rozwiązanie (przewijane)   */}
      {/* ========================================== */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <ExerciseContentPanel
          variant="content"
          layout="modal"
          blocks={exercise.content}
        />
        {isSolutionVisible && (
          <ExerciseContentPanel
            variant="solution"
            layout="modal"
            blocks={exercise.solution ?? []}
            emptyMessage="To zadanie nie posiada zapisanego rozwiązania."
          />
        )}
      </div>

      {/* ========================================== */}
      {/* MODALE ZAGNIEŻDŻONE: edycja i usuwanie     */}
      {/* ========================================== */}
      <ExerciseFormModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        exerciseId={exerciseId}
        onSuccess={() => {
          refetch();
          onUpdated?.();
        }}
      />

      <DeleteConfirmModal
        open={isDeleteOpen}
        title="Usuń zadanie"
        description={
          <>
            Czy na pewno chcesz trwale usunąć to zadanie? Tej operacji{" "}
            <strong>nie można cofnąć</strong>, a zadanie zostanie usunięte ze
            wszystkich przypisanych zestawów.
          </>
        }
        isDeleting={isDeleting}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}

// ==========================================
// KOMPONENT: Modal podglądu zadania
// ==========================================
// * Tytuł powłoki jest statyczny; tytuł zadania wyświetla treść modala.
// * `onUpdated` / `onDeleted` pozwalają rodzicowi (np. kreatorowi zestawu) zareagować
// * na zmiany zrobione z poziomu podglądu.

export function ExerciseDetailModal({
  exerciseId,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  readonly exerciseId: string | null;
  readonly onOpenChange: (open: boolean) => void;
  readonly onUpdated?: () => void;
  readonly onDeleted?: (id: string) => void;
}) {
  return (
    <ModalShell
      open={exerciseId !== null}
      onOpenChange={onOpenChange}
      onClose={() => onOpenChange(false)}
      title="Podgląd zadania"
      icon={<FileText className="h-6 w-6 text-white" aria-hidden="true" />}
      className="max-w-6xl"
      hideFooter
    >
      {exerciseId !== null && (
        <ExerciseDetailModalBody
          key={exerciseId}
          exerciseId={exerciseId}
          onClose={() => onOpenChange(false)}
          onUpdated={onUpdated}
          onDeleted={onDeleted}
        />
      )}
    </ModalShell>
  );
}
