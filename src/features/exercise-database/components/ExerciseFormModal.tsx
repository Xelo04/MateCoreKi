// ==========================================
// KOMPONENT: Modal dodawania/edycji zadania
// ==========================================
// * Powłoka (ModalShell) + treść montowana świeżo przy każdym otwarciu.
// * Dzięki temu nie ma ręcznego resetu stanu ani kluczy wymuszających re-render,
// * a po edycji zadania formularz „Dodaj” zawsze startuje pusty.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";

import { ExerciseForm, type ExerciseFormHandle, type FormTabId } from "./ExerciseForm";
import type { ExerciseFormBlockData, ExerciseFormData } from "../schema";
import { ExerciseService } from "../service";
import type { Exercise, ExerciseBlock } from "../types";

// ==========================================
// TYPY
// ==========================================

interface ExerciseFormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly exerciseId?: string;
  readonly onSuccess?: () => void;
}

// ==========================================
// MAPOWANIE: Exercise (model domenowy) → dane formularza
// ==========================================

// * Blok domenowy → blok formularza (zachowuje id, by nie gubić tożsamości bloków przy edycji)
const mapBlockToFormBlock = (block: ExerciseBlock): ExerciseFormBlockData => {
  if (block.type === "text") {
    return { id: block.id, type: "text", content: block.content, style: block.style };
  }
  if (block.type === "image") return { id: block.id, type: "image", assetId: block.assetId, caption: block.caption };
  return { id: block.id, type: "file", assetId: block.assetId, name: block.name };
};

const mapExerciseToFormData = (
  exercise: Exercise,
): Partial<ExerciseFormData> => ({
  title: exercise.title,
  exerciseTypeCode: exercise.exerciseType,
  mathLevel: exercise.mathLevel,
  difficulty: exercise.difficulty,
  points: exercise.points,
  categoryIds: exercise.categories.map((category) => category.id),
  tagIds: exercise.tags.map((tag) => tag.id),
  content: exercise.content.map(mapBlockToFormBlock),
  solution: exercise.solution ? exercise.solution.map(mapBlockToFormBlock) : [],
});

// ==========================================
// KOMPONENT WEWNĘTRZNY: Treść modala (stan żyje tylko przy otwartym modalu)
// ==========================================

interface ExerciseFormModalBodyProps {
  readonly exerciseId?: string;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly isSubmitting: boolean;
  readonly onSubmittingChange: (value: boolean) => void;
}

function ExerciseFormModalBody({
  exerciseId,
  onClose,
  onSuccess,
  isSubmitting,
  onSubmittingChange,
}: ExerciseFormModalBodyProps) {
  // * Ref pozwalający wywołać submit z zewnątrz formularza (przycisk w stopce)
  const formRef = useRef<ExerciseFormHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const advancing = useRef(false);
  const [activeTab, setActiveTab] = useState<FormTabId>("info");
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isEditMode = exerciseId !== undefined;
  const submitLabel = isEditMode ? "Zapisz zmiany" : "Dodaj zadanie";

  const [editData, setEditData] = useState<Partial<ExerciseFormData> | null>(
    null,
  );
  // * Stan początkowy odpowiada pierwszemu renderowi: w edycji od razu „ładowanie”
  const [isLoadingDetails, setIsLoadingDetails] = useState(isEditMode);

  // * Najświeższy onClose bez dokładania go do zależności efektu pobierania.
  // * Ref aktualizowany w efekcie (nie w renderze) — zgodnie z React 19.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // * Pobranie danych do edycji. Flaga isCancelled chroni przed zapisem stanu po zamknięciu modala.
  useEffect(() => {
    if (exerciseId === undefined) return;

    const currentId = exerciseId;
    let isCancelled = false;

    async function loadDetails() {
      try {
        const data = await ExerciseService.getExercise(currentId);
        if (isCancelled) return;

        if (!data) {
          toast.error("Nie znaleziono zadania");
          onCloseRef.current();
          return;
        }
        setEditData(mapExerciseToFormData(data));
        setIsLoadingDetails(false);
      } catch (err) {
        console.error("Load exercise for edit error:", err);
        if (isCancelled) return;
        toast.error("Błąd ładowania zadania do edycji");
        onCloseRef.current();
      }
    }

    void loadDetails();
    return () => {
      isCancelled = true;
    };
  }, [exerciseId]);

  // * Zatwierdzenie formularza przez ref; sukces zamyka modal i odświeża listę rodzica
  const handleSubmit = useCallback(async () => {
    if (!formRef.current) return;

    onSubmittingChange(true);
    try {
      const result = await formRef.current.submit();
      if (result.success) {
        onClose();
        onSuccess?.();
      }
    } finally {
      onSubmittingChange(false);
    }
  }, [onClose, onSuccess, onSubmittingChange]);

  const changeStep = (step: FormTabId) => {
    setActiveTab(step);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handleNext = async () => {
    if (!formRef.current || advancing.current) return;
    advancing.current = true;
    setIsAdvancing(true);
    try {
      if (await formRef.current.validateStep()) {
        changeStep(activeTab === "info" ? "content" : "solution");
      } else {
        toast.error("Popraw błędy przed przejściem dalej.");
      }
    } finally {
      advancing.current = false;
      setIsAdvancing(false);
    }
  };

  // * Formularz renderujemy dopiero, gdy ma komplet danych (w edycji — po pobraniu)
  const canRenderForm = !isEditMode || (editData !== null && !isLoadingDetails);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7">
      {/* * Loader podczas oczekiwania na dane do edycji */}
      {!canRenderForm && (
        <div role="status" className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2
              className="h-8 w-8 animate-spin text-primary"
              aria-hidden="true"
            />
            <p className="text-sm font-medium">Ładowanie zadania...</p>
          </div>
        </div>
      )}

      {/* * Główny komponent formularza */}
      {canRenderForm && (
        <ExerciseForm
          ref={formRef}
          mode={isEditMode ? "edit" : "add"}
          exerciseId={exerciseId}
          defaultValues={editData ?? undefined}
          isSubmitting={isSubmitting}
          activeTab={activeTab}
        />
      )}
      </div>

      {/* * Stopka modala z akcjami */}
      <div className="flex shrink-0 justify-end border-t border-border/60 bg-background px-4 py-3 sm:px-7">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
        {activeTab !== "info" && (
          <Button type="button" variant="outline" disabled={isSubmitting || isAdvancing}
            className="h-10 w-full rounded-xl px-3 font-semibold sm:w-auto"
            onClick={() => changeStep(activeTab === "solution" ? "content" : "info")}>
            <ChevronLeft aria-hidden="true" /> Wstecz
          </Button>
        )}
        {activeTab !== "solution" ? (
          <Button type="button" onClick={() => void handleNext()}
            disabled={isSubmitting || isAdvancing || !canRenderForm}
            className="h-10 w-full rounded-xl px-3 font-semibold shadow-sm sm:w-auto sm:px-5">
            {activeTab === "info" ? "Dalej: Treść zadania" : "Dalej: Rozwiązanie"} <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={isSubmitting || !canRenderForm}
          className="h-10 w-full rounded-xl px-3 font-semibold shadow-sm sm:w-auto sm:px-5"
        >
          {isSubmitting ? (
            <>
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
              Zapisywanie...
            </>
          ) : (
            submitLabel
          )}
        </Button>
        )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExerciseFormModal({
  open,
  onOpenChange,
  exerciseId,
  onSuccess,
}: ExerciseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleClose = useCallback(() => {
    if (!isSubmitting) onOpenChange(false);
  }, [isSubmitting, onOpenChange]);

  return (
    <ModalShell
      open={open}
      onOpenChange={(nextOpen) => { if (!isSubmitting) onOpenChange(nextOpen); }}
      icon={<FileText className="h-6 w-6 text-white" strokeWidth={2} />}
      title={exerciseId ? "Edytuj zadanie" : "Dodaj nowe zadanie"}
      hideFooter
      isSubmitting={isSubmitting}
      onClose={handleClose}
      className="max-w-6xl"
      bodyClassName="flex overflow-hidden px-0 py-0 sm:px-0"
    >
      {/* ! Treść montowana tylko przy otwartym modalu — każde otwarcie = czysty stan. */}
      {/* ? Efekt uboczny: ewentualna animacja zamykania ModalShell nie obejmie treści. */}
      {open && (
        <ExerciseFormModalBody
          key={exerciseId ?? "new"}
          exerciseId={exerciseId}
          onClose={() => onOpenChange(false)}
          onSuccess={onSuccess}
          isSubmitting={isSubmitting}
          onSubmittingChange={setIsSubmitting}
        />
      )}
    </ModalShell>
  );
}
