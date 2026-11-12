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
  submitLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  onClose: () => void;
  className?: string;
  hideFooter?: boolean;
  hasDescription?: boolean;
  variant?: "default" | "destructive";
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

export function ModalShell({
  open,
  onOpenChange,
  icon,
  title,
  children,
  formId,
  submitLabel = "Zapisz",
  cancelLabel = "Anuluj",
  isSubmitting = false,
  onClose,
  className,
  hideFooter = false,
  hasDescription = false,
  variant = "default",
  initialFocusRef,
}: ModalShellProps) {
  const previousFocus = React.useRef<HTMLElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent
        showCloseButton={false}
        {...(!hasDescription ? { "aria-describedby": undefined } : {})}
        className={cn(
          "flex max-h-[min(90dvh,56rem)] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl border border-border/70 p-0 shadow-2xl sm:rounded-3xl",
          variant === "destructive" && "max-w-md",
          className,
        )}
        onOpenAutoFocus={(event) => {
          const activeElement = document.activeElement;
          const menu = activeElement?.closest("[role='menu']");
          const menuTriggerId = menu?.getAttribute("aria-labelledby");
          const menuTrigger =
            menuTriggerId && document.getElementById(menuTriggerId);
          previousFocus.current =
            menuTrigger instanceof HTMLElement
              ? menuTrigger
              : activeElement instanceof HTMLElement
                ? activeElement
                : null;
          if (initialFocusRef?.current) {
            event.preventDefault();
            initialFocusRef.current.focus();
          }
        }}
        onCloseAutoFocus={(event) => {
          if (previousFocus.current?.isConnected) {
            event.preventDefault();
            previousFocus.current.focus();
          }
        }}
      >
        <DialogHeader
          className={cn(
            "relative shrink-0 border-b border-border/60 bg-gradient-to-br from-primary/10 via-background to-background px-6 py-5 sm:px-7",
            variant === "destructive" && "border-0 bg-none pb-0 pt-8",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-4 pr-12",
              variant === "destructive" && "flex-col gap-4 px-8 text-center",
            )}
          >
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20",
                variant === "destructive" &&
                  "h-14 w-14 rounded-full bg-destructive/10 text-destructive shadow-none",
              )}
            >
              {icon}
            </div>
            <DialogTitle className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
              {title}
            </DialogTitle>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Zamknij"
          >
            <X className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
          {children}
        </div>

        {!hideFooter && (
          <DialogFooter className="shrink-0 border-t border-border/60 bg-muted/20 px-6 py-4 sm:px-7">
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
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {submitLabel}
            </Button>
          </DialogFooter>
        )}
        </DialogContent>
      )}
    </Dialog>
  );
}
