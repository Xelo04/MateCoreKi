// ==========================================
// KOMPONENT: Szkielet ładowania PDF
// ==========================================
// * Jedyna implementacja placeholdera strony PDF (A4, proporcja 1:1.414).
// * Używany przez LazyPdfPreview (ładowanie chunka) i PdfPreview (ładowanie pliku).

import { Loader2 } from "lucide-react";
export function PdfSkeleton() {
  return (
    // * role="status" informuje czytniki ekranu o trwającym ładowaniu
    <div
      role="status"
      aria-label="Ładowanie pliku PDF"
      className="flex aspect-[1/1.414] w-full items-center justify-center rounded-lg bg-muted/20 ring-1 ring-border/30"
    >
      <Loader2
        className="h-6 w-6 animate-spin text-primary/70"
        aria-hidden="true"
      />
    </div>
  );
}
