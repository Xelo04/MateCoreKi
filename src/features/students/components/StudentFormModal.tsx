// ==========================================
// KOMPONENT: Modal dodawania / edycji ucznia
// ==========================================
// Orkiestrator transakcji: StudentForm + N × LessonForm.

"use client";

import { useRef, useState, useCallback } from "react";
import { UserRoundPlus, UserRoundPen, CalendarPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ModalShell } from "@/components/ui/modal-shell";
import { toast } from "sonner";

import { StudentForm, type StudentFormHandle } from "./StudentForm";
import {
  LessonForm,
  type LessonFormHandle,
} from "@/features/calendar/components/LessonForm";
import type { StudentFormData } from "../schema";

interface StudentFormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly mode?: "add" | "edit";
  readonly defaultValues?: Partial<StudentFormData>;
  readonly studentId?: string;
  readonly onStudentCreated?: (studentId: string) => void;
}

export function StudentFormModal({
  open,
  onOpenChange,
  mode = "add",
  defaultValues,
  studentId,
  onStudentCreated,
}: StudentFormModalProps) {
  const studentFormRef = useRef<StudentFormHandle>(null);
  const lessonKeyCounterRef = useRef<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // * Lista formularzy lekcji - każdy z unikalnym kluczem i refem
  const [lessonKeys, setLessonKeys] = useState<string[]>([]);
  const lessonRefs = useRef<Map<string, LessonFormHandle>>(new Map());

  const isEdit = mode === "edit";

  // * Rejestracja refu LessonForm w mapie
  const registerLessonRef = useCallback(
    (key: string) => (handle: LessonFormHandle | null) => {
      if (handle) {
        lessonRefs.current.set(key, handle);
      } else {
        lessonRefs.current.delete(key);
      }
    },
    [],
  );

  // * Dodanie nowego formularza lekcji
  const handleAddLesson = useCallback(() => {
    lessonKeyCounterRef.current += 1;
    const key = `lesson-${lessonKeyCounterRef.current}-${Date.now()}`;
    setLessonKeys((prev) => [...prev, key]);
  }, []);

  // * Usunięcie formularza lekcji
  const handleRemoveLesson = useCallback((key: string) => {
    setLessonKeys((prev) => prev.filter((k) => k !== key));
    lessonRefs.current.delete(key);
  }, []);

  // * Reset stanu przy zamknięciu modala
  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setLessonKeys([]);
    lessonRefs.current.clear();
    onOpenChange(false);
  }, [isSubmitting, onOpenChange]);

  // ==========================================
  // ORKIESTRACJA TRANSAKCJI (Commit i Walidacja)
  // ==========================================
  const handleSubmit = useCallback(async () => {
    if (!studentFormRef.current) return;

    setIsSubmitting(true);

    // ------------------------------------------
    // FAZA 1: Walidacja wszystkich formularzy (Client-Side)
    // ------------------------------------------
    // * Walidujemy studenta
    const isStudentValid = await studentFormRef.current.validate();

    // * Walidujemy każdą dodaną lekcję
    let areLessonsValid = true;
    for (const key of lessonKeys) {
      const lessonRef = lessonRefs.current.get(key);
      if (lessonRef) {
        const isValid = await lessonRef.validate();
        if (!isValid) {
          areLessonsValid = false;
        }
      }
    }

    // ! Jeśli którykolwiek formularz ma błędy walidacji, przerywamy transakcję.
    // ! Formularze same podświetlą pola na czerwono i wyświetlą komunikaty.
    if (!isStudentValid || !areLessonsValid) {
      setIsSubmitting(false);
      toast.error("Formularz zawiera błędy walidacji", {
        description: "Popraw czerwone pola przed zapisem.",
      });
      return;
    }

    // ------------------------------------------
    // FAZA 2: Zapis do bazy danych (Commit)
    // ------------------------------------------
    // * Krok 2a: Zapisujemy ucznia w bazie
    const studentResult = await studentFormRef.current.submit();

    if (!studentResult.success || !studentResult.studentId) {
      setIsSubmitting(false);
      return; // * Błąd API zapisany w toast przez StudentForm
    }

    const newStudentId = studentResult.studentId;

    // * Krok 2b: Zapisujemy zajęcia sekwencyjnie
    if (lessonKeys.length > 0) {
      let failedCount = 0;

      for (const key of lessonKeys) {
        const lessonRef = lessonRefs.current.get(key);
        if (!lessonRef) continue;

        const lessonResult = await lessonRef.submit({
          studentId: newStudentId,
        });

        if (!lessonResult.success) {
          failedCount++;
        }
      }

      // * Podsumowanie jeśli były błędy przy lekcjach
      if (failedCount > 0) {
        toast.warning(
          `Zapisano ucznia, ale ${failedCount} z ${lessonKeys.length} terminów nie zostało dodanych`,
        );
      }
    }

    // * Krok 3: Pełny sukces transakcji
    onStudentCreated?.(newStudentId);
    setLessonKeys([]);
    lessonRefs.current.clear();
    setIsSubmitting(false);
    onOpenChange(false);
  }, [lessonKeys, onOpenChange, onStudentCreated]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={
        isEdit ? (
          <UserRoundPen className="h-6 w-6 text-white" strokeWidth={2} />
        ) : (
          <UserRoundPlus className="h-6 w-6 text-white" strokeWidth={2} />
        )
      }
      title={isEdit ? "Edytuj dane ucznia" : "Dodaj nowego ucznia"}
      hideFooter={true}
      onClose={handleClose}
    >
      {/* * Formularz ucznia */}
      <StudentForm
        ref={studentFormRef}
        mode={mode}
        defaultValues={defaultValues}
        studentId={studentId}
      />

      {/* * Sekcja opcjonalnych zajęć */}
      <Separator className="bg-primary/10 my-6" />

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Terminy zajęć (opcjonalnie)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Możesz dodać teraz lub później z kalendarza.
          </p>
        </div>

        {/* * Lista formularzy lekcji */}
        {lessonKeys.length === 0 ? (
          /* * PUSTY STAN: Wyśrodkowany przycisk dodawania pierwszego terminu zajęć */
          <div className="rounded-2xl border-2 border-dashed border-border/50 py-10 text-center flex flex-col items-center justify-center gap-3">
            <CalendarPlus className="h-8 w-8 text-muted-foreground/40" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Brak dodanych terminów
              </p>
              <p className="text-xs text-muted-foreground">
                Dodaj stały lub jednorazowy harmonogram dla tego ucznia.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLesson}
              disabled={isSubmitting}
              className="mt-2 border-primary/30 text-primary hover:bg-primary/5 shrink-0 rounded-xl"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Dodaj pierwszy termin
            </Button>
          </div>
        ) : (
          /* * Lista formularzy z przyciskiem dodawania kolejnego na dole */
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="space-y-4">
              {lessonKeys.map((key, idx) => (
                <LessonForm
                  key={key}
                  ref={registerLessonRef(key)}
                  index={idx}
                  onRemove={() => handleRemoveLesson(key)}
                  showHeader={true}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddLesson}
              disabled={isSubmitting}
              className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/5 h-11 rounded-xl"
            >
              <Plus className="mr-1.5 h-4 w-4" /> Dodaj kolejny termin zajęć
            </Button>
          </div>
        )}
      </section>

      {/* * Stopka */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Anuluj
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-11"
        >
          {isSubmitting
            ? "Zapisywanie..."
            : isEdit
              ? "Zapisz zmiany"
              : "Dodaj ucznia"}
        </Button>
      </div>
    </ModalShell>
  );
}
