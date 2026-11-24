// ==========================================
// KOMPONENT: Edycja bloków treści i rozwiązania
// ==========================================

"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  EXERCISE_FILE_LIMITS,
  type ExerciseFormBlockData,
  type ExerciseFormData,
} from "../schema";
import { isPdfFile } from "./ExerciseContentRenderer";

const MathTextEditor = dynamic(() => import("./MathTextEditor"), {
  ssr: false,
  loading: () => <p role="status">Ładowanie edytora...</p>,
});

function FileBlockChip({
  block,
}: {
  readonly block: Extract<
    ExerciseFormBlockData,
    { type: "image" | "file" | "pending" }
  >;
}) {
  const isPdf =
    block.type === "file" ||
    (block.type === "pending" && isPdfFile(block.file));
  const Icon = isPdf ? FileText : ImageIcon;
  const fileName =
    block.type === "pending"
      ? block.file.name
      : block.type === "file"
        ? block.name || "Załącznik PDF"
        : block.caption || `Obraz ${block.assetId}`;

  return (
    <div className="flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          isPdf ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600",
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p
          className="truncate text-sm font-semibold text-foreground"
          title={fileName}
        >
          {fileName}
        </p>
        <p className="text-xs text-muted-foreground">
          {isPdf ? "Plik PDF" : "Obraz"}
        </p>
      </div>
    </div>
  );
}

export function ExerciseBlockBuilder({
  name,
  label,
  required = false,
}: {
  readonly name: "content" | "solution";
  readonly label: string;
  readonly required?: boolean;
}) {
  const { control, getFieldState, formState } =
    useFormContext<ExerciseFormData>();
  const { fields, append, remove, move } = useFieldArray({ control, name });
  const fileInput = useRef<HTMLInputElement>(null);
  const sectionError = getFieldState(name, formState).error;
  const rootError = sectionError?.root?.message ?? sectionError?.message;

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
        {label}{" "}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </h3>
      <div className="space-y-3">
        {fields.map((field, index) => {
          const isText = field.type === "text";
          const isPdf =
            field.type === "file" ||
            (field.type === "pending" && isPdfFile(field.file));
          return (
            <div
              key={field.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border/60 border-l-4 bg-card shadow-sm",
                isText
                  ? "border-l-violet-500"
                  : isPdf
                    ? "border-l-blue-500"
                    : "border-l-emerald-500",
              )}
            >
              <div className="flex items-center gap-2 p-3 sm:px-4">
                <div className="min-w-0 flex-1">
                  {isText ? (
                    <p className="text-xs font-bold uppercase tracking-wide text-foreground">
                      Blok {index + 1}: Tekst i wzory
                    </p>
                  ) : (
                    <FileBlockChip block={field} />
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(index, index - 1)}
                    disabled={index === 0}
                    aria-label="Przesuń wyżej"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, index + 1)}
                    disabled={index === fields.length - 1}
                    aria-label="Przesuń niżej"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:text-muted-foreground/30 disabled:hover:bg-transparent"
                  >
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label="Usuń blok"
                    className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              {isText && (
                <div className="min-w-0 px-3 pb-4 sm:px-4">
                  {field.type === "text" && (
                    <Controller
                      control={control}
                      name={`${name}.${index}.content`}
                      render={({ field: input, fieldState }) => (
                        <>
                          <MathTextEditor
                            value={input.value}
                            onChange={input.onChange}
                            label={`Blok tekstowy ${index + 1}`}
                          />
                          {fieldState.error && (
                            <p
                              role="alert"
                              className="text-sm text-destructive"
                            >
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
        {fields.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Brak bloków
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3 border-t border-border/40 pt-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl font-semibold shadow-sm"
          disabled={fields.length >= 100}
          onClick={() => append({ type: "text", content: "", style: "normal" })}
        >
          <Type className="mr-2 h-4 w-4" aria-hidden="true" /> Dodaj tekst
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl font-semibold shadow-sm"
          disabled={fields.length >= 100}
          onClick={() => fileInput.current?.click()}
        >
          <Paperclip className="mr-2 h-4 w-4" aria-hidden="true" /> Dodaj
          załącznik
        </Button>
        <input
          ref={fileInput}
          type="file"
          className="sr-only"
          tabIndex={-1}
          aria-label={`Załącznik: ${label}`}
          accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (!file) return;
            if (
              file.size === 0 ||
              file.size > EXERCISE_FILE_LIMITS.maxFileSizeBytes
            ) {
              toast.error(
                "Plik musi mieć więcej niż 0 bajtów i maksymalnie 10 MB.",
              );
              return;
            }
            if (
              ![
                "image/png",
                "image/jpeg",
                "image/webp",
                "application/pdf",
              ].includes(file.type) &&
              !/\.(png|jpe?g|webp|pdf)$/i.test(file.name)
            ) {
              toast.error("Dozwolone są pliki PNG, JPEG, WebP i PDF.");
              return;
            }
            append({ id: crypto.randomUUID(), type: "pending", file });
          }}
        />
        <span className="w-full text-center text-xs text-muted-foreground">
          PNG, JPEG, WebP lub PDF do 10 MB
        </span>
      </div>
      {rootError && (
        <p role="alert" className="text-sm text-destructive">
          {rootError}
        </p>
      )}
    </div>
  );
}
