"use client";

import * as React from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ModalShellProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  formId?: string;
  submitLabel: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  className?: string;
}

export function ModalShell({
  open,
  onOpenChange,
  icon,
  title,
  children,
  formId,
  submitLabel,
  cancelLabel = "Anuluj",
  isSubmitting = false,
  onClose,
  className,
}: ModalShellProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          // * border-0, p-0, flex column
          "flex max-w-2xl max-h-[90vh] flex-col overflow-hidden p-0 gap-0 border-0 shadow-2xl",
          // * Ukrywamy DOMYŚLNY X z shadcn DialogContent (renderujemy własny)
          "[&>button]:hidden",
          className,
        )}
        // * Pozwól klikać w portale (Popover/Select/Calendar) bez zamykania modala
        onInteractOutside={(e) => {
          const target = e.target as HTMLElement;
          // * Klik w popover/select/portal → nie zamykaj dialogu
          if (
            target.closest("[data-radix-popper-content-wrapper]") ||
            target.closest("[data-slot='popover-content']") ||
            target.closest("[data-slot='select-content']") ||
            target.closest("[role='listbox']") ||
            target.closest("[role='dialog']")
          ) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader className="relative shrink-0 bg-primary px-6 py-5">
          <div className="flex items-center gap-4 pr-14">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-inset ring-white/30">
              {icon}
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white leading-tight">
              {title}
            </DialogTitle>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-xl text-white/90 transition-colors hover:bg-white/20 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            aria-label="Zamknij"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

        <DialogFooter className="shrink-0 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={isSubmitting}
            className="shadow-md shadow-primary/20"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
