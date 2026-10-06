// ==========================================
// KOMPONENT: Modal Dodawania Nowej Lekcji
// ==========================================
// Główny modal planowania lekcji. Obsługuje wybór ucznia, a także
// opcję "Dodaj nowego ucznia" inline wewnątrz tego samego modalu.
// Orkiestruje transakcję kaskadową: najpierw student, potem lekcja.

"use client";

import { useState, useRef, useCallback } from "react";
import { CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useStudentsList } from "@/features/students/hook";

import {
  StudentForm,
  type StudentFormHandle,
} from "@/features/students/components/StudentForm";
import { LessonForm, type LessonFormHandle } from "./LessonForm";
import type { LessonCreateData } from "../schema";

interface LessonFormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultValues?: Partial<LessonCreateData>;
  readonly onSubmit: (data: LessonCreateData) => Promise<boolean>;
  readonly hideStudentSelect?: boolean;
}

export function LessonFormModal({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  hideStudentSelect = false,
}: LessonFormModalProps) {
  const { activeStudents, refetch: refetchStudents } = useStudentsList();

  const studentFormRef = useRef<StudentFormHandle>(null);
  const lessonFormRef = useRef<LessonFormHandle>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // * Lokalny błąd walidacji dla selecta ucznia (nie jest polem RHF)
  const [studentSelectError, setStudentSelectError] = useState<string | null>(
    null,
  );

  // * Dostrajanie stanu przy otwarciu (React 19 State Adjustment)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedStudentId(defaultValues?.studentId || "");
      setIsAddingStudent(false);
      setStudentSelectError(null);
    }
  }

  // * Obsługa zmiany studenta w selectie
  const handleStudentChange = useCallback((val: string) => {
    if (val === "__add_new__") {
      setIsAddingStudent(true);
      setSelectedStudentId("");
    } else {
      setIsAddingStudent(false);
      setSelectedStudentId(val);
    }
    // * Czyścimy błąd po dokonaniu wyboru
    setStudentSelectError(null);
  }, []);

  // ==========================================
  // ORKIESTRACJA TRANSAKCJI (Walidacja + Commit)
  // ==========================================
  const handleModalSubmit = useCallback(async () => {
    if (!lessonFormRef.current) return;

    setIsSubmitting(true);

    // ------------------------------------------
    // FAZA 1: Walidacja wszystkich formularzy (Client-Side)
    // ------------------------------------------

    // * Walidacja wyboru ucznia (lub formularza nowego ucznia)
    let isStudentValid = true;
    if (hideStudentSelect) {
      // * W widoku profilu studenta studentId przychodzi z defaultValues
      isStudentValid = !!defaultValues?.studentId;
    } else if (isAddingStudent) {
      // * Walidujemy formularz nowego ucznia
      isStudentValid = studentFormRef.current
        ? await studentFormRef.current.validate()
        : false;
    } else {
      // * Walidujemy wybór z selecta
      if (!selectedStudentId) {
        setStudentSelectError("Wybierz ucznia lub dodaj nowego");
        isStudentValid = false;
      } else {
        setStudentSelectError(null);
      }
    }

    // * Walidacja formularza lekcji
    const isLessonValid = await lessonFormRef.current.validate();

    // ! Jeśli którykolwiek formularz ma błędy - przerywamy transakcję.
    // ! Formularze same podświetlą pola na czerwono i wyświetlą komunikaty.
    if (!isStudentValid || !isLessonValid) {
      setIsSubmitting(false);
      toast.error("Formularz zawiera błędy walidacji", {
        description: "Popraw czerwone pola przed zapisem.",
      });
      return;
    }

    // ------------------------------------------
    // FAZA 2: Zapis do bazy danych (Commit)
    // ------------------------------------------

    let finalStudentId = selectedStudentId || defaultValues?.studentId || "";

    // * Krok 2a: Zapisz profil studenta jeśli tworzony inline
    if (isAddingStudent && studentFormRef.current) {
      const studentResult = await studentFormRef.current.submit();
      if (!studentResult.success || !studentResult.studentId) {
        setIsSubmitting(false);
        return;
      }
      finalStudentId = studentResult.studentId;
      void refetchStudents();
    }

    if (!finalStudentId) {
      setIsSubmitting(false);
      return;
    }

    // * Krok 2b: Wyślij formularz lekcji
    const lessonResult = await lessonFormRef.current.submit({
      studentId: finalStudentId,
    });

    setIsSubmitting(false);

    if (lessonResult.success) {
      void onSubmit({
        ...defaultValues,
        studentId: finalStudentId,
      } as LessonCreateData);
      onOpenChange(false);
    }
  }, [
    isAddingStudent,
    selectedStudentId,
    hideStudentSelect,
    onSubmit,
    onOpenChange,
    refetchStudents,
    defaultValues,
  ]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<CalendarPlus className="h-6 w-6 text-white" strokeWidth={2} />}
      title="Zaplanuj zajęcia"
      hideFooter={true}
      onClose={() => onOpenChange(false)}
    >
      <div className="space-y-6">
        {/* * Wybór ucznia (ukryty w widoku profilu studenta) */}
        {!hideStudentSelect && (
          <div className="space-y-1.5">
            <Label htmlFor="modal-student-select">Uczeń</Label>
            <Select
              value={isAddingStudent ? "__add_new__" : selectedStudentId}
              onValueChange={handleStudentChange}
            >
              <SelectTrigger id="modal-student-select" className="bg-card">
                <SelectValue placeholder="Wybierz ucznia" />
              </SelectTrigger>
              <SelectContent>
                {activeStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
                <SelectItem
                  value="__add_new__"
                  className="text-primary cursor-pointer"
                >
                  Dodaj nowego ucznia
                </SelectItem>
              </SelectContent>
            </Select>
            {/* * Błąd walidacji wyboru ucznia */}
            {studentSelectError && (
              <p className="text-xs text-destructive">{studentSelectError}</p>
            )}
          </div>
        )}

        {/* * Formularz ucznia - pojawiający się inline po wybraniu opcji */}
        {isAddingStudent && (
          <div className="animate-in slide-in-from-top-2 fade-in duration-300">
            <StudentForm ref={studentFormRef} mode="add" />
          </div>
        )}

        {/* * Formularz lekcji - zawsze widoczny i dostępny */}
        <LessonForm ref={lessonFormRef} defaultValues={defaultValues} />

        {/* * Stopka */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleModalSubmit}
            disabled={isSubmitting}
            className="h-11 min-w-28"
          >
            {isSubmitting ? "Zapisywanie..." : "Zaplanuj zajęcia"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
