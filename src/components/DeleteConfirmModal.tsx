// ==========================================
// KOMPONENT: Modal potwierdzenia usunięcia
// ==========================================
// * Jedyna implementacja potwierdzenia usuwania w module (zadanie, zestaw).
// * Treść ostrzeżenia przekazuje wywołujący (`description`).

"use client";

import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";

interface DeleteConfirmModalProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: ReactNode;
  readonly isDeleting: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
}

export function DeleteConfirmModal({
  open,
  title,
  description,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  // * Podczas usuwania modal nie może zostać zamknięty (brak „osieroconej” operacji)
  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={(value) => {
        if (!value) handleClose();
      }}
      onClose={handleClose}
      title={title}
      icon={<Trash2 className="h-6 w-6 text-white" aria-hidden="true" />}
      hideFooter
    >
      <div className="space-y-6 pt-2">
        <p className="text-sm leading-relaxed text-foreground/80">
          {description}
        </p>
        {/* * Akcja destrukcyjna — wariant destructive z design systemu */}
        <Button
          type="button"
          variant="destructive"
          className="mt-4 h-11 w-full rounded-xl text-base font-semibold"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? "Trwa usuwanie..." : "Usuń trwale"}
        </Button>
      </div>
    </ModalShell>
  );
}
