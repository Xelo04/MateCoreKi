// ==========================================
// WIDOK: Baza Zadań (/exercises)
// ==========================================

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  FolderOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Backpack,
  GraduationCap,
  Landmark,
  User,
  Sparkles,
  Pencil,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentLoader } from "@/components/layout/ContentLoader";

import {
  useExercisesList,
  useExerciseSetsList,
  useTags,
  useCategoriesTree,
} from "../hook";
import { ExerciseSetCard } from "../components/ExerciseSetCard";
import { ExerciseRow } from "../components/ExerciseRow";
import { CategoryTreeSelect } from "../components/CategoryTreeSelect";
import { smartSearch, getValidCategoryIds } from "../utils";
import type { ExerciseFormData } from "../schema";
import {
  EXERCISE_DIFFICULTY_LABELS,
  EXERCISE_MATH_LEVEL_LABELS,
  EXERCISE_TYPE_LABELS,
  EXERCISE_SOURCE_TYPE_LABELS,
  ExerciseDifficulty,
  ExerciseMathLevel,
  ExerciseType,
  ExerciseSourceType,
} from "../types";

const INITIAL_SETS_LIMIT = 3;
const INITIAL_EXERCISES_LIMIT = 5;

type SortOption =
  | "date_desc"
  | "date_asc"
  | "count_desc"
  | "count_asc"
  | "alpha_asc"
  | "alpha_desc";

export function ExercisesView() {
  const {
    items: exercises,
    isLoading: exercisesLoading,
    deleteExercise,
  } = useExercisesList();

  const {
    items: sets,
    isLoading: setsLoading,
    deleteExerciseSet,
    duplicateExerciseSet,
  } = useExerciseSetsList();

  const { tree: categoriesTree } = useCategoriesTree();
  const { tags } = useTags();

  // ----- Zestawy zadań -----
  const [setsSearchQuery, setSetsSearchQuery] = useState("");
  const [setsSort, setSetsSort] = useState<SortOption>("date_desc");
  const [setsTagFilter, setSetsTagFilter] = useState<string>("all");
  const [showAllSets, setShowAllSets] = useState(false);

  // ----- Baza wszystkich zadań -----
  const [exercisesSearchQuery, setExercisesSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterHasPoints, setFilterHasPoints] = useState(false);
  const [filterHasSolution, setFilterHasSolution] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);

  const isLoading = exercisesLoading || setsLoading;

  // ----- Filtrowanie zestawów -----
  const filteredAndSortedSets = useMemo(() => {
    let result = [...sets];

    if (setsSearchQuery.trim()) {
      const lower = setsSearchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.description?.toLowerCase().includes(lower),
      );
    }

    if (setsTagFilter !== "all") {
      result = result.filter((s) =>
        s.previewTags.some((t) => t.id === setsTagFilter),
      );
    }

    return result.sort((a, b) => {
      switch (setsSort) {
        case "date_desc":
          return b.updatedAt.getTime() - a.updatedAt.getTime();
        case "date_asc":
          return a.updatedAt.getTime() - b.updatedAt.getTime();
        case "count_desc":
          return b.exerciseCount - a.exerciseCount;
        case "count_asc":
          return a.exerciseCount - b.exerciseCount;
        case "alpha_asc":
          return a.name.localeCompare(b.name, "pl");
        case "alpha_desc":
          return b.name.localeCompare(a.name, "pl");
        default:
          return 0;
      }
    });
  }, [sets, setsSearchQuery, setsTagFilter, setsSort]);

  const visibleSets = showAllSets
    ? filteredAndSortedSets
    : filteredAndSortedSets.slice(0, INITIAL_SETS_LIMIT);

  const hasActiveSetFilters =
    setsSearchQuery.trim() !== "" ||
    setsTagFilter !== "all" ||
    setsSort !== "date_desc";

  // ----- Filtrowanie wszystkich zadań -----
  const filteredExercises = useMemo(() => {
    let result = [...exercises];

    if (exercisesSearchQuery.trim()) {
      result = result.filter((e) =>
        smartSearch(exercisesSearchQuery, [
          e.title,
          ...e.tags.map((t) => t.name),
          ...e.categories.map((c) => c.name),
        ]),
      );
    }

    if (filterCategory !== "all") {
      const validIds = getValidCategoryIds(categoriesTree, filterCategory);
      result = result.filter((e) =>
        e.categories.some((c) => validIds.has(c.id)),
      );
    }

    if (filterDifficulty !== "all") {
      result = result.filter((e) => e.difficulty === filterDifficulty);
    }

    if (filterTag !== "all") {
      result = result.filter((e) => e.tags.some((t) => t.id === filterTag));
    }

    if (filterLevel !== "all") {
      result = result.filter((e) => e.mathLevel === filterLevel);
    }

    if (filterType !== "all") {
      result = result.filter((e) => e.exerciseType === filterType);
    }

    if (filterSource !== "all") {
      result = result.filter((e) => e.sourceType === filterSource);
    }

    if (filterHasPoints) {
      result = result.filter((e) => e.points !== null);
    }

    if (filterHasSolution) {
      result = result.filter((e) => e.hasSolution);
    }

    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [
    exercises,
    exercisesSearchQuery,
    filterCategory,
    categoriesTree,
    filterDifficulty,
    filterTag,
    filterLevel,
    filterType,
    filterSource,
    filterHasPoints,
    filterHasSolution,
  ]);

  const visibleExercises = showAllExercises
    ? filteredExercises
    : filteredExercises.slice(0, INITIAL_EXERCISES_LIMIT);

  const hasActiveExerciseFilters =
    exercisesSearchQuery.trim() !== "" ||
    filterCategory !== "all" ||
    filterDifficulty !== "all" ||
    filterTag !== "all" ||
    filterLevel !== "all" ||
    filterType !== "all" ||
    filterSource !== "all" ||
    filterHasPoints ||
    filterHasSolution;

  // ----- Handlery akcji -----
  const handleNewSet = useCallback(
    () => toast.info("Modal dodawania zestawu — wkrótce"),
    [],
  );
  const handleEditSet = useCallback(
    () => toast.info("Modal edycji zestawu — wkrótce"),
    [],
  );
  const handleDuplicateSet = useCallback(
    async (id: string) => await duplicateExerciseSet(id),
    [duplicateExerciseSet],
  );
  const handleAssignSet = useCallback(
    () => toast.info("Formularz przypisywania pracy domowej - wkrótce"),
    [],
  );
  const handleDeleteSet = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "Czy na pewno chcesz usunąć ten zestaw? Zadania nie zostaną usunięte.",
        )
      ) {
        await deleteExerciseSet(id);
      }
    },
    [deleteExerciseSet],
  );

  const handleNewExercise = useCallback(() => {
    toast.info("Przejdźmy najpierw do formularza zadań :)");
  }, []);

  const handleEditExercise = useCallback(async (_id: string) => {
    toast.info("Edycja również czeka na nowy formularz blokowy");
  }, []);

  const handleDeleteExercise = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "Czy na pewno chcesz usunąć to zadanie? Zostanie usunięte ze wszystkich zestawów.",
        )
      ) {
        await deleteExercise(id);
      }
    },
    [deleteExercise],
  );

  if (isLoading) {
    return (
      <div className="space-y-12 pb-16">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Baza zadań
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Zarządzaj zadaniami i zestawami dla swoich uczniów.
            </p>
          </div>
        </div>
        <ContentLoader minHeight="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <BookOpen className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Baza zadań
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Zarządzaj zadaniami i zestawami dla swoich uczniów.
          </p>
        </div>
      </div>

      {/* ========================================== */}
      {/* SEKCJA 1: ZESTAWY ZADAŃ                    */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Zestawy zadań
            </h2>
            <span className="text-sm font-medium text-muted-foreground mt-1">
              ({filteredAndSortedSets.length}
              {hasActiveSetFilters && ` z ${sets.length}`})
            </span>
          </div>
          <Button
            onClick={handleNewSet}
            className="w-full sm:w-auto h-11 rounded-xl shadow-sm font-semibold"
          >
            <Plus className="mr-2 h-4 w-4" /> Utwórz zestaw
          </Button>
        </div>

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie lub opisie zestawu..."
              className="h-11 border-border/50 bg-card pl-10 rounded-xl w-full"
              value={setsSearchQuery}
              onChange={(e) => setSetsSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <Select
              value={setsSort}
              onValueChange={(v) => setSetsSort(v as SortOption)}
            >
              <SelectTrigger className="h-11 w-full sm:w-64 bg-card rounded-xl">
                <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Sortuj" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date_desc">Najnowsze najpierw</SelectItem>
                <SelectItem value="date_asc">Najstarsze najpierw</SelectItem>
                <SelectItem value="count_desc">Najwięcej zadań</SelectItem>
                <SelectItem value="count_asc">Najmniej zadań</SelectItem>
                <SelectItem value="alpha_asc">Alfabetycznie (A-Z)</SelectItem>
                <SelectItem value="alpha_desc">Alfabetycznie (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            <Select value={setsTagFilter} onValueChange={setSetsTagFilter}>
              <SelectTrigger className="h-11 w-full sm:w-48 bg-card rounded-xl">
                <SelectValue placeholder="Dział powtórki" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie działy</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredAndSortedSets.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-secondary/10 py-16 text-center px-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-base font-semibold text-foreground">
              Brak zestawów
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visibleSets.map((set) => (
                <ExerciseSetCard
                  key={set.id}
                  set={set}
                  onEdit={handleEditSet}
                  onDuplicate={handleDuplicateSet}
                  onDelete={handleDeleteSet}
                  onAssign={handleAssignSet}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ========================================== */}
      {/* SEKCJA 2: WSZYSTKIE ZADANIA                */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Baza wszystkich zadań
            </h2>
            <span className="text-sm font-medium text-muted-foreground mt-1">
              ({filteredExercises.length}
              {hasActiveExerciseFilters && ` z ${exercises.length}`})
            </span>
          </div>
          <Button
            className="w-full sm:w-auto h-11 rounded-xl shadow-sm font-semibold"
            onClick={handleNewExercise}
          >
            <Plus className="mr-2 h-4 w-4" /> Dodaj zadanie
          </Button>
        </div>

        <div className="flex flex-col gap-4 w-full">
          {/* ----- Rząd 1: Search (flex-1) + Dział (szeroki) ----- */}
          <div className="flex flex-col lg:flex-row items-stretch gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj po tytule, dziale lub tagu..."
                className="h-11 border-border/50 bg-card pl-10 rounded-xl w-full"
                value={exercisesSearchQuery}
                onChange={(e) => setExercisesSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex shrink-0 w-full lg:w-80">
              <CategoryTreeSelect
                tree={categoriesTree}
                value={filterCategory}
                onChange={setFilterCategory}
                placeholder="Wybierz dział"
                allOptionLabel="Wszystkie działy"
                className="w-full"
              />
            </div>
          </div>

          {/* ----- Rząd 2: Trudność, Źródło, Poziom, Typ + Checkboxy ----- */}
          {/* Nowy logiczny układ Flexbox + Grid wymuszający precyzyjne schodzenie się opcji na mniejszych ekranach */}
          <div className="flex flex-wrap items-center gap-4 pb-1 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 flex-1 min-w-[256px]">
              <Select
                value={filterDifficulty}
                onValueChange={setFilterDifficulty}
              >
                <SelectTrigger className="h-11 w-full bg-card rounded-xl">
                  <SelectValue placeholder="Trudność" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Dowolna trudność</SelectItem>
                  {(
                    Object.entries(EXERCISE_DIFFICULTY_LABELS) as [
                      ExerciseDifficulty,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="h-11 w-full bg-card rounded-xl">
                  <SelectValue placeholder="Źródło" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie źródła</SelectItem>
                  {(
                    Object.entries(EXERCISE_SOURCE_TYPE_LABELS) as [
                      ExerciseSourceType,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-11 w-full bg-card rounded-xl">
                  <SelectValue placeholder="Poziom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie poziomy</SelectItem>
                  {(
                    Object.entries(EXERCISE_MATH_LEVEL_LABELS) as [
                      ExerciseMathLevel,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-11 w-full bg-card rounded-xl">
                  <SelectValue placeholder="Typ zadania" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy</SelectItem>
                  {(
                    Object.entries(EXERCISE_TYPE_LABELS) as [
                      ExerciseType,
                      string,
                    ][]
                  ).map(([val, label]) => (
                    <SelectItem key={val} value={val}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-around gap-x-6 gap-y-3 px-1 w-full xl:w-auto shrink-0 mt-2 xl:mt-0">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-has-points"
                  checked={filterHasPoints}
                  onCheckedChange={(c) => setFilterHasPoints(c === true)}
                />
                <Label
                  htmlFor="filter-has-points"
                  className="text-sm font-medium text-foreground/80 cursor-pointer"
                >
                  Posiada punktację
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-has-solution"
                  checked={filterHasSolution}
                  onCheckedChange={(c) => setFilterHasSolution(c === true)}
                />
                <Label
                  htmlFor="filter-has-solution"
                  className="text-sm font-medium text-foreground/80 cursor-pointer"
                >
                  Posiada rozwiązanie
                </Label>
              </div>
            </div>
          </div>

          {/* ----- Rząd 3: Kompletna, owijana grupami Legenda ----- */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs text-muted-foreground px-1 pb-3">
            {/* Grupa: Trudność */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">Trudność:</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Łatwe
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Średnie
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="h-2 w-2 rounded-full bg-destructive" /> Trudne
              </span>
            </div>

            <span className="text-border/70 select-none hidden md:inline">
              |
            </span>

            {/* Grupa: Źródło */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">Źródło:</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Landmark className="h-3.5 w-3.5 text-rose-500" /> CKE
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <User className="h-3.5 w-3.5 text-blue-500" /> Własne
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" /> AI
              </span>
            </div>

            <span className="text-border/70 select-none hidden xl:inline">
              |
            </span>

            {/* Grupa: Poziom */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">Poziom:</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Pencil className="h-3.5 w-3.5" /> SP 1-3
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Backpack className="h-3.5 w-3.5" /> SP 4-8
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <BookOpen className="h-3.5 w-3.5" /> Matura Podstawowa
              </span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <GraduationCap className="h-3.5 w-3.5" /> Matura Rozszerzona
              </span>
            </div>

            <span className="text-border/70 select-none hidden 2xl:inline">
              |
            </span>

            {/* Grupa: Inne */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">Inne:</span>
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" /> Rozwiązanie
              </span>
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border-indigo-500/20 whitespace-nowrap">
                Typ zadania
              </span>
            </div>
          </div>
        </div>

        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-secondary/10 py-16 text-center px-4">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-base font-semibold text-foreground">
              Brak zadań w bazie
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleExercises.map((exercise) => (
              <ExerciseRow
                key={exercise.id}
                exercise={exercise}
                onEdit={handleEditExercise}
                onDelete={handleDeleteExercise}
              />
            ))}

            {filteredExercises.length > INITIAL_EXERCISES_LIMIT && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  className="rounded-full px-6 shadow-sm h-11"
                  onClick={() => setShowAllExercises(!showAllExercises)}
                >
                  {showAllExercises ? (
                    <>
                      <ChevronUp className="ml-2 h-4 w-4" /> Zwiń listę
                    </>
                  ) : (
                    <>
                      Pokaż wszystkie ({filteredExercises.length}){" "}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
