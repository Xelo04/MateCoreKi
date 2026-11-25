// ==========================================
// KOMPONENT: Formularz zadania (orkiestrator)
// ==========================================
// * Zakładki (Dane / Treść / Rozwiązanie), walidacja, submit wystawiony przez ref
// * (używa go ExerciseFormModal) oraz kontekstowy podgląd. Pola metadanych
// * żyją w ExerciseInfoFields, kreatory bloków w ExerciseBlockBuilder.

"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { Check } from "lucide-react";
import type { input } from "zod";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/api-errors";

import {
  exerciseFormSchema,
  type ExerciseFormBlockData,
  type ExerciseFormData,
} from "../schema";
import { ExerciseService } from "../service";
import { ExerciseBlockBuilder } from "./ExerciseBlockBuilder";
import { ExerciseInfoFields } from "./ExerciseInfoFields";
import { ExercisePreviewColumn } from "./ExercisePreviewColumn";

// ==========================================
// TYPY PUBLICZNE (WYKORZYSTYWANE PRZEZ MODAL)
// ==========================================

export interface ExerciseFormHandle {
  validateStep: () => Promise<boolean>;
  submit: () => Promise<boolean>;
}

interface ExerciseFormProps {
  readonly mode: "add" | "edit";
  readonly exerciseId?: string;
  readonly defaultValues?: Partial<ExerciseFormData>;
  readonly isSubmitting: boolean;
  readonly activeTab: FormTabId;
}

// ==========================================
// KONFIGURACJA POCZĄTKOWA I ZAKŁADKI
// ==========================================

// * Wartości startowe pustego formularza (nadpisywane przez defaultValues przy edycji)
const EMPTY_FORM: Partial<ExerciseFormData> = {
  title: "",
  exerciseTypeCode: undefined,
  mathLevel: null,
  difficulty: null,
  points: null,
  categoryIds: [],
  tagIds: [],
  content: [],
  solution: [],
};

export type FormTabId = "info" | "content" | "solution";

const FORM_TABS: readonly {
  readonly id: FormTabId;
  readonly label: string;
  readonly step: number;
}[] = [
  { id: "info", label: "Dane zadania", step: 1 },
  { id: "content", label: "Treść zadania", step: 2 },
  { id: "solution", label: "Rozwiązanie", step: 3 },
];

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export const ExerciseForm = forwardRef<ExerciseFormHandle, ExerciseFormProps>(
  function ExerciseForm(
    { mode, exerciseId, defaultValues, isSubmitting, activeTab },
    ref,
  ) {
    const uploads = useRef(
      new Map<
        File,
        { id: number; mimeType: string; originalName: string | null }
      >(),
    );
    const saveOutcomeUnknown = useRef(false);

    useEffect(() => {
      const tracked = uploads.current;
      return () => {
        if (saveOutcomeUnknown.current && tracked.size > 0) {
          console.warn(
            "Nie usunięto przesłanych plików: wynik zapisu zadania jest nieznany.",
          );
          toast.error(
            "Nie można potwierdzić zapisu zadania. Przesłane pliki mogły pozostać na serwerze.",
          );
          return;
        }
        for (const asset of tracked.values()) {
          void ExerciseService.deleteUnusedAsset(asset.id).catch((err) => {
            console.error("Nie udało się usunąć nieużywanego pliku:", err);
            toast.error(
              "Nie udało się usunąć nieużywanego załącznika z serwera.",
            );
          });
        }
        tracked.clear();
      };
    }, []);

    // * Inicjalizacja formularza (schemat Zod = jedyne źródło walidacji)
    const form = useForm<
      input<typeof exerciseFormSchema>,
      FieldValues,
      ExerciseFormData
    >({
      resolver: zodResolver(exerciseFormSchema),
      defaultValues: { ...EMPTY_FORM, ...defaultValues },
      mode: "onBlur",
    });

    const { control, handleSubmit, trigger } = form;

    // * Subskrypcje bloków dla podglądu na żywo
    const watchedContent = useWatch({ control, name: "content" });
    const watchedSolution = useWatch({ control, name: "solution" });

    // * Metody wystawione przez ref (używane przez ExerciseFormModal)
    useImperativeHandle(
      ref,
      () => ({
        validateStep: () =>
          activeTab === "info"
            ? trigger(
                [
                  "title",
                  "exerciseTypeCode",
                  "mathLevel",
                  "difficulty",
                  "points",
                  "categoryIds",
                  "tagIds",
                ],
                { shouldFocus: true },
              )
            : trigger(activeTab === "content" ? "content" : "solution", {
                shouldFocus: true,
              }),
        submit: () =>
          new Promise<boolean>((resolve) => {
            void handleSubmit(
              // * Walidacja przeszła — zapis przez serwis
              async (data: ExerciseFormData) => {
                const previouslyUnknown = saveOutcomeUnknown.current;
                let exerciseRequestStarted = false;
                try {
                  const resolveBlocks = async (
                    blocks: ExerciseFormBlockData[],
                  ): Promise<ExerciseFormBlockData[]> => {
                    const resolved: ExerciseFormBlockData[] = [];
                    for (const block of blocks) {
                      if (block.type !== "pending") {
                        resolved.push(block);
                        continue;
                      }
                      let asset = uploads.current.get(block.file);
                      if (!asset) {
                        asset = await ExerciseService.uploadAsset(block.file);
                        uploads.current.set(block.file, asset);
                      }
                      resolved.push(
                        asset.mimeType === "application/pdf"
                          ? {
                              type: "file",
                              assetId: asset.id,
                              name: asset.originalName,
                            }
                          : { type: "image", assetId: asset.id, caption: null },
                      );
                    }
                    return resolved;
                  };
                  const resolved = {
                    ...data,
                    content: await resolveBlocks(data.content),
                    solution: await resolveBlocks(data.solution),
                  };
                  exerciseRequestStarted = true;
                  saveOutcomeUnknown.current = true;
                  if (mode === "edit" && exerciseId) {
                    await ExerciseService.updateExercise(exerciseId, resolved);
                    toast.success("Zadanie zostało zaktualizowane");
                  } else {
                    await ExerciseService.createExercise(resolved);
                    toast.success("Zadanie zostało dodane");
                  }
                  saveOutcomeUnknown.current = false;
                  const usedIds = new Set(
                    [...resolved.content, ...resolved.solution].flatMap(
                      (block) =>
                        block.type === "image" || block.type === "file"
                          ? [block.assetId]
                          : [],
                    ),
                  );
                  for (const [file, asset] of uploads.current) {
                    if (usedIds.has(asset.id)) uploads.current.delete(file);
                  }
                  resolve(true);
                } catch (err) {
                  if (
                    exerciseRequestStarted &&
                    err instanceof ApiError &&
                    err.status >= 400 &&
                    err.status < 500
                  ) {
                    saveOutcomeUnknown.current = previouslyUnknown;
                  }
                  console.error("Exercise form submit error:", err);
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Nie udało się zapisać zadania",
                    {
                      description: saveOutcomeUnknown.current
                        ? mode === "add"
                          ? "Nie można potwierdzić, czy zadanie zostało zapisane. Sprawdź listę zadań przed ponowieniem, aby uniknąć duplikatu."
                          : "Nie można potwierdzić, czy zmiany zostały zapisane. Sprawdź zadanie przed ponowieniem."
                        : undefined,
                      duration: saveOutcomeUnknown.current ? 15000 : undefined,
                    },
                  );
                  resolve(false);
                }
              },
              () => {
                toast.error("Formularz zawiera błędy", {
                  description: "Sprawdź etapy i popraw zaznaczone pola.",
                });
                resolve(false);
              },
            )();
          }),
      }),
      [handleSubmit, trigger, mode, exerciseId, activeTab],
    );

    const isInfoTab = activeTab === "info";
    const activeStep = FORM_TABS.findIndex((tab) => tab.id === activeTab);

    return (
      <FormProvider {...form}>
        <fieldset
          disabled={isSubmitting}
          className={cn(
            "min-w-0",
            isSubmitting && "pointer-events-none opacity-70",
          )}
        >
          <div className="w-full">
            <ol
              aria-label="Etapy tworzenia zadania"
              className="mb-6 flex items-center justify-center gap-1 border-b border-border/50 bg-background pb-4 sm:gap-3"
            >
              {FORM_TABS.map((tab, index) => {
                const isActive = index === activeStep;
                const completed = index < activeStep;
                return (
                  <li
                    key={tab.id}
                    aria-label={`${tab.step}. ${tab.label}${completed ? ", ukończony" : ""}`}
                    aria-current={isActive ? "step" : undefined}
                    className="flex min-w-0 items-center gap-1 sm:gap-3"
                  >
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="hidden h-px w-8 bg-border sm:block lg:w-14"
                      />
                    )}
                    <span
                      className={cn(
                        "flex items-center gap-2 rounded-full px-2 py-2 text-xs font-semibold sm:px-3",
                        isActive
                          ? "border border-primary/25 bg-primary/5 text-primary shadow-sm"
                          : "text-muted-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : completed
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {completed ? (
                          <Check className="size-4" aria-hidden="true" />
                        ) : (
                          tab.step
                        )}
                      </span>
                      <span
                        className={cn(
                          "hidden sm:inline",
                          isActive && "inline!",
                        )}
                      >
                        {tab.label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {/* * Grid: formularz po lewej, kontekstowy podgląd po prawej (poza zakładką „Dane”) */}
            <div
              className={cn(
                "grid grid-cols-1 gap-8",
                !isInfoTab &&
                  "lg:grid-cols-[minmax(0,1fr)_minmax(360px,550px)]",
              )}
            >
              <div
                className={cn(
                  "w-full space-y-6",
                  isInfoTab && "mx-auto max-w-4xl",
                )}
              >
                <div hidden={activeTab !== "info"}>
                  <ExerciseInfoFields />
                </div>

                <div hidden={activeTab !== "content"}>
                  <ExerciseBlockBuilder
                    name="content"
                    label="Treść zadania"
                    required
                  />
                </div>

                <div hidden={activeTab !== "solution"}>
                  <ExerciseBlockBuilder
                    name="solution"
                    label="Rozwiązanie (Klucz odpowiedzi)"
                  />
                </div>
              </div>

              {/* * PRAWA KOLUMNA: kontekstowy podgląd */}
              <ExercisePreviewColumn
                isVisible={!isInfoTab}
                activeTab={activeTab}
                watchedContent={watchedContent}
                watchedSolution={watchedSolution ?? []}
              />
            </div>
          </div>
        </fieldset>
      </FormProvider>
    );
  },
);
