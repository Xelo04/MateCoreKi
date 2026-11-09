// ==========================================
// KOMPONENTY: Stany list (pusty / błąd)
// ==========================================
// * Wspólne stany dla list zadań i zestawów oraz kreatora zestawu.

import { Button } from "@/components/ui/button";

// ----- Stan pusty -----

export function EmptyState({ message }: { readonly message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border/50 bg-secondary/10 px-4 py-16 text-center">
      <p className="font-semibold text-foreground">{message}</p>
    </div>
  );
}

// ----- Stan błędu (z ponowieniem) -----

export function ErrorState({
  message,
  onRetry,
}: {
  readonly message: string;
  readonly onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-10 text-center"
    >
      <p className="font-semibold text-destructive">{message}</p>
      <Button
        type="button"
        variant="outline"
        className="mt-4 h-11 rounded-xl"
        onClick={onRetry}
      >
        Spróbuj ponownie
      </Button>
    </div>
  );
}
