// ==========================================
// KOMPONENT: Wspólna przeglądarka zadań
// ==========================================
// * Jedyna implementacja filtrów, legendy i listy zadań — używana przez ExercisesView
// * (tryb "expandable") i buildera zestawów (tryb "scrollable" + akcja „+”).
// * Stan filtrów to JEDEN obiekt ExerciseFilters, a logika filtrowania żyje w utils.ts.

"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Database,
  FileText,
  Info,
  Lightbulb,
  ListFilter,
  Search,
  ChartNoAxesColumnIncreasing,
  BookSearch,
} from "lucide-react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ContentLoader } from "@/components/layout/ContentLoader";
import { TreeSelect } from "@/components/ui/tree-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExerciseRow } from "./ExerciseRow";
import {
  DEFAULT_EXERCISE_FILTERS,
  DIFFICULTY_STYLES,
  MATH_LEVEL_ICONS,
  SOURCE_TYPE_ICONS,
  SOURCE_TYPE_ICON_COLORS,
  ALL_FILTER_VALUE,
  filterExercises,
  getLabelEntries,
  hasActiveExerciseFilters,
  type ExerciseFilters,
} from "../utils";
import {
  EXERCISE_TYPE_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  type CategoryNode,
  type ExerciseDifficulty,
  type ExerciseListItem,
  type ExerciseMathLevel,
  type ExerciseSourceType,
  type ExerciseType,
} from "../types";

// ==========================================
// TYPY I STAŁE
// ==========================================

interface ExerciseBrowserProps {
  readonly exercises: readonly ExerciseListItem[];
  readonly isLoading?: boolean;
  readonly categoriesTree: readonly CategoryNode[];
  readonly excludedExerciseIds?: ReadonlySet<string>;
  readonly onEdit?: (id: string) => void;
  readonly onDelete?: (id: string) => void;
  readonly onAdd?: (id: string) => void;
  readonly onView?: (id: string) => void;
  readonly searchQuery?: string;
  readonly onSearchQueryChange?: (value: string) => void;
  readonly headerAction?: React.ReactNode;
  readonly sectionTitle?: string;
  readonly filterAction?: React.ReactNode;
  readonly listMode?: "expandable" | "scrollable";
  readonly initialLimit?: number;
  readonly emptyMessage?: string;
}

// ! Stała modułowa: domyślny `new Set()` w destrukturyzacji propsów tworzyłby nową
// ! referencję w każdym renderze i unieważniał useMemo filtrowania.
const EMPTY_ID_SET: ReadonlySet<string> = new Set<string>();

// * Etykiety legendy (krótsze/inne niż w selectach, dlatego osobne słowniki)
const LEGEND_DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};
const LEGEND_SOURCE_LABELS: Record<ExerciseSourceType, string> = {
  cke: "CKE",
  tutor: "Własne",
  generated: "AI",
};
const LEGEND_LEVEL_LABELS: Record<ExerciseMathLevel, string> = {
  primary_1_3: "Klasy 1-3",
  primary_4_8: "Klasy 4-8",
  highschool_basic: "Matura podstawowa",
  highschool_extended: "Matura rozszerzona",
};

// ==========================================
// KOMPONENT GŁÓWNY
// ==========================================

export function ExerciseBrowser({
  exercises,
  isLoading = false,
  categoriesTree,
  excludedExerciseIds = EMPTY_ID_SET,
  onEdit,
  onDelete,
  onAdd,
  onView,
  searchQuery,
  onSearchQueryChange,
  headerAction,
  sectionTitle,
  filterAction,
  listMode = "expandable",
  initialLimit = 5,
  emptyMessage = "Brak zadań w bazie",
}: ExerciseBrowserProps) {
  const [filters, setFilters] = useState<ExerciseFilters>(
    DEFAULT_EXERCISE_FILTERS,
  );
  const [showAll, setShowAll] = useState(false);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");

  // * Aktualizacja pojedynczego filtru bez rzutowań (klucz i wartość są spójne typowo)
  const updateFilter = useCallback(
    <K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) => {
      setFilters((previous) => ({ ...previous, [key]: value }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_EXERCISE_FILTERS);
    setInternalSearchQuery("");
    onSearchQueryChange?.("");
  }, [onSearchQueryChange]);

  // * Zadania dostępne = wszystkie bez wykluczonych (np. już dodanych do zestawu)
  const availableExercises = useMemo(
    () => exercises.filter((exercise) => !excludedExerciseIds.has(exercise.id)),
    [exercises, excludedExerciseIds],
  );

  // * Wynik filtrowania i sortowania (logika w utils.filterExercises)
  const effectiveSearchQuery = searchQuery ?? internalSearchQuery;
  const effectiveFilters = useMemo(
    () => ({ ...filters, query: effectiveSearchQuery }),
    [filters, effectiveSearchQuery],
  );
  const filteredExercises = useMemo(
    () => filterExercises(availableExercises, effectiveFilters, categoriesTree),
    [availableExercises, effectiveFilters, categoriesTree],
  );

  const hasActiveFilters = hasActiveExerciseFilters(effectiveFilters);

  const visibleExercises =
    listMode === "scrollable" || showAll
      ? filteredExercises
      : filteredExercises.slice(0, initialLimit);
  const additionalFilters: readonly ("points" | "solution")[] = [
    ...(filters.hasPoints ? (["points"] as const) : []),
    ...(filters.hasSolution ? (["solution"] as const) : []),
  ];

  return (
    <section className="space-y-6">
      {headerAction}
      {sectionTitle && (
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-foreground">{sectionTitle}</h2>
        </div>
      )}

      {/* ========================================== */}
      {/* PANEL FILTRÓW I LEGENDA                    */}
      {/* ========================================== */}
      <div className="flex w-full flex-col gap-4">
        {/* * Wyszukiwarka jest w głównym nagłówku bazy; w builderze pozostaje tutaj. */}
        <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
          {(!onSearchQueryChange || filterAction) && (
            <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row">
              {!onSearchQueryChange && (
                <div className="relative min-w-0 flex-1">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    aria-label="Szukaj zadań po tytule, dziale lub tagu"
                    placeholder="Szukaj po tytule, dziale lub tagu..."
                    className="h-11 w-full rounded-xl border-border/50 bg-card pl-10"
                    value={effectiveSearchQuery}
                    onChange={(event) =>
                      setInternalSearchQuery(event.target.value)
                    }
                  />
                </div>
              )}
              {filterAction}
            </div>
          )}

          {/* * Widoczna karta filtrów: szybkie wybory są segmentami, nie checkboxami. */}
          <div className="grid gap-4">
            <div className="grid gap-3 lg:grid-cols-3">
              <TreeSelect
                items={categoriesTree}
                value={
                  filters.category === ALL_FILTER_VALUE
                    ? null
                    : filters.category
                }
                onChange={(value) =>
                  updateFilter("category", value ?? ALL_FILTER_VALUE)
                }
                placeholder="Wybierz dział"
                rootLabel="Wszystkie działy"
                className="w-full"
              />
              <Select
                value={filters.type[0] ?? "all"}
                onValueChange={(value) =>
                  updateFilter(
                    "type",
                    value === "all" ? [] : [value as ExerciseType],
                  )
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Typ zadania" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy zadań</SelectItem>
                  {Object.entries(EXERCISE_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <Select
                value={filters.level[0] ?? "all"}
                onValueChange={(value) =>
                  updateFilter(
                    "level",
                    value === "all" ? [] : [value as ExerciseMathLevel],
                  )
                }
              >
                <SelectTrigger className="h-11 w-full rounded-xl">
                  <SelectValue placeholder="Poziom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie poziomy</SelectItem>
                  {Object.entries(EXERCISE_MATH_LEVEL_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_auto]">
              <SegmentedFilter
                label="Trudność"
                icon={ChartNoAxesColumnIncreasing}
                value={filters.difficulty}
                onChange={(value) => updateFilter("difficulty", value)}
                options={[
                  ["easy", "Łatwe"],
                  ["medium", "Średnie"],
                  ["hard", "Trudne"],
                ]}
              />
              <SegmentedFilter
                label="Źródło"
                icon={BookSearch}
                value={filters.source}
                onChange={(value) => updateFilter("source", value)}
                options={[
                  ["cke", "CKE"],
                  ["tutor", "Własne"],
                  ["generated", "AI"],
                ]}
              />
              <SegmentedFilter
                label="Dodatkowo"
                icon={ListFilter}
                value={additionalFilters}
                onChange={(value) => {
                  updateFilter("hasPoints", value.includes("points"));
                  updateFilter("hasSolution", value.includes("solution"));
                }}
                options={[
                  ["points", "Z punktacją"],
                  ["solution", "Z rozwiązaniem"],
                ]}
              />
              <div className="flex items-end justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="h-11 rounded-xl border border-destructive bg-white text-destructive hover:bg-white hover:text-destructive"
                  style={{
                    borderColor: "var(--destructive)",
                    color: "var(--destructive)",
                    backgroundColor: "white",
                  }}
                >
                  Wyczyść filtry
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-3 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-600 data-[state=open]:bg-blue-50 data-[state=open]:text-blue-600"
                      aria-label="Pokaż legendę"
                      title="Legenda"
                    >
                      <Info className="!h-7 !w-7" aria-hidden="true" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    side="bottom"
                    className="w-[min(92vw,66rem)] rounded-2xl border-border bg-white p-8 text-sm text-foreground shadow-lg"
                    style={{
                      backgroundColor: "white",
                      borderColor: "var(--border)",
                    }}
                  >
                    <ExerciseLegend />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* LISTA ZADAŃ                                */}
      {/* ========================================== */}
      {isLoading && exercises.length === 0 ? (
        <ContentLoader minHeight="h-[350px]" />
      ) : filteredExercises.length === 0 ? (
        // * Stan pusty (z podpowiedzią, gdy winne są aktywne filtry)
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-secondary/10 px-4 py-16 text-center">
          <FileText
            className="mb-4 h-12 w-12 text-muted-foreground/40"
            aria-hidden="true"
          />
          <p className="text-base font-semibold text-foreground">
            {emptyMessage}
          </p>
          {hasActiveFilters && (
            <p className="mt-1 text-sm text-muted-foreground">
              Zmień lub wyczyść filtry, aby zobaczyć więcej zadań.
            </p>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            listMode === "expandable" && "lg:grid-cols-2",
            listMode === "scrollable" &&
              "max-h-105 overflow-y-auto rounded-2xl p-1 pr-2 scrollbar-stable",
          )}
        >
          {visibleExercises.map((exercise) => (
            <ExerciseRow
              key={exercise.id}
              exercise={exercise}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              action={
                onAdd ? (
                  // * Okrągły „+” (tryb kreatora zestawu)
                  <Button
                    type="button"
                    variant="default"
                    size="icon"
                    className="ml-2 h-9 w-9 shrink-0 rounded-full shadow-sm"
                    aria-label={`Dodaj do zestawu: ${exercise.title}`}
                    onClick={() => onAdd(exercise.id)}
                  >
                    <Plus className="h-5 w-5" aria-hidden="true" />
                  </Button>
                ) : undefined
              }
            />
          ))}

          {/* * Przełącznik „Pokaż wszystkie / Zwiń” (tylko tryb expandable) */}
          {listMode === "expandable" &&
            filteredExercises.length > initialLimit && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-11 rounded-full px-6 shadow-sm"
                  onClick={() => setShowAll((current) => !current)}
                >
                  {showAll
                    ? "Zwiń listę"
                    : `Pokaż wszystkie (${filteredExercises.length})`}
                  {showAll ? (
                    <ChevronUp className="ml-2 h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            )}
        </div>
      )}
    </section>
  );
}

function SegmentedFilter<T extends string>({
  label,
  icon: Icon,
  value,
  onChange,
  options,
}: {
  readonly label: string;
  readonly icon: React.ComponentType<{ className?: string }>;
  readonly value: readonly T[];
  readonly onChange: (value: readonly T[]) => void;
  readonly options: readonly [T, string][];
}) {
  return (
    <div className="min-w-0">
      <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {label}
      </span>
      <div
        className="flex min-w-0 flex-wrap gap-2"
        role="group"
        aria-label={label}
      >
        {options.map(([optionValue, optionLabel]) => {
          const isActive = value.includes(optionValue);
          return (
            <Button
              key={optionValue}
              type="button"
              variant="outline"
              aria-pressed={isActive}
              onClick={() =>
                onChange(
                  isActive
                    ? value.filter((current) => current !== optionValue)
                    : [...value, optionValue],
                )
              }
              className={cn(
                "h-9 min-w-max rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                isActive
                  ? getFilterPillClass(optionValue)
                  : getFilterPillHoverClass(optionValue),
              )}
            >
              {isActive && (
                <Check className="h-3.5 w-3.5 stroke-3" aria-hidden="true" />
              )}
              {optionLabel}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function getFilterPillClass(value: string): string {
  switch (value) {
    case "easy":
      return "!border-2 !border-emerald-500 !bg-emerald-500/15 !text-emerald-700 hover:!bg-emerald-500/20";
    case "medium":
      return "!border-2 !border-amber-500 !bg-amber-500/15 !text-amber-700 hover:!bg-amber-500/20";
    case "hard":
      return "!border-2 !border-destructive !bg-destructive/15 !text-destructive hover:!bg-destructive/20";
    case "cke":
      return "!border-2 !border-rose-500 !bg-rose-500/15 !text-rose-700 hover:!bg-rose-500/20";
    case "tutor":
      return "!border-2 !border-blue-500 !bg-blue-500/15 !text-blue-700 hover:!bg-blue-500/20";
    case "generated":
      return "!border-2 !border-purple-500 !bg-purple-500/15 !text-purple-700 hover:!bg-purple-500/20";
    case "primary_1_3":
      return "!border-2 !border-emerald-500 !bg-emerald-500/15 !text-emerald-700 hover:!bg-emerald-500/20";
    case "primary_4_8":
      return "!border-2 !border-teal-500 !bg-teal-500/15 !text-teal-700 hover:!bg-teal-500/20";
    case "highschool_basic":
      return "!border-2 !border-sky-500 !bg-sky-500/15 !text-sky-700 hover:!bg-sky-500/20";
    case "highschool_extended":
      return "!border-2 !border-violet-500 !bg-violet-500/15 !text-violet-700 hover:!bg-violet-500/20";
    case "points":
      return "!border-2 !border-amber-500 !bg-amber-500/15 !text-amber-700 hover:!bg-amber-500/20";
    case "solution":
      return "!border-2 !border-primary !bg-primary/15 !text-primary hover:!bg-primary/20";
    default:
      return "!border-2 !border-primary !bg-primary/15 !text-primary hover:!bg-primary/20";
  }
}

function getFilterPillHoverClass(value: string): string {
  const hoverClasses: Record<string, string> = {
    easy: "hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-700",
    medium:
      "hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-700",
    hard: "hover:border-destructive/50 hover:bg-destructive/5 hover:text-destructive",
    cke: "hover:border-rose-500/50 hover:bg-rose-500/5 hover:text-rose-700",
    tutor: "hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-700",
    generated:
      "hover:border-purple-500/50 hover:bg-purple-500/5 hover:text-purple-700",
    primary_1_3:
      "hover:border-emerald-500/50 hover:bg-emerald-500/5 hover:text-emerald-700",
    primary_4_8:
      "hover:border-teal-500/50 hover:bg-teal-500/5 hover:text-teal-700",
    highschool_basic:
      "hover:border-sky-500/50 hover:bg-sky-500/5 hover:text-sky-700",
    highschool_extended:
      "hover:border-violet-500/50 hover:bg-violet-500/5 hover:text-violet-700",
    points:
      "hover:border-amber-500/50 hover:bg-amber-500/5 hover:text-amber-700",
    solution: "hover:border-primary/50 hover:bg-primary/5 hover:text-primary",
  };
  return cn(
    "border-border/60 !bg-white text-muted-foreground",
    hoverClasses[value] ??
      "hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
  );
}

// ==========================================
// KOMPONENT WEWNĘTRZNY: Grupa legendy
// ==========================================
// * Nagłówek + elementy jako jeden niepodzielny blok. Gdy grupa nie mieści się
// * w wierszu, przechodzi do następnego CAŁA (flex-wrap na poziomie grup).

function LegendGroup({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </span>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// KOMPONENT WEWNĘTRZNY: Legenda ikon i kolorów
// ==========================================
// * Generowana z tych samych map co wiersz listy (utils.ts) — legenda nie rozjedzie się z ikonami.

function ExerciseLegend() {
  return (
    <div className="grid w-full gap-4 pb-3 text-sm text-foreground sm:grid-cols-2 xl:grid-cols-4">
      {/* * Trudność: kolorowa kropka + etykieta */}
      <LegendGroup title="Trudność:">
        {getLabelEntries(LEGEND_DIFFICULTY_LABELS).map(([code, label]) => (
          <span key={code} className="inline-flex items-center">
            <span
              className={cn(
                "mr-1.5 inline-block h-2 w-2 rounded-full",
                DIFFICULTY_STYLES[code].dot,
              )}
              aria-hidden="true"
            />
            {label}
          </span>
        ))}
      </LegendGroup>

      {/* * Źródło: ikona + etykieta */}
      <LegendGroup title="Źródło:">
        {getLabelEntries(LEGEND_SOURCE_LABELS).map(([code, label]) => {
          const Icon = SOURCE_TYPE_ICONS[code];
          return (
            <span key={code} className="inline-flex items-center">
              <Icon
                className={cn(
                  "mr-1 h-3.5 w-3.5",
                  SOURCE_TYPE_ICON_COLORS[code],
                )}
                aria-hidden="true"
              />
              {label}
            </span>
          );
        })}
      </LegendGroup>

      {/* * Poziom: ikona + etykieta */}
      <LegendGroup title="Poziom:">
        {getLabelEntries(LEGEND_LEVEL_LABELS).map(([code, label]) => {
          const Icon = MATH_LEVEL_ICONS[code];
          return (
            <span key={code} className="inline-flex items-center">
              <Icon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {label}
            </span>
          );
        })}
      </LegendGroup>

      {/* * Inne: rozwiązanie i typ zadania */}
      <LegendGroup title="Inne:">
        <span className="inline-flex items-center">
          <Lightbulb
            className="mr-1 h-3.5 w-3.5 text-amber-500"
            aria-hidden="true"
          />
          Rozwiązanie
        </span>
        <span className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 font-bold text-indigo-600">
          Typ zadania
        </span>
      </LegendGroup>
    </div>
  );
}
