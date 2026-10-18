// ==========================================
// KOMPONENT: Modal Dodawania/Edycji Zadania
// ==========================================
// Wrapper na ExerciseForm, obsługuje transakcję walidacja -> submit.

"use client";

import { useState, useRef, useCallback } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { toast } from "sonner";

import { ExerciseForm, type ExerciseFormHandle } from "./ExerciseForm";
import type { ExerciseFormData } from "../schema";

interface ExerciseFormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultValues?: Partial<ExerciseFormData>;
  readonly onSubmit: (data: ExerciseFormData) => Promise<boolean>;
  readonly isEditMode?: boolean;
}

export function ExerciseFormModal({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
  isEditMode = false,
}: ExerciseFormModalProps) {
  const formRef = useRef<ExerciseFormHandle>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // * Mechanizm State Adjustment — czyszczenie formularza przy otwarciu/zamknięciu modalu
  const [prevOpen, setPrevOpen] = useState(open);
  const [formKey, setFormKey] = useState(0);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      // Wymusza re-render w pełni czystego komponentu formularza
      setFormKey((k) => k + 1);
    }
  }

  const handleModalSubmit = useCallback(async () => {
    if (!formRef.current) return;

    setIsSubmitting(true);

    // * Krok 1: Walidacja formularza i zwrócenie danych
    const result = await formRef.current.submit();

    if (!result.success || !result.data) {
      setIsSubmitting(false);
      toast.error("Formularz zawiera błędy walidacji", {
        description: "Popraw czerwone pola i spróbuj ponownie.",
      });
      return;
    }

    // * Krok 2: Zapis przez akcję rodzica (komunikacja z API)
    const success = await onSubmit(result.data);

    setIsSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  }, [onSubmit, onOpenChange]);

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<FileText className="h-6 w-6 text-white" strokeWidth={2} />}
      title={isEditMode ? "Edytuj zadanie" : "Dodaj nowe zadanie"}
      hideFooter={true}
      onClose={() => onOpenChange(false)}
    >
      <div className="space-y-6">
        <ExerciseForm
          key={formKey}
          ref={formRef}
          defaultValues={defaultValues}
        />

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="rounded-xl"
          >
            Anuluj
          </Button>
          <Button
            type="button"
            onClick={handleModalSubmit}
            disabled={isSubmitting}
            className="h-11 min-w-28 rounded-xl shadow-sm"
          >
            {isSubmitting ? "Zapisywanie..." : "Zapisz zadanie"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
