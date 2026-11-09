// ==========================================
// KOMPONENT: Renderowanie bloków treści
// ==========================================
// * Jedyny renderer bloków (tekst / obraz / PDF). Używany w widoku szczegółów,
// * w kreatorze zestawu oraz w kolumnie podglądu formularza (size="compact").
// * Przyjmuje minimalny, strukturalny typ bloku — pasuje i do ExerciseBlock,
// * i do ExerciseFormBlockData (bez importowania typów Api*).

"use client";

import { cn } from "@/lib/utils";
import { LazyPdfPreview } from "./LazyPdfPreview";

// ==========================================
// TYPY
// ==========================================

export type RenderableBlock =
  | {
      readonly id?: string;
      readonly type: "text";
      readonly content: string;
    }
  | {
      readonly id?: string;
      readonly type: "image" | "pdf";
      readonly url: string;
    };

// * comfortable — widok szczegółów (text-base); compact — panel podglądu formularza (text-sm)
type ContentSize = "comfortable" | "compact";

interface ExerciseContentRendererProps {
  readonly blocks: readonly RenderableBlock[];
  readonly emptyMessage?: string;
  readonly size?: ContentSize;
}

// ==========================================
// KOMPONENT
// ==========================================

export function ExerciseContentRenderer({
  blocks,
  emptyMessage = "Brak treści.",
  size = "comfortable",
}: ExerciseContentRendererProps) {
  const isCompact = size === "compact";

  // * Stan pusty — komunikat zamiast pustego kontenera
  if (blocks.length === 0) {
    return (
      <p className="text-sm italic text-muted-foreground/60">{emptyMessage}</p>
    );
  }

  return (
    <div
      className={cn(
        "flex w-full flex-col",
        isCompact ? "space-y-4" : "space-y-6",
      )}
    >
      {blocks.map((block, index) => {
        // * Klucz: bloki z formularza mogą nie mieć jeszcze id — wtedy używamy indeksu
        const key = `${block.type}-${block.id ?? index}`;

        // * Blok tekstowy (pusty tekst pomijamy — nic do pokazania)
        if (block.type === "text") {
          if (!block.content) return null;
          return (
            <p
              key={key}
              className={cn(
                "whitespace-pre-wrap leading-relaxed text-foreground/90",
                isCompact ? "text-sm" : "text-base",
              )}
            >
              {block.content}
            </p>
          );
        }

        // * Blok obrazkowy
        if (block.type === "image") {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={key}
              src={block.url}
              alt="Załącznik obrazkowy"
              className={cn(
                "h-auto w-full border border-border/20 shadow-sm",
                isCompact ? "max-w-3xl rounded-md" : "max-w-4xl rounded-xl",
              )}
            />
          );
        }

        // * Blok PDF (ładowany leniwie, bez SSR)
        return <LazyPdfPreview key={key} url={block.url} />;
      })}
    </div>
  );
}
