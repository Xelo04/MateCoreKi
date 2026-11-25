// ==========================================
// KOMPONENT: Renderowanie treści zadania
// ==========================================

"use client";

import katex from "katex";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { decodeMathContent, isPdfFile } from "../utils";
import { LazyPdfPreview } from "./LazyPdfPreview";
import "katex/dist/katex.min.css";

type RenderableBlock =
  | { readonly id?: string; readonly type: "text"; readonly content: string }
  | { readonly id?: string; readonly type: "image"; readonly assetId: number; readonly caption?: string | null }
  | { readonly id?: string; readonly type: "file"; readonly assetId: number; readonly name?: string | null }
  | { readonly id?: string; readonly type: "pending"; readonly file: File };

export function MathDisplay({ latex, display = false }: { readonly latex: string; readonly display?: boolean }) {
  return <span ref={(element) => {
    if (!element) return;
    try {
      katex.render(latex, element, { throwOnError: true, trust: false, displayMode: display });
      element.removeAttribute("role");
    } catch (err) {
      console.error("Nie udało się wyświetlić wzoru matematycznego:", err instanceof Error ? err.name : "Nieznany błąd");
      element.setAttribute("role", "alert");
      element.textContent = "Nie można wyświetlić wzoru.";
    }
  }} />;
}

function TextBlock({ content }: { readonly content: string }) {
  const parts = decodeMathContent(content);
  return (
    <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">
      {parts.map((part, index) =>
        part.type === "text"
          ? <span key={index}>{part.text}</span>
          : <MathDisplay key={index} latex={part.latex} display={part.display} />,
      )}
    </p>
  );
}

function AttachmentImage({ src, caption }: { readonly src: string; readonly caption: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <figure className="space-y-2">
      {failed ? (
        <p role="alert" className="text-sm text-destructive">Nie udało się wczytać obrazu.</p>
      ) : (
        // * Pliki wymagają ciasteczka sesji; optymalizator Next.js go nie przekazuje.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={caption || "Obraz do zadania"} className="h-auto w-full max-w-4xl rounded-xl border border-border/20 shadow-sm" onError={() => setFailed(true)} />
      )}
      {caption && <figcaption className="text-sm text-muted-foreground">{caption}</figcaption>}
    </figure>
  );
}

function PendingImage({ file }: { readonly file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!imageRef.current) return;
    const image = imageRef.current;
    const objectUrl = URL.createObjectURL(file);
    image.src = objectUrl;
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return failed
    ? <p role="alert" className="text-sm text-destructive">Nie udało się wczytać obrazu.</p>
    // eslint-disable-next-line @next/next/no-img-element
    : <img ref={imageRef} alt={file.name} className="h-auto w-full max-w-3xl rounded-md border border-border/20 shadow-sm" onError={() => setFailed(true)} />;
}

export function ExerciseContentRenderer({
  blocks,
  emptyMessage = "Brak treści.",
  size = "comfortable",
}: {
  readonly blocks: readonly RenderableBlock[];
  readonly emptyMessage?: string;
  readonly size?: "comfortable" | "compact";
}) {
  if (blocks.length === 0) {
    return <p className="text-sm italic text-muted-foreground/60">{emptyMessage}</p>;
  }
  return (
    <div className={cn("flex w-full flex-col", size === "compact" ? "space-y-4 text-sm" : "space-y-6 text-base")}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${block.id ?? index}`;
        if (block.type === "text") return <TextBlock key={key} content={block.content} />;
        if (block.type === "pending") return isPdfFile(block.file)
          ? <LazyPdfPreview key={key} file={block.file} />
          : <PendingImage key={key} file={block.file} />;
        const url = `/api/backend/api/v1/assets/${block.assetId}`;
        if (block.type === "image") return (
          <AttachmentImage key={`${key}-${url}`} src={url} caption={block.caption ?? null} />
        );
        return <LazyPdfPreview key={key} file={url} />;
      })}
    </div>
  );
}
