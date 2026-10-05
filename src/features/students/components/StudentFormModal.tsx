// ==========================================
// KOMPONENT: Modal dodawania / edycji ucznia
// ==========================================
// Orkiestrator transakcji: StudentForm + N × LessonForm.
// Submit sekwencyjny: najpierw uczeń, potem zajęcia z jego ID.

"use client";

import { useRef, useState, useCallback } from "react";
import { UserRoundPlus, UserRoundPen, CalendarPlus } from "lucide-react";
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

  // * Lista formularzy lekcji — każdy z unikalnym kluczem i refem
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

  // * Dodanie nowego formularza lekcji (używa lokalnego licznika ref bezpiecznego dla SSR)
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
  // ORKIESTRACJA TRANSAKCJI
  // ==========================================
  const handleSubmit = useCallback(async () => {
    if (!studentFormRef.current) return;

    setIsSubmitting(true);

    // * Krok 1: Zapisz ucznia
    const studentResult = await studentFormRef.current.submit();

    if (!studentResult.success || !studentResult.studentId) {
      setIsSubmitting(false);
      return;
    }

    const newStudentId = studentResult.studentId;

    // * Krok 2: Zapisz zajęcia sekwencyjnie (każde potrzebuje studentId)
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

    // * Krok 3: Sukces — powiadom rodzica i zamknij
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Terminy zajęć (opcjonalnie)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Możesz dodać teraz lub później z kalendarza.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLesson}
            disabled={isSubmitting}
            className="border-primary/30 text-primary hover:bg-primary/5 shrink-0"
          >
            <CalendarPlus className="mr-2 h-4 w-4" /> Dodaj termin
          </Button>
        </div>

        {/* * Lista formularzy lekcji */}
        {lessonKeys.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border/50 py-8 text-center">
            <CalendarPlus className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Brak dodanych terminów.
            </p>
          </div>
        ) : (
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
