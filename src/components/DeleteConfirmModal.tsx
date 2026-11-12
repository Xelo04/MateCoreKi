// ==========================================
// KOMPONENT: Modal potwierdzenia usunięcia
// ==========================================
// * Jedyna implementacja potwierdzenia usuwania w module (zadanie, zestaw).
// * Treść ostrzeżenia przekazuje wywołujący (`description`).

"use client";

import { useRef, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogDescription } from "@/components/ui/dialog";
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
  const cancelRef = useRef<HTMLButtonElement>(null);
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
      icon={<AlertTriangle className="h-6 w-6" aria-hidden="true" />}
      hideFooter
      hasDescription
      isSubmitting={isDeleting}
      variant="destructive"
      initialFocusRef={cancelRef}
    >
      <div className="space-y-6 text-center">
        <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </DialogDescription>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            className="flex-1 font-semibold"
            disabled={isDeleting}
            onClick={handleClose}
            ref={cancelRef}
          >
            Anuluj, zachowaj
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="flex-1 font-semibold"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting && <Loader2 className="animate-spin" aria-hidden="true" />}
            {isDeleting ? "Trwa usuwanie..." : "Tak, usuń"}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
