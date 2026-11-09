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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import type { ExerciseFormData } from "../schema";
import { useCategoriesTree, useTags } from "../hook";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_SOURCE_TYPE_LABELS,
  EXERCISE_TYPE_LABELS,
  type ExerciseDifficulty,
  type ExerciseSourceType,
} from "../types";
import {
  DIFFICULTY_STYLES,
  SOURCE_TYPE_ICONS,
  SOURCE_TYPE_ICON_COLORS,
  filterAndSortTags,
  getLabelEntries,
  isLabelKey,
} from "../utils";
import { CollapsibleCategoryNode } from "./CollapsibleCategoryNode";

// ==========================================
// STAŁE: Style kafelków (specyficzne dla formularza)
// ==========================================

// * Ikony i kolory ikon źródła pochodzą z utils.ts; tu tylko stany aktywny/hover kafelka.
// ! Pełne literały klas Tailwind — nie składać ich dynamicznie.
const SOURCE_TILE_STYLES: Record<
  ExerciseSourceType,
  { readonly active: string; readonly hover: string }
> = {
  cke: {
    active: "border-rose-500 bg-rose-500/10 text-rose-600",
    hover: "hover:border-rose-400 hover:bg-rose-500/5",
  },
  tutor: {
    active: "border-blue-500 bg-blue-500/10 text-blue-600",
    hover: "hover:border-blue-400 hover:bg-blue-500/5",
  },
  generated: {
    active: "border-purple-500 bg-purple-500/10 text-purple-600",
    hover: "hover:border-purple-400 hover:bg-purple-500/5",
  },
};

// * Kropka trudności pochodzi z DIFFICULTY_STYLES; tu tylko aktywne obramowanie kafelka.
const DIFFICULTY_TILE_ACTIVE: Record<ExerciseDifficulty, string> = {
  easy: "border-emerald-500 bg-emerald-500/10",
  medium: "border-amber-500 bg-amber-500/10",
  hard: "border-destructive bg-destructive/10",
};

const TAG_SEARCH_DEBOUNCE_MS = 250;

// ==========================================
// POLE: Źródło zadania (kafelki)
// ==========================================

function SourceTypeField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ExerciseFormData>();

  return (
    <div className="space-y-1.5">
      <Label id="ex-source-label">
        Źródło <span className="text-destructive">*</span>
      </Label>
      <Controller
        control={control}
        name="sourceTypeCode"
        render={({ field }) => (
          // * Grupa kafelków wyboru źródła (CKE / Własne / AI)
          <div
            role="group"
            aria-labelledby="ex-source-label"
            className="grid h-32 grid-cols-3 gap-2"
          >
            {getLabelEntries(EXERCISE_SOURCE_TYPE_LABELS).map(
              ([code, label]) => {
                const Icon = SOURCE_TYPE_ICONS[code];
                const isActive = field.value === code;

                return (
                  <button
                    key={code}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => field.onChange(code)}
                    className={cn(
                      "flex h-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-border/60 bg-card p-3 text-xs font-semibold transition-colors",
                      SOURCE_TILE_STYLES[code].hover,
                      isActive
                        ? `${SOURCE_TILE_STYLES[code].active} shadow-md`
                        : "text-muted-foreground",
                    )}
                  >
                    <Icon
                      className={cn("h-7 w-7", SOURCE_TYPE_ICON_COLORS[code])}
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
      {errors.sourceTypeCode && (
        <p className="text-xs text-destructive">
          {errors.sourceTypeCode.message}
        </p>
      )}
    </div>
  );
}

// ==========================================
// POLE: Trudność (kafelki; ponowne kliknięcie czyści wybór)
// ==========================================

function DifficultyField() {
  const { control } = useFormContext<ExerciseFormData>();

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
            {getLabelEntries(EXERCISE_DIFFICULTY_LABELS).map(
              ([code, label]) => {
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

function CategoriesField({
  onToggle,
}: {
  readonly onToggle: (categoryId: string, checked: boolean) => void;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<ExerciseFormData>();
  const { tree } = useCategoriesTree();
  const selectedIds = useWatch({ control, name: "categoryIds" });

  return (
    <div className="space-y-2">
      <Label>
        Działy nauki <span className="text-destructive">*</span>
      </Label>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-border/50 bg-card p-3">
        {tree.length > 0 ? (
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
        <p className="text-xs font-semibold text-destructive">
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
  const { control } = useFormContext<ExerciseFormData>();
  const { tags, createTag } = useTags();
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
    if (!trimmed || isCreatingTag) return;

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
        <Label htmlFor="tag-search">Tagi dodatkowe</Label>
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
        <div className="flex flex-wrap gap-2">
          {visibleTags.map((tag) => {
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
          })}
          {visibleTags.length === 0 && (
            <p className="w-full py-2 text-sm text-muted-foreground">
              Nie znaleziono tagów dla „{tagSearch}”.
            </p>
          )}
        </div>

        {/* * Tworzenie nowego tagu inline (Enter lub przycisk) */}
        <div className="mt-3 flex gap-2 border-t border-border/30 pt-3">
          <Input
            aria-label="Nazwa nowego tagu"
            placeholder="Nowy tag..."
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
            disabled={!newTagName.trim() || isCreatingTag}
            className="h-11 shrink-0 rounded-full bg-primary px-4 text-primary-foreground hover:bg-primary/90"
          >
            {isCreatingTag ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
  const {
    register,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<ExerciseFormData>();

  // * Jedna implementacja zaznaczania ID dla tagów i działów.
  // * Czyta aktualną wartość przez getValues, więc nie ma przeterminowanych domknięć.
  const toggleFieldId = useCallback(
    (field: "tagIds" | "categoryIds", id: string, shouldSelect: boolean) => {
      const current = getValues(field);
      const next = shouldSelect
        ? current.includes(id)
          ? current
          : [...current, id]
        : current.filter((existingId) => existingId !== id);

      setValue(field, next, { shouldDirty: true, shouldValidate: true });
    },
    [getValues, setValue],
  );

  const toggleCategory = useCallback(
    (categoryId: string, checked: boolean) =>
      toggleFieldId("categoryIds", categoryId, checked),
    [toggleFieldId],
  );

  const toggleTag = useCallback(
    (tagId: string, checked: boolean) =>
      toggleFieldId("tagIds", tagId, checked),
    [toggleFieldId],
  );

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
          {...register("title")}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* * Sekcja: Atrybuty zadania */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5">
        <SourceTypeField />

        <div className="space-y-5">
          {/* * Typ zadania (wymagany) */}
          <div className="space-y-1.5">
            <Label>
              Typ zadania <span className="text-destructive">*</span>
            </Label>
            <Controller
              control={control}
              name="exerciseTypeCode"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(next) => {
                    if (isLabelKey(EXERCISE_TYPE_LABELS, next)) {
                      field.onChange(next);
                    }
                  }}
                >
                  <SelectTrigger
                    className="h-11 rounded-xl bg-card"
                    aria-label="Typ zadania"
                  >
                    <SelectValue placeholder="Wybierz typ" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLabelEntries(EXERCISE_TYPE_LABELS).map(
                      ([code, label]) => (
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
              <p className="text-xs text-destructive">
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
                  onValueChange={(next) =>
                    field.onChange(
                      isLabelKey(EXERCISE_MATH_LEVEL_LABELS, next)
                        ? next
                        : null,
                    )
                  }
                >
                  <SelectTrigger
                    className="h-11 rounded-xl bg-card"
                    aria-label="Poziom"
                  >
                    <SelectValue placeholder="Brak" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nieokreślony</SelectItem>
                    {getLabelEntries(EXERCISE_MATH_LEVEL_LABELS).map(
                      ([code, label]) => (
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
              max={999}
              placeholder="0"
              className="rounded-xl pr-16 text-base font-semibold"
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
            <p className="text-xs text-destructive">{errors.points.message}</p>
          )}
        </div>
      </div>

      <CategoriesField onToggle={toggleCategory} />
      <TagsField onToggle={toggleTag} />
    </div>
  );
}
