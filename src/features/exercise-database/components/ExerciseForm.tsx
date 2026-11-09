// ==========================================
// KOMPONENT: Formularz zadania (orkiestrator)
// ==========================================
// * Zakładki (Dane / Treść / Rozwiązanie), walidacja, submit wystawiony przez ref
// * (używa go ExerciseFormModal) oraz kontekstowy podgląd. Pola metadanych
// * żyją w ExerciseInfoFields, kreatory bloków w ExerciseBlockBuilder.

"use client";

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import type { input } from "zod";
import {
  FormProvider,
  useForm,
  useWatch,
  type FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import { exerciseFormSchema, type ExerciseFormData } from "../schema";
import { ExerciseService } from "../service";
import { ExerciseBlockBuilder } from "./ExerciseBlockBuilder";
import { ExerciseInfoFields } from "./ExerciseInfoFields";
import { ExercisePreviewColumn } from "./ExercisePreviewColumn";

// ==========================================
// TYPY PUBLICZNE (WYKORZYSTYWANE PRZEZ MODAL)
// ==========================================

export interface ExerciseFormResult {
  success: boolean;
  data?: ExerciseFormData;
  error?: string;
}

export interface ExerciseFormHandle {
  // ? validate() nie jest obecnie używane przez modal — zachowane jako część publicznego API
  validate: () => Promise<boolean>;
  submit: () => Promise<ExerciseFormResult>;
}

interface ExerciseFormProps {
  readonly mode: "add" | "edit";
  readonly exerciseId?: string;
  readonly defaultValues?: Partial<ExerciseFormData>;
}

// ==========================================
// KONFIGURACJA POCZĄTKOWA I ZAKŁADKI
// ==========================================

// * Wartości startowe pustego formularza (nadpisywane przez defaultValues przy edycji)
const EMPTY_FORM: Partial<ExerciseFormData> = {
  title: "",
  exerciseTypeCode: undefined,
  sourceTypeCode: undefined,
  mathLevel: null,
  difficulty: null,
  points: null,
  categoryIds: [],
  tagIds: [],
  content: [],
  solution: [],
};

type FormTabId = "info" | "content" | "solution";

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
  function ExerciseForm({ mode, exerciseId, defaultValues }, ref) {
    const [activeTab, setActiveTab] = useState<FormTabId>("info");

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

    const {
      control,
      handleSubmit,
      trigger,
      formState: { errors },
    } = form;

    // * Subskrypcje bloków dla podglądu na żywo
    const watchedContent = useWatch({ control, name: "content" });
    const watchedSolution = useWatch({ control, name: "solution" });

    // * Metody wystawione przez ref (używane przez ExerciseFormModal)
    useImperativeHandle(
      ref,
      () => ({
        validate: async () => trigger(),
        submit: () =>
          new Promise<ExerciseFormResult>((resolve) => {
            void handleSubmit(
              // * Walidacja przeszła — zapis przez serwis
              async (data: ExerciseFormData) => {
                try {
                  if (mode === "edit" && exerciseId) {
                    await ExerciseService.updateExercise(exerciseId, data);
                    toast.success("Zadanie zostało zaktualizowane");
                  } else {
                    await ExerciseService.createExercise(data);
                    toast.success("Zadanie zostało dodane");
                  }
                  resolve({ success: true, data });
                } catch (err) {
                  console.error("Exercise form submit error:", err);
                  toast.error("Nie udało się zapisać zadania");
                  resolve({
                    success: false,
                    error: "Nie udało się zapisać zadania",
                  });
                }
              },
              // * Walidacja nie przeszła — informujemy, w których zakładkach szukać błędów
              () => {
                toast.error("Formularz zawiera błędy", {
                  description: "Sprawdź zakładki i popraw zaznaczone pola.",
                });
                resolve({ success: false, error: "Formularz zawiera błędy" });
              },
            )();
          }),
      }),
      [handleSubmit, trigger, mode, exerciseId],
    );

    // * Liczba błędów per zakładka (czerwone kropki na nieaktywnych zakładkach)
    const tabErrorCounts = useMemo<Record<FormTabId, number>>(
      () => ({
        info: [
          errors.title,
          errors.sourceTypeCode,
          errors.exerciseTypeCode,
          errors.categoryIds,
          errors.points,
        ].filter(Boolean).length,
        content: errors.content ? 1 : 0,
        solution: errors.solution ? 1 : 0,
      }),
      [errors],
    );

    const isInfoTab = activeTab === "info";

    return (
      <FormProvider {...form}>
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FormTabId)}
          className="w-full"
        >
          {/* * Nawigacja po zakładkach nad obiema kolumnami modala */}
          <TabsList className="lg:sticky lg:top-0 lg:z-30 mx-auto mb-6 flex h-auto w-full flex-col rounded-xl border border-border/60 bg-background/95 p-1.5 shadow-sm backdrop-blur sm:flex-row sm:rounded-full">
            {FORM_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const errorCount = tabErrorCounts[tab.id];

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-11 w-full rounded-lg px-2 sm:rounded-full sm:px-4"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                        isActive
                          ? "bg-primary-foreground text-primary"
                          : "bg-muted-foreground/20 text-muted-foreground",
                      )}
                      aria-hidden="true"
                    >
                      {tab.step}
                    </span>
                    <span>{tab.label}</span>
                    {/* * Licznik błędów — tekst dla czytników ekranu, nie tylko kolor */}
                    {!isActive && errorCount > 0 && (
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white"
                        aria-label={`Liczba błędów: ${errorCount}`}
                      >
                        {errorCount}
                      </span>
                    )}
                  </div>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {/* * Grid: formularz po lewej, kontekstowy podgląd po prawej (poza zakładką „Dane”) */}
          <div
            className={cn(
              "grid grid-cols-1 gap-8",
              !isInfoTab && "lg:grid-cols-[minmax(0,1fr)_minmax(360px,550px)]",
            )}
          >
            <div
              className={cn(
                "w-full space-y-6",
                isInfoTab && "mx-auto max-w-4xl",
              )}
            >
              {/* * ZAKŁADKA 1: Dane zadania */}
              {/* ! forceMount: pola (tagi, kategorie) pobierają dane w hookach — bez tego */}
              {/* ! każdy powrót do zakładki odmontowywałby je i wywoływał refetch */}
              <TabsContent
                value="info"
                forceMount
                className="mt-0 data-[state=inactive]:hidden"
              >
                <ExerciseInfoFields />
              </TabsContent>

              {/* * ZAKŁADKA 2: Kreator treści */}
              {/* ! forceMount utrzymuje wpisane bloki w pamięci przy przełączaniu zakładek */}
              <TabsContent
                value="content"
                forceMount
                className="mt-0 data-[state=inactive]:hidden"
              >
                <ExerciseBlockBuilder
                  name="content"
                  label="Treść zadania"
                  required
                />
              </TabsContent>

              {/* * ZAKŁADKA 3: Kreator rozwiązania */}
              <TabsContent
                value="solution"
                forceMount
                className="mt-0 data-[state=inactive]:hidden"
              >
                <ExerciseBlockBuilder
                  name="solution"
                  label="Rozwiązanie (Klucz odpowiedzi)"
                />
              </TabsContent>
            </div>

            {/* * PRAWA KOLUMNA: kontekstowy podgląd */}
            <ExercisePreviewColumn
              isVisible={!isInfoTab}
              activeTab={activeTab}
              watchedContent={watchedContent}
              watchedSolution={watchedSolution ?? []}
            />
          </div>
        </Tabs>
      </FormProvider>
    );
  },
);
