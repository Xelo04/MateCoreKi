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

  // * Dostrajanie stanu przy otwarciu (React 19 State Adjustment)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setSelectedStudentId(defaultValues?.studentId || "");
      setIsAddingStudent(false);
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
  }, []);

  // ==========================================
  // ORKIESTRACJA TRANSAKCJI
  // ==========================================
  const handleModalSubmit = useCallback(async () => {
    if (!lessonFormRef.current) return;

    setIsSubmitting(true);
    let finalStudentId = selectedStudentId;

    // * Krok 1: Zapisz profil studenta jeśli tworzony inline
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

    // * Krok 2: Wyślij formularz lekcji
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
