// ==========================================
// KOMPONENT: Kreator bloków zadania (Treść / Rozwiązanie)
// ==========================================
// * Dynamiczna lista bloków (tekst / obraz / PDF) oparta o useFieldArray.
// * Ścieżki pól są typowane (`as const`), błędy czytane przez getFieldState —
// * bez rzutowań `as unknown as`. Limity plików pochodzą z EXERCISE_FILE_LIMITS.

"use client";

import { useCallback, useRef, useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { uploadExerciseFile } from "../actions";
import { EXERCISE_FILE_LIMITS, type ExerciseFormData } from "../schema";

// ==========================================
// TYPY I FUNKCJE POMOCNICZE
// ==========================================

interface ExerciseBlockBuilderProps {
  readonly name: "content" | "solution";
  readonly label: string;
  readonly required?: boolean;
}

const MAX_FILE_SIZE_MB = EXERCISE_FILE_LIMITS.maxFileSizeBytes / (1024 * 1024);

// * Czytelna nazwa pliku z URL-a. Zły percent-encoding (URIError) nie może wywrócić renderu.
const getFileNameFromUrl = (url: string): string => {
  const segment = url.split("/").pop() || "Załącznik";
  try {
    return decodeURIComponent(segment);
  } catch (err) {
    console.error(
      "ExerciseBlockBuilder: nieprawidłowa nazwa pliku w URL:",
      err,
    );
    return segment;
  }
};

// ==========================================
// KOMPONENT WEWNĘTRZNY: Kafelek załącznika
// ==========================================
// * Wspólny wygląd dla bloków obrazu i PDF (różni się tylko ikona).

function FileBlockChip({
  icon: Icon,
  fileName,
}: {
  readonly icon: LucideIcon;
  readonly fileName: string;
}) {
  return (
    <div className="flex w-full max-w-sm items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3">
      <Icon className="h-6 w-6 shrink-0 text-primary/70" aria-hidden="true" />
      <span
        className="truncate text-sm font-medium text-foreground"
        title={fileName}
      >
        {fileName}
      </span>
    </div>
  );
}

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExerciseBlockBuilder({
  name,
  label,
  required = false,
}: ExerciseBlockBuilderProps) {
  // * Kontekst głównego formularza (ExerciseForm)
  const { control, register, getFieldState, formState } =
    useFormContext<ExerciseFormData>();

  // * Tablica bloków zarządzana przez react-hook-form
  const { fields, append, remove, move } = useFieldArray({ control, name });

  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // ! Ref mutujemy wyłącznie w handlerach (czyszczenie inputa), nigdy w ciele renderu
  const fileInputRef = useRef<HTMLInputElement>(null);

  // * Liczba plików (obrazy + PDF) — blokuje upload po przekroczeniu limitu sekcji
  const filesCount = fields.filter((field) => field.type !== "text").length;
  const maxFiles = EXERCISE_FILE_LIMITS.maxFilesPerSection;

  // * Błąd poziomu tablicy (np. brak bloków lub przekroczony limit plików).
  // * RHF zapisuje go pod `.root`, a czasem bezpośrednio w `.message`.
  const sectionError = getFieldState(name, formState).error;
  const rootErrorMessage = sectionError?.root?.message ?? sectionError?.message;

  // * Dodanie pustego bloku tekstowego
  const handleAddText = useCallback(() => {
    append({ type: "text", content: "" });
  }, [append]);

  // * Wgrywanie plików przez Server Action; każdy plik sprawdzany osobno
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (filesCount + files.length > maxFiles) {
        toast.error("Limit plików", {
          description: `Maksymalnie ${maxFiles} plików w sekcji.`,
        });
        return;
      }

      setIsUploading(true);
      try {
        for (const file of files) {
          if (file.size > EXERCISE_FILE_LIMITS.maxFileSizeBytes) {
            toast.error("Plik zbyt duży", {
              description: `Plik ${file.name} przekracza ${MAX_FILE_SIZE_MB}MB.`,
            });
            continue;
          }

          const formData = new FormData();
          formData.append("file", file);
          const result = await uploadExerciseFile(formData);

          if (result.error) {
            toast.error("Błąd uploadu", { description: result.error });
          } else if (result.url && result.assetId != null) {
            const isPdf =
              file.type === "application/pdf" || result.url.endsWith(".pdf");
            append({
              type: isPdf ? "pdf" : "image",
              url: result.url,
              assetId: result.assetId,
            });
          } else {
            // * Żadnych cichych ścieżek: odpowiedź bez url/assetId to błąd
            toast.error("Błąd uploadu", {
              description: `Serwer nie zwrócił adresu pliku ${file.name}.`,
            });
          }
        }
      } catch (err) {
        console.error("Upload handler error:", err);
        toast.error("Wystąpił nieoczekiwany błąd uploadu");
      } finally {
        setIsUploading(false);
        // * Czyszczenie inputa pozwala wybrać ten sam plik ponownie
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [append, filesCount, maxFiles],
  );

  // ----- Handlery Drag & Drop -----

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // * Przejście kursora na element potomny nie kończy przeciągania (brak migotania nakładki)
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      const validFiles = Array.from(event.dataTransfer.files).filter(
        (file) =>
          file.type.startsWith("image/") || file.type === "application/pdf",
      );

      if (validFiles.length > 0) {
        void handleFiles(validFiles);
      }
    },
    [handleFiles],
  );

  return (
    <div
      className={cn(
        "space-y-4 rounded-2xl border p-4 transition-colors sm:p-5",
        isDragOver
          ? "border-primary/60 bg-primary/5"
          : rootErrorMessage
            ? "border-destructive/60 bg-destructive/5"
            : "border-border/60 bg-card",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* * Nagłówek sekcji z licznikiem plików */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-bold text-foreground">
          {label}{" "}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          Pliki: {filesCount}/{maxFiles}
        </span>
      </div>

      {/* * Nakładka widoczna podczas przeciągania pliku */}
      {isDragOver && (
        <div className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 py-6 text-primary">
          <Upload className="h-5 w-5" aria-hidden="true" />
          <span className="text-sm font-semibold">Upuść pliki tutaj</span>
        </div>
      )}

      {/* * Lista dynamicznych bloków */}
      <div className="space-y-3">
        {fields.map((field, index) => {
          // * Błąd treści konkretnego bloku tekstowego (ścieżka typowana przez `as const`)
          const contentPath = `${name}.${index}.content` as const;
          const blockErrorMessage = getFieldState(contentPath, formState).error
            ?.message;

          return (
            <div
              key={field.id}
              className={cn(
                "group flex items-start gap-3 rounded-xl border border-border/50 bg-background p-3 shadow-sm transition-colors",
                blockErrorMessage && "border-destructive/60",
              )}
            >
              {/* * Kontrolki sortowania (strzałki góra/dół) */}
              <div className="flex shrink-0 flex-col gap-1 pt-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Przesuń wyżej"
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowUp className="h-5 w-5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === fields.length - 1}
                  aria-label="Przesuń niżej"
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ArrowDown className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* * Zawartość bloku zależna od typu (discriminated union zawęża pola) */}
              <div className="min-w-0 flex-1">
                {field.type === "text" && (
                  <div className="space-y-1.5">
                    <Textarea
                      aria-label={`Blok tekstowy ${index + 1}`}
                      placeholder="Wpisz treść bloku..."
                      className="min-h-24 resize-y rounded-xl border-transparent bg-muted/20 shadow-none transition-colors hover:border-border/50 focus:border-primary"
                      {...register(contentPath)}
                    />
                    {blockErrorMessage && (
                      <p className="pl-1 text-[11px] text-destructive">
                        {blockErrorMessage}
                      </p>
                    )}
                  </div>
                )}

                {field.type === "image" && (
                  <FileBlockChip
                    icon={ImageIcon}
                    fileName={getFileNameFromUrl(field.url)}
                  />
                )}

                {field.type === "pdf" && (
                  <FileBlockChip
                    icon={FileText}
                    fileName={getFileNameFromUrl(field.url)}
                  />
                )}
              </div>

              {/* * Przycisk usuwania bloku */}
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Usuń blok"
                aria-label="Usuń blok"
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          );
        })}

        {/* * Stan pusty — brak bloków */}
        {fields.length === 0 && !isDragOver && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/50 bg-muted/10 py-8 text-muted-foreground">
            <p className="text-sm font-medium">Brak bloków</p>
          </div>
        )}
      </div>

      {/* * Pasek akcji: dodanie tekstu i załączenie plików */}
      <div className="mt-4 flex flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddText}
          className="h-11 flex-1 rounded-xl font-medium shadow-sm"
        >
          <Type className="mr-2 h-4 w-4" aria-hidden="true" /> Dodaj tekst
        </Button>

        <div className="relative flex h-11 flex-1">
          {/* * Ukryty natywny input file (otwierany przyciskiem obok) */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            multiple
            aria-label="Wybierz pliki do załączenia"
            onChange={(event) => {
              if (event.target.files?.length) {
                void handleFiles(Array.from(event.target.files));
              }
            }}
          />
          <Button
            type="button"
            disabled={isUploading || filesCount >= maxFiles}
            onClick={() => fileInputRef.current?.click()}
            className="h-11 flex-1 rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm transition-all hover:bg-primary hover:text-primary-foreground"
          >
            {isUploading ? (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {isUploading ? "Wgrywanie..." : `Załącz pliki (Max ${maxFiles})`}
          </Button>
        </div>
      </div>

      {/* * Błąd poziomu sekcji (np. wymagany min. 1 blok, przekroczony limit) */}
      {rootErrorMessage && (
        <p role="alert" className="mt-3 text-xs font-semibold text-destructive">
          {rootErrorMessage}
        </p>
      )}
    </div>
  );
}
