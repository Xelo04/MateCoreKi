// ==========================================
// WIDOK: Baza Zadań (/exercises)
// ==========================================
// Główny widok modułu zadań. Zawiera dwie sekcje:
// 1. Zestawy zadań (z globalnymi filtrami, sortowaniem, działami, limitem 3 na start)
// 2. Wszystkie zadania (smart search, checkboxy, legenda ikon, pasek trudności, limit 5 na start)

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  BookOpen,
  Plus,
  Search,
  FolderOpen,
  FileText,
  Filter,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Image as ImageIcon,
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

import { useExercisesList, useExerciseSetsList, useTags } from "../hook";
import { useStudentsList } from "@/features/students/hook";
import { ExerciseSetCard } from "../components/ExerciseSetCard";
import { ExerciseRow } from "../components/ExerciseRow";
import { smartSearch } from "../utils";
import { EXERCISE_DIFFICULTY_LABELS } from "../types";
import type { ExerciseDifficulty } from "../types";

// * Limity wyświetlania dla obu sekcji przed rozwinięciem
const INITIAL_SETS_LIMIT = 3;
const INITIAL_EXERCISES_LIMIT = 5;

// * Opcje sortowania zestawów
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

  const { tags } = useTags();
  const { activeStudents } = useStudentsList();

  // ==========================================
  // STANY DLA FILTRÓW I SORTOWANIA
  // ==========================================
  // ----- Zestawy zadań -----
  const [setsSearchQuery, setSetsSearchQuery] = useState("");
  const [setsSort, setSetsSort] = useState<SortOption>("date_desc");
  const [setsStudentFilter, setSetsStudentFilter] = useState<string>("all");
  const [setsTagFilter, setSetsTagFilter] = useState<string>("all");
  const [showAllSets, setShowAllSets] = useState(false);

  // ----- Baza wszystkich zadań -----
  const [exercisesSearchQuery, setExercisesSearchQuery] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [filterHasPoints, setFilterHasPoints] = useState(false);
  const [filterHasSolution, setFilterHasSolution] = useState(false);
  const [showAllExercises, setShowAllExercises] = useState(false);

  const isLoading = exercisesLoading || setsLoading;

  // ==========================================
  // LOGIKA FILTROWANIA I SORTOWANIA (GLOBALNA)
  // ==========================================
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

    if (setsStudentFilter !== "all") {
      result = result.filter((s) => s.studentId === setsStudentFilter);
    }

    if (setsTagFilter !== "all") {
      result = result.filter((s) =>
        s.previewTags.some((t) => t.id === setsTagFilter),
      );
    }

    return result.sort((a, b) => {
      switch (setsSort) {
        case "date_desc":
          return b.lastModified.getTime() - a.lastModified.getTime();
        case "date_asc":
          return a.lastModified.getTime() - b.lastModified.getTime();
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
  }, [sets, setsSearchQuery, setsStudentFilter, setsTagFilter, setsSort]);

  const visibleSets = showAllSets
    ? filteredAndSortedSets
    : filteredAndSortedSets.slice(0, INITIAL_SETS_LIMIT);

  const hasActiveSetFilters =
    setsSearchQuery.trim() !== "" ||
    setsStudentFilter !== "all" ||
    setsTagFilter !== "all" ||
    setsSort !== "date_desc";

  // ----- Filtrowanie wszystkich zadań z smart search -----
  const filteredExercises = useMemo(() => {
    let result = [...exercises];

    if (exercisesSearchQuery.trim()) {
      result = result.filter((e) =>
        smartSearch(exercisesSearchQuery, [
          e.title,
          e.contentText,
          ...e.tags.map((t) => t.name),
        ]),
      );
    }

    if (filterDifficulty !== "all") {
      result = result.filter((e) => e.difficulty === filterDifficulty);
    }

    if (filterTag !== "all") {
      result = result.filter((e) => e.tags.some((t) => t.id === filterTag));
    }

    if (filterHasPoints) {
      result = result.filter((e) => e.points !== null);
    }

    if (filterHasSolution) {
      result = result.filter((e) => e.hasSolution);
    }

    // * Zadania zawsze sortujemy od najnowszego, żeby na samej górze były świeżo dodane
    return result.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );
  }, [
    exercises,
    exercisesSearchQuery,
    filterDifficulty,
    filterTag,
    filterHasPoints,
    filterHasSolution,
  ]);

  const visibleExercises = showAllExercises
    ? filteredExercises
    : filteredExercises.slice(0, INITIAL_EXERCISES_LIMIT);

  const hasActiveExerciseFilters =
    exercisesSearchQuery.trim() !== "" ||
    filterDifficulty !== "all" ||
    filterTag !== "all" ||
    filterHasPoints ||
    filterHasSolution;

  // ==========================================
  // HANDLERY AKCJI
  // ==========================================
  const handleNewSet = useCallback(() => {
    toast.info("Modal dodawania zestawu — wkrótce");
  }, []);

  const handleNewExercise = useCallback(() => {
    toast.info("Modal dodawania zadania — wkrótce");
  }, []);

  const handleEditSet = useCallback(() => {
    toast.info("Modal edycji zestawu — wkrótce");
  }, []);

  const handleEditExercise = useCallback(() => {
    toast.info("Modal edycji zadania — wkrótce");
  }, []);

  const handleDuplicateSet = useCallback(
    async (id: string) => {
      await duplicateExerciseSet(id);
    },
    [duplicateExerciseSet],
  );

  const handleAssignSet = useCallback(() => {
    toast.info("Formularz przypisywania pracy domowej — wkrótce");
  }, []);

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

  // ==========================================
  // WIDOK ŁADOWANIA (Loader)
  // ==========================================
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
      {/* ========================================== */}
      {/* NAGŁÓWEK GŁÓWNY STRONY                     */}
      {/* ========================================== */}
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

            <Select
              value={setsStudentFilter}
              onValueChange={setSetsStudentFilter}
            >
              <SelectTrigger className="h-11 w-full sm:w-48 bg-card rounded-xl">
                <SelectValue placeholder="Dla ucznia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy uczniowie</SelectItem>
                {activeStudents.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
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
              {setsSearchQuery
                ? "Brak zestawów spełniających kryteria"
                : "Brak zestawów zadań"}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-sm">
              {setsSearchQuery
                ? "Spróbuj zmienić filtry lub wyszukaj inną frazę."
                : "Grupuj zadania w arkusze lub powtórki dla swoich uczniów. Łatwo przypiszesz je później jako prace domowe."}
            </p>
            {!hasActiveSetFilters && (
              <Button
                onClick={handleNewSet}
                className="shadow-md rounded-xl h-11"
              >
                <Plus className="mr-2 h-4 w-4" /> Utwórz zestaw
              </Button>
            )}
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

            {filteredAndSortedSets.length > INITIAL_SETS_LIMIT && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  className="rounded-full px-6 shadow-sm h-11"
                  onClick={() => setShowAllSets(!showAllSets)}
                >
                  {showAllSets ? (
                    <>
                      Zwiń listę
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Pokaż wszystkie ({filteredAndSortedSets.length})
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}
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

        {/* * Pasek filtrów: smart search + dropdowny + checkboxy */}
        <div className="flex flex-col gap-4 w-full">
          {/* ----- Rząd 1: Wyszukiwarka + Filtry dropdownowe ----- */}
          <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj po tytule, treści lub tagu..."
                className="h-11 border-border/50 bg-card pl-10 rounded-xl w-full"
                value={exercisesSearchQuery}
                onChange={(e) => setExercisesSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
              <Select
                value={filterDifficulty}
                onValueChange={setFilterDifficulty}
              >
                <SelectTrigger className="h-11 w-full sm:w-56 bg-card rounded-xl">
                  <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Trudność" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie poziomy</SelectItem>
                  {(
                    Object.entries(EXERCISE_DIFFICULTY_LABELS) as [
                      ExerciseDifficulty,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="h-11 w-full sm:w-56 bg-card rounded-xl">
                  <SelectValue placeholder="Dział" />
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

          {/* ----- Rząd 2: Checkboxy filtrów oraz Legenda Ikon ----- */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/30 pb-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-has-points"
                  checked={filterHasPoints}
                  onCheckedChange={(checked) =>
                    setFilterHasPoints(checked === true)
                  }
                />
                <Label
                  htmlFor="filter-has-points"
                  className="text-sm font-medium text-foreground/80 cursor-pointer select-none"
                >
                  Posiada punktację
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="filter-has-solution"
                  checked={filterHasSolution}
                  onCheckedChange={(checked) =>
                    setFilterHasSolution(checked === true)
                  }
                />
                <Label
                  htmlFor="filter-has-solution"
                  className="text-sm font-medium text-foreground/80 cursor-pointer select-none"
                >
                  Posiada rozwiązanie
                </Label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-foreground/70" />
                Zawiera zdjęcia
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-foreground/70" />
                Zawiera pliki PDF
              </span>
              <span className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                Posiada rozwiązanie
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-1 rounded-full bg-emerald-500" />
                Łatwe
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-1 rounded-full bg-amber-500" />
                Średnie
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-1 rounded-full bg-destructive" />
                Trudne
              </span>
            </div>
          </div>
        </div>

        {/* ========================================== */}
        {/* LISTA ZADAŃ LUB STAN PUSTY                 */}
        {/* ========================================== */}
        {filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 bg-secondary/10 py-16 text-center px-4">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-base font-semibold text-foreground">
              {hasActiveExerciseFilters
                ? "Brak zadań spełniających kryteria"
                : "Baza zadań jest pusta"}
            </p>
            <p className="text-sm text-muted-foreground mt-1.5 mb-6 max-w-sm">
              {hasActiveExerciseFilters
                ? "Zmień filtry lub wyczyść zapytanie w wyszukiwarce."
                : "Zbuduj własną bibliotekę zadań, dodając treść tekstową, zdjęcia z podręcznika lub pliki PDF."}
            </p>
            {!hasActiveExerciseFilters && (
              <Button
                onClick={handleNewExercise}
                className="shadow-sm rounded-xl h-11"
              >
                <Plus className="mr-2 h-4 w-4" /> Dodaj pierwsze zadanie
              </Button>
            )}
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

            {/* * Przycisk rozwijania listy zadań z 5 do wszystkich */}
            {filteredExercises.length > INITIAL_EXERCISES_LIMIT && (
              <div className="flex justify-center pt-2">
                <Button
                  variant="secondary"
                  className="rounded-full px-6 shadow-sm h-11"
                  onClick={() => setShowAllExercises(!showAllExercises)}
                >
                  {showAllExercises ? (
                    <>
                      Zwiń listę zadań
                      <ChevronUp className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Pokaż wszystkie zadania ({filteredExercises.length})
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
