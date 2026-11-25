// ==========================================
// KOMPONENT: Pola zakładki „Dane zadania”
// ==========================================
// * Wydzielone z ExerciseForm — formularz zostaje cienkim orkiestratorem
// * (zakładki, submit, podgląd), a tu żyje cała logika pól metadanych.
// * Komponent musi być renderowany wewnątrz <FormProvider> (useFormContext).

"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Check, Loader2, Plus, Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ListStates";
import { ContentLoader } from "@/components/layout/ContentLoader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { ExerciseFormData } from "../schema";
import { useCategoriesTree, useExerciseMeta, useTags } from "../hook";
import type { ExerciseDifficulty } from "../types";
import {
  DIFFICULTY_STYLES,
  filterAndSortTags,
  toggleCategory,
} from "../utils";
import { CollapsibleCategoryNode } from "./CollapsibleCategoryNode";

// ==========================================
// STAŁE: Style kafelków (specyficzne dla formularza)
// ==========================================

// * Kropka trudności pochodzi z DIFFICULTY_STYLES; tu tylko aktywne obramowanie kafelka.
const DIFFICULTY_TILE_ACTIVE: Record<ExerciseDifficulty, string> = {
  easy: "border-emerald-500 bg-emerald-500/10",
  medium: "border-amber-500 bg-amber-500/10",
  hard: "border-destructive bg-destructive/10",
};

const TAG_SEARCH_DEBOUNCE_MS = 250;

// ==========================================
// POLE: Trudność (kafelki; ponowne kliknięcie czyści wybór)
// ==========================================

function DifficultyField() {
  const { control } = useFormContext<ExerciseFormData>();
  const { meta } = useExerciseMeta();

  return (
    <div className="space-y-1.5">
      <Label id="ex-difficulty-label">Trudność</Label>
      <Controller
        control={control}
        name="difficulty"
        render={({ field }) => (
          <div
            role="group"
            aria-labelledby="ex-difficulty-label"
            className="grid grid-cols-3 gap-2"
          >
            {meta?.difficulties.map(
              ({ code, name: label }) => {
                const isActive = field.value === code;

                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => field.onChange(isActive ? null : code)}
                    className={cn(
                      "relative flex h-full min-h-0 flex-col items-center justify-center gap-2 rounded-xl border-2 border-border/60 bg-card p-3 text-xs font-semibold transition-colors hover:bg-muted/40",
                      isActive
                        ? DIFFICULTY_TILE_ACTIVE[code]
                        : "text-muted-foreground",
                    )}
                  >
                    {/* * Kolorowa kropka wzmacnia znaczenie poziomu (nie tylko kolor — jest też etykieta) */}
                    <span
                      className={cn(
                        "absolute left-3 top-1/2 size-3 -translate-y-1/2 rounded-full",
                        DIFFICULTY_STYLES[code].dot,
                      )}
                      aria-hidden="true"
                    />
                    {label}
                  </button>
                );
              },
            )}
          </div>
        )}
      />
    </div>
  );
}

// ==========================================
// POLE: Działy nauki (drzewko z checkboxami)
// ==========================================

function CategoriesField() {
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ExerciseFormData>();
  const { tree, isLoading, error, refetch } = useCategoriesTree();
  const selectedIds = useWatch({ control, name: "categoryIds" });

  const onToggle = (categoryId: string, checked: boolean) => {
    const next = toggleCategory(tree, getValues("categoryIds"), categoryId, checked);
    setValue("categoryIds", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="space-y-2">
      <Label id="ex-categories-label">
        Działy nauki <span className="text-destructive">*</span>
      </Label>
      <div
        role="group"
        aria-labelledby="ex-categories-label"
        aria-describedby={errors.categoryIds ? "ex-categories-error" : undefined}
        className="max-h-72 overflow-y-auto rounded-xl border border-border/50 bg-card p-3"
      >
        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <p role="status" className="p-2 text-sm">Ładowanie działów...</p>
        ) : tree.length > 0 ? (
          tree.map((node) => (
            <CollapsibleCategoryNode
              key={node.id}
              node={node}
              selectedIds={selectedIds}
              onToggle={onToggle}
            />
          ))
        ) : (
          <p className="p-2 text-xs text-muted-foreground">
            Brak dostępnych działów.
          </p>
        )}
      </div>
      {errors.categoryIds && (
        <p id="ex-categories-error" role="alert" className="text-xs font-semibold text-destructive">
          {errors.categoryIds.message}
        </p>
      )}
    </div>
  );
}

// ==========================================
// POLE: Tagi dodatkowe (wyszukiwarka + tworzenie inline)
// ==========================================

function TagsField({
  onToggle,
}: {
  readonly onToggle: (tagId: string, checked: boolean) => void;
}) {
  const { control, formState: { errors } } = useFormContext<ExerciseFormData>();
  const { tags, isLoading, error, refetch, createTag } = useTags();
  const selectedIds = useWatch({ control, name: "tagIds" });

  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [debouncedTagSearch, setDebouncedTagSearch] = useState("");

  // * Debounce ogranicza liczbę przeliczeń listy podczas pisania.
  // * Cleanup czyści timer przy kolejnym znaku i przy odmontowaniu.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTagSearch(tagSearch);
    }, TAG_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [tagSearch]);

  const visibleTags = filterAndSortTags(tags, debouncedTagSearch);

  // * Tworzy tag i od razu go zaznacza. Błędy toastuje hook (createTag zwraca null).
  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed || isCreatingTag || isLoading || error) return;

    setIsCreatingTag(true);
    try {
      const tag = await createTag(trimmed);
      if (tag) {
        setNewTagName("");
        onToggle(tag.id, true);
      }
    } finally {
      setIsCreatingTag(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* * Nagłówek sekcji + wyszukiwarka tagów */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Label id="ex-tags-label" htmlFor="tag-search">Tagi dodatkowe</Label>
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="tag-search"
            type="text"
            value={tagSearch}
            onChange={(event) => setTagSearch(event.target.value)}
            placeholder="Szukaj tagu..."
            className="h-10 rounded-full pl-9 pr-9 text-sm"
          />
          {tagSearch && (
            <button
              type="button"
              onClick={() => setTagSearch("")}
              className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Wyczyść wyszukiwanie tagów"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card p-3">
        {/* * Lista tagów jako przełączniki (aria-pressed) */}
        <div
          role="group"
          aria-labelledby="ex-tags-label"
          aria-describedby={errors.tagIds ? "ex-tags-error" : undefined}
          className="flex flex-wrap gap-2"
        >
          {isLoading ? (
            <div role="status" className="w-full space-y-3 py-1">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
                Ładowanie tagów...
              </span>
              <div className="flex flex-wrap gap-2 motion-safe:animate-pulse" aria-hidden="true">
                <span className="h-8 w-20 rounded-full bg-muted" />
                <span className="h-8 w-28 rounded-full bg-muted" />
                <span className="h-8 w-24 rounded-full bg-muted" />
                <span className="h-8 w-16 rounded-full bg-muted" />
              </div>
            </div>
          ) : error ? <ErrorState message={error} onRetry={refetch} /> : (
            visibleTags.map((tag) => {
            const isSelected = selectedIds.includes(tag.id);

            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => onToggle(tag.id, !isSelected)}
                aria-pressed={isSelected}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border/60 bg-muted/50 text-muted-foreground hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "flex size-3.5 items-center justify-center rounded-sm border",
                    isSelected
                      ? "border-primary-foreground bg-primary-foreground text-primary"
                      : "border-current/60",
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="size-3" />}
                </span>
                {tag.name}
              </button>
            );
            })
          )}
          {!error && !isLoading && visibleTags.length === 0 && (
            <p className="w-full py-2 text-sm text-muted-foreground">
              Nie znaleziono tagów dla „{tagSearch}”.
            </p>
          )}
        </div>
        {errors.tagIds && <p id="ex-tags-error" role="alert" className="mt-2 text-sm text-destructive">{errors.tagIds.message}</p>}

        {/* * Tworzenie nowego tagu inline (Enter lub przycisk) */}
        <div className="mt-3 flex gap-2 border-t border-border/30 pt-3">
          <Input
            aria-label="Nazwa nowego tagu"
            placeholder="Nowy tag..."
            maxLength={30}
            value={newTagName}
            onChange={(event) => setNewTagName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                // ! Enter nie może zatwierdzić całego formularza zadania
                event.preventDefault();
                void handleCreateTag();
              }
            }}
            className="h-11 flex-1 rounded-full text-sm"
          />
          <Button
            type="button"
            onClick={() => void handleCreateTag()}
            disabled={!newTagName.trim() || isCreatingTag || isLoading || Boolean(error)}
            aria-label={isLoading ? "Ładowanie tagów" : isCreatingTag ? "Dodawanie tagu" : "Dodaj tag"}
            className="h-11 shrink-0 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          >
            {isCreatingTag || isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            ) : (
              <Plus className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="ml-2 hidden sm:inline">Dodaj tag</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExerciseInfoFields() {
  const { meta, error: metaError, retry } = useExerciseMeta();
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ExerciseFormData>();

  const toggleTag = useCallback(
    (id: string, shouldSelect: boolean) => {
      const current = getValues("tagIds");
      const next = shouldSelect
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((existingId) => existingId !== id);

      setValue("tagIds", next, { shouldDirty: true, shouldValidate: true });
    },
    [getValues, setValue],
  );

  if (metaError) return <ErrorState message={metaError} onRetry={retry} />;
  if (!meta) return <ContentLoader minHeight="h-12" />;

  return (
    <div className="space-y-5">
      {/* * Sekcja: Tytuł */}
      <div className="space-y-1.5">
        <Label htmlFor="ex-title">
          Tytuł zadania <span className="text-destructive">*</span>
        </Label>
        <Input
          id="ex-title"
          placeholder="np. Równanie kwadratowe z parametrem"
          className="h-11 rounded-xl"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "ex-title-error" : undefined}
          {...register("title")}
        />
        {errors.title && (
          <p id="ex-title-error" role="alert" className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* * Sekcja: Atrybuty zadania */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5">
          {/* * Typ zadania (wymagany) */}
          <div className="space-y-1.5">
            <Label htmlFor="ex-type">
              Typ zadania <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="exerciseTypeCode"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(next) => {
                    const option = meta.exercise_types.find((item) => item.code === next);
                    if (option) field.onChange(option.code);
                  }}
                >
                  <SelectTrigger
                    id="ex-type"
                    className="h-11 rounded-xl bg-card"
                    aria-label="Typ zadania"
                    aria-invalid={Boolean(errors.exerciseTypeCode)}
                    aria-describedby={errors.exerciseTypeCode ? "ex-type-error" : undefined}
                  >
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.exercise_types.map(
                      ({ code, name: label }) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.exerciseTypeCode && (
              <p id="ex-type-error" role="alert" className="text-xs text-destructive">
                {errors.exerciseTypeCode.message}
              </p>
            )}
          </div>

          {/* * Poziom edukacji (opcjonalny; "none" = null) */}
          <div className="space-y-1.5">
            <Label>Poziom</Label>
            <Controller
              control={control}
              name="mathLevel"
              render={({ field }) => (
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(next) => {
                    if (next === "none") field.onChange(null);
                    else {
                      const option = meta.math_levels.find((item) => item.code === next);
                      if (option) field.onChange(option.code);
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl bg-card"
                    aria-label="Poziom"
                  >
                    <SelectValue placeholder="Brak" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nieokreślony</SelectItem>
                    {meta.math_levels.map(
                      ({ code, name: label }) => (
                        <SelectItem key={code} value={code}>
                          {label}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        <DifficultyField />

        {/* * Punkty (puste pole = null; niepoprawna liczba odrzucana przez schemat) */}
        <div className="space-y-1.5">
          <Label htmlFor="ex-points">Punkty</Label>
          <div className="relative">
            <Input
              id="ex-points"
              type="number"
              min={0}
              max={100}
              placeholder="0"
              className="rounded-xl pr-16 text-base font-semibold"
              aria-invalid={Boolean(errors.points)}
              aria-describedby={errors.points ? "ex-points-error" : undefined}
              {...register("points", {
                setValueAs: (value: unknown) =>
                  value === "" || value == null ? null : Number(value),
              })}
            />
            <span
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground"
              aria-hidden="true"
            >
              pkt
            </span>
          </div>
          {errors.points && (
            <p id="ex-points-error" role="alert" className="text-xs text-destructive">{errors.points.message}</p>
          )}
        </div>
      </div>

      <CategoriesField />
      <TagsField onToggle={toggleTag} />
    </div>
  );
}
