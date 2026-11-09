// ==========================================
// WIDOK: Kreator zestawów zadań
// ==========================================
// * Układ pionowy: baza zadań (góra, wspólny ExerciseBrowser), ustawienia zestawu (środek),
// * wybrane zadania (dół: Lista / Podgląd).
// * Struktura: ExerciseSetBuilderView (routing: nowy vs edycja)
// *   → ExerciseSetBuilderEditLoader (ładuje zestaw) → ExerciseSetBuilderForm (formularz).
// * Formularz montuje się dopiero z gotowymi defaultValues, więc nie ma form.reset() w efekcie.

"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Eye,
  FolderOpen,
  GripVertical,
  List,
  Loader2,
  Plus,
  Save,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TreeSelect,
} from "@/components/ui/tree-select";
import { ContentLoader } from "@/components/layout/ContentLoader";
import { cn } from "@/lib/utils";

import { ExerciseBrowser } from "@/features/exercise-database/components/ExerciseBrowser";
import { ExerciseContentRenderer } from "@/features/exercise-database/components/ExerciseContentRenderer";
import { ExerciseFormModal } from "@/features/exercise-database/components/ExerciseFormModal";
import { ErrorState } from "@/components/ListStates";
import {
  useCategoriesTree,
  useExerciseDetailsMap,
  useExercisesList,
} from "@/features/exercise-database/hook";
import { useExerciseSetDetail, useExerciseSetFolders } from "../hook";
import { exerciseSetFormSchema, type ExerciseSetFormData } from "../schema";
import { ExerciseSetService } from "../service";
import type { Exercise, ExerciseListItem } from "@/features/exercise-database/types";
import { ExerciseDetailModal } from "@/features/exercise-database/views/ExerciseDetailView";

// ==========================================
// STAŁE
// ==========================================

const EMPTY_SET_FORM: ExerciseSetFormData = {
  name: "",
  description: "",
  folderId: null,
  items: [],
};

// * Tryby widoku wybranych zadań (przełącznik segmentowy)
const VIEW_MODES: readonly {
  readonly id: "list" | "preview";
  readonly label: string;
  readonly icon: LucideIcon;
}[] = [
  { id: "list", label: "Lista", icon: List },
  { id: "preview", label: "Podgląd", icon: Eye },
];

type ViewMode = (typeof VIEW_MODES)[number]["id"];
const isViewMode = (value: string): value is ViewMode =>
  VIEW_MODES.some((mode) => mode.id === value);

// ==========================================
// KOMPONENT: Akcje elementu zestawu (góra / dół / usuń)
// ==========================================
// * Jedna implementacja dla widoku Lista (przyciski obrysowane) i Podgląd (nakładka w rogu).

interface ItemActionsProps {
  readonly variant: "list" | "overlay";
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onRemove: () => void;
}

function ItemActions({
  variant,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
}: ItemActionsProps) {
  const isOverlay = variant === "overlay";
  const sizeClass = isOverlay ? "h-8 w-8" : "h-10 w-10";

  return (
    <div
      className={cn(
        "flex items-center",
        isOverlay
          ? "absolute right-4 top-4 z-10 gap-1 rounded-xl border border-border/50 bg-background/90 p-1 opacity-70 shadow-sm backdrop-blur-sm transition-opacity focus-within:opacity-100 group-hover:opacity-100"
          : "shrink-0 gap-1.5 self-end sm:self-auto",
      )}
    >
      <Button
        type="button"
        variant={isOverlay ? "ghost" : "outline"}
        size="icon"
        disabled={isFirst}
        onClick={onMoveUp}
        aria-label="Przesuń wyżej"
        className={cn(sizeClass,         "rounded-xl text-muted-foreground")}
      >
        <ArrowUp className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant={isOverlay ? "ghost" : "outline"}
        size="icon"
        disabled={isLast}
        onClick={onMoveDown}
        aria-label="Przesuń niżej"
        className={cn(sizeClass,         "rounded-xl text-muted-foreground")}
      >
        <ArrowDown className="h-4 w-4" aria-hidden="true" />
      </Button>
      <div
        className={cn("mx-1 w-px bg-border/50", isOverlay ? "h-4" : "h-6")}
        aria-hidden="true"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        aria-label="Usuń z zestawu"
        className={cn(
          sizeClass,
          "rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive",
        )}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

// ==========================================
// KOMPONENT: Zadanie w widoku „Podgląd”
// ==========================================
// * Treść pochodzi z cache'u useExerciseDetailsMap (jedno równoległe pobranie dla całego zestawu).

interface SetPreviewItemProps extends Omit<ItemActionsProps, "variant"> {
  readonly exercise: Exercise | undefined;
  readonly isFailed: boolean;
}

function SetPreviewItem({
  exercise,
  isFailed,
  ...actions
}: SetPreviewItemProps) {
  return (
    <div className="group relative rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-colors hover:border-border">
      <ItemActions variant="overlay" {...actions} />

      {/* * Pełna treść zadania bez dodatkowych nagłówków */}
      <div className="min-h-25 pt-2">
        {exercise ? (
          <ExerciseContentRenderer blocks={exercise.content} />
        ) : isFailed ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            Nie udało się wczytać treści zadania.
          </p>
        ) : (
          <ContentLoader minHeight="min-h-20" />
        )}
      </div>
    </div>
  );
}

// ==========================================
// KOMPONENT: Formularz kreatora
// ==========================================

interface ExerciseSetBuilderFormProps {
  readonly setId?: string;
  readonly initialValues?: ExerciseSetFormData;
}

function ExerciseSetBuilderForm({
  setId,
  initialValues,
}: ExerciseSetBuilderFormProps) {
  const router = useRouter();
  const isEditMode = setId !== undefined;

  // ----- Dane: baza zadań i drzewo działów -----
  const {
    items: allExercises,
    isLoading: exercisesLoading,
    error: exercisesError,
    refetch: refetchExercises,
  } = useExercisesList();
  const { tree: categoriesTree } = useCategoriesTree();
  const { folders, createFolder } = useExerciseSetFolders();

  // ----- Stan UI -----
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [previewExerciseId, setPreviewExerciseId] = useState<string | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  // ----- Formularz zestawu (react-hook-form + Zod) -----
  const form = useForm<ExerciseSetFormData>({
    resolver: zodResolver(exerciseSetFormSchema),
    defaultValues: initialValues ?? EMPTY_SET_FORM,
  });
  const selectedFolderId = useWatch({
    control: form.control,
    name: "folderId",
  });
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // ----- Wartości pochodne (useMemo, nie efekty) -----

  // * ID zadań już w zestawie — wykluczane z przeglądarki (stabilna referencja dla useMemo w dziecku)
  const usedExerciseIds = useMemo(
    () => new Set(fields.map((field) => field.exercise_id)),
    [fields],
  );
  const selectedIds = useMemo(
    () => fields.map((field) => field.exercise_id),
    [fields],
  );
  // * Indeks lista-zadań po ID (tytuły w widoku Lista bez find() w pętli)
  const exercisesById = useMemo(
    () =>
      new Map<string, ExerciseListItem>(
        allExercises.map((exercise): [string, ExerciseListItem] => [
          exercise.id,
          exercise,
        ]),
      ),
    [allExercises],
  );

  // * Pełne treści zadań pobierane tylko w trybie „Podgląd”
  const { details, failedIds } = useExerciseDetailsMap(
    selectedIds,
    viewMode === "preview",
  );

  // * Błąd poziomu tablicy (np. pusty zestaw). RHF zapisuje go pod `.root` lub `.message`.
  const itemsError = form.formState.errors.items;
  const itemsErrorMessage = itemsError?.root?.message ?? itemsError?.message;

  // ----- Handlery -----

  const handleAddExercise = (exerciseId: string) => {
    append({ exercise_id: exerciseId, position: fields.length });
    toast.success("Zadanie dodane do zestawu");
  };

  // * Zapis zestawu. Pozycje przelicza serwis (0..n-1), a „min. 1 zadanie” pilnuje schemat.
  const onSubmit = async (data: ExerciseSetFormData) => {
    try {
      if (setId) {
        await ExerciseSetService.update(setId, data);
        toast.success("Zestaw został zaktualizowany.");
      } else {
        await ExerciseSetService.create(data);
        toast.success("Nowy zestaw został utworzony.");
      }
      router.push("/exercise-sets");
      router.refresh();
    } catch (err) {
      console.error("Save exercise set error:", err);
      toast.error(
        err instanceof Error
          ? err.message
          : "Wystąpił błąd podczas zapisywania zestawu.",
      );
    }
  };

  // * Pełny loader tylko przy pierwszym ładowaniu bazy (refetch po dodaniu zadania go nie wywołuje)
  if (exercisesLoading && allExercises.length === 0) {
    return (
      <div className="space-y-12 pb-16">
        <ContentLoader minHeight="min-h-125" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* ========================================== */}
      {/* NAGŁÓWEK                                   */}
      {/* ========================================== */}
      {/* * „Zapisz” to zwykły przycisk (bez <form>), żeby Enter w wyszukiwarce */}
      {/* * ExerciseBrowser nie zatwierdzał całego zestawu. */}
      <div className="flex flex-col items-start justify-between gap-4 border-b border-border/50 pb-5 sm:flex-row sm:items-center">
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/exercise-sets")}
            className="-ml-3 h-11 rounded-xl text-muted-foreground hover:text-foreground sm:ml-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Wróć do bazy
          </Button>
          <div
            className="hidden h-6 w-px bg-border/60 sm:block"
            aria-hidden="true"
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isEditMode ? "Edycja zestawu zadań" : "Kreator zestawu zadań"}
          </h1>
        </div>

        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={form.formState.isSubmitting}
          className="h-11 w-full rounded-xl px-8 font-semibold shadow-sm sm:w-auto"
        >
          {form.formState.isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          )}
          Zapisz zestaw
        </Button>
      </div>

      {/* ========================================== */}
      {/* SEKCJA 1: USTAWIENIA ZESTAWU               */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" aria-hidden="true" />
          <h2 className="text-2xl font-bold text-foreground">
            Ustawienia zestawu
          </h2>
        </div>

        <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* * Nazwa zestawu (wymagana) */}
            <div className="space-y-2">
              <Label
                htmlFor="setName"
                className="text-sm font-semibold text-foreground/80"
              >
                Nazwa zestawu <span className="text-destructive">*</span>
              </Label>
              <Input
                id="setName"
                placeholder="np. Powtórka przed sprawdzianem - Funkcje"
                aria-invalid={Boolean(form.formState.errors.name)}
                className="h-11 rounded-xl bg-background shadow-sm"
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            {/* * Opis zestawu (prywatna notatka korepetytora) */}
            <div className="space-y-2">
              <Label
                htmlFor="setDesc"
                className="flex items-baseline gap-2 text-sm font-semibold text-foreground/80"
              >
                Opis zestawu
                <span className="text-xs font-normal text-muted-foreground">
                  (tylko dla Ciebie)
                </span>
              </Label>
              <Textarea
                id="setDesc"
                placeholder="Wpisz swoje uwagi, notatki (np. klasa, poziom trudności)..."
                aria-invalid={Boolean(form.formState.errors.description)}
                className="h-11 min-h-11 resize-y rounded-xl bg-background py-2.5 text-sm shadow-sm"
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <p className="mt-1 text-xs font-medium text-destructive">
                  {form.formState.errors.description.message}
                </p>
              )}
            </div>

            {/* * Folder zestawu: rozwijane drzewo zachowuje pełną ścieżkę podfolderów. */}
            <div className="space-y-2">
              <Label htmlFor="setFolder" className="text-sm font-semibold text-foreground/80">
                Folder zestawu
              </Label>
              <TreeSelect
                id="setFolder"
                items={folders}
                value={selectedFolderId}
                onChange={(value) =>
                  form.setValue("folderId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                placeholder="Bez folderu"
                rootLabel="Bez folderu"
                icon={
                  <FolderOpen
                    className="mr-2 h-4 w-4 shrink-0 text-foreground"
                    aria-hidden="true"
                  />
                }
                showFullPath
                className="bg-white text-left shadow-sm"
              />
            </div>
            <div className="space-y-2">
                <Label
                  htmlFor="newSetFolder"
                  className="text-sm font-semibold text-foreground/80"
                >
                  Dodaj folder lub podfolder w wybranym folderze
                </Label>
                <div className="flex gap-2">
                <Input
                  id="newSetFolder"
                  aria-label="Nazwa nowego folderu"
                  placeholder="Nowy folder lub podfolder"
                  className="h-11 rounded-xl bg-background"
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => {
                    void createFolder(newFolderName, form.getValues("folderId")).then(
                      (folder) => {
                        if (folder) {
                          setNewFolderName("");
                          form.setValue("folderId", folder.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      },
                    );
                  }}
                >
                  Dodaj folder
                </Button>
                </div>
              </div>
          </div>
        </div>
      </section>

      <div className="h-px w-full bg-border/50" aria-hidden="true" />

      {/* ========================================== */}
      {/* SEKCJA 2: BAZA ZADAŃ (wspólny ExerciseBrowser) */}
      {/* ========================================== */}
      {exercisesError ? (
        <ErrorState message={exercisesError} onRetry={refetchExercises} />
      ) : (
        <ExerciseBrowser
          exercises={allExercises}
          categoriesTree={categoriesTree}
          excludedExerciseIds={usedExerciseIds}
          listMode="scrollable"
          emptyMessage="Brak dostępnych zadań"
          onAdd={handleAddExercise}
          onView={setPreviewExerciseId}
          sectionTitle="Zadania do wyboru"
          filterAction={
            <Button
              type="button"
              className="h-11 w-full rounded-xl font-semibold shadow-sm sm:w-auto"
              onClick={() => setIsExerciseModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden="true" /> Dodaj zadanie
            </Button>
          }
        />
      )}

      <div className="h-px w-full bg-border/50" aria-hidden="true" />

      {/* ========================================== */}
      {/* SEKCJA 3: WYBRANE ZADANIA                  */}
      {/* ========================================== */}
      <section className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
            <h2 className="text-2xl font-bold text-foreground">
              Zadania w zestawie ({fields.length})
            </h2>
          </div>

          {/* * Przełącznik widoku: Lista / Podgląd (komponent Tabs z design systemu) */}
          <Tabs
            value={viewMode}
            onValueChange={(value) => {
              if (isViewMode(value)) setViewMode(value);
            }}
          >
            <TabsList
              className="flex h-11 w-auto rounded-full"
              aria-label="Widok wybranych zadań"
            >
              {VIEW_MODES.map((mode) => (
                <TabsTrigger
                  key={mode.id}
                  value={mode.id}
                  className="rounded-full px-5"
                >
                  <span className="inline-flex items-center gap-2">
                    <mode.icon
                      className="h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    {mode.label}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* * Błąd walidacji tablicy (np. próba zapisu pustego zestawu) */}
        {itemsErrorMessage && (
          <p role="alert" className="text-sm font-semibold text-destructive">
            {itemsErrorMessage}
          </p>
        )}

        {fields.length === 0 ? (
          // * Stan pusty zestawu
          <div
            className={cn(
              "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-muted/5 py-24 text-center",
              itemsErrorMessage ? "border-destructive/60" : "border-border/60",
            )}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-foreground">
              Twój zestaw jest pusty
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Wyszukaj zadania u góry ekranu i dodaj je do tego zestawu.
            </p>
          </div>
        ) : viewMode === "list" ? (
          // ----- Widok: LISTA (numer + tytuł + akcje) -----
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  if (draggedIndex !== null && draggedIndex !== index) move(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                onDragEnd={() => setDraggedIndex(null)}
                className="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground" aria-label="Przeciągnij, aby zmienić kolejność" />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                    {index + 1}
                  </div>
                  <h4 className="min-w-0 flex-1 truncate font-semibold text-foreground">
                    {exercisesById.get(field.exercise_id)?.title ??
                      "Zadanie niedostępne"}
                  </h4>
                </div>
                <ItemActions
                  variant="list"
                  isFirst={index === 0}
                  isLast={index === fields.length - 1}
                  onMoveUp={() => move(index, index - 1)}
                  onMoveDown={() => move(index, index + 1)}
                  onRemove={() => remove(index)}
                />
              </div>
            ))}
          </div>
        ) : (
          // ----- Widok: PODGLĄD (pełna treść zadań) -----
          <div className="space-y-6 overflow-hidden rounded-2xl border border-border/40 bg-card p-1 shadow-sm sm:p-6">
            {fields.map((field, index) => (
              <SetPreviewItem
                key={field.id}
                exercise={details.get(field.exercise_id)}
                isFailed={failedIds.has(field.exercise_id)}
                isFirst={index === 0}
                isLast={index === fields.length - 1}
                onMoveUp={() => move(index, index - 1)}
                onMoveDown={() => move(index, index + 1)}
                onRemove={() => remove(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* * Drugi zapis jest dostępny po przejściu przez wszystkie sekcje formularza. */}
      <div className="flex justify-end border-t border-border/50 pt-5">
        <Button
          type="button"
          onClick={form.handleSubmit(onSubmit)}
          disabled={form.formState.isSubmitting}
          className="h-11 rounded-xl px-8 font-semibold shadow-sm"
        >
          <Save className="mr-2 h-4 w-4" aria-hidden="true" />
          Zapisz zestaw
        </Button>
      </div>

      {/* ========================================== */}
      {/* MODALE                                     */}
      {/* ========================================== */}
      {/* * Dodawanie nowego zadania prosto z kreatora (po zapisie odświeżamy bazę) */}
      <ExerciseFormModal
        open={isExerciseModalOpen}
        onOpenChange={setIsExerciseModalOpen}
        onSuccess={refetchExercises}
      />

      {/* * Podgląd zadania z listy bazy (bez opuszczania kreatora) */}
      <ExerciseDetailModal
        exerciseId={previewExerciseId}
        onOpenChange={(open) => {
          if (!open) setPreviewExerciseId(null);
        }}
        onUpdated={refetchExercises}
        onDeleted={(deletedId) => {
          // * Usunięte zadanie znika też z zestawu w budowie (inaczej: „Zadanie niedostępne”)
          const index = fields.findIndex(
            (field) => field.exercise_id === deletedId,
          );
          if (index >= 0) remove(index);
          refetchExercises();
        }}
      />
    </div>
  );
}

// ==========================================
// KOMPONENT: Loader zestawu do edycji
// ==========================================
// * Pobiera zestaw i dopiero z nim montuje formularz (defaultValues zamiast form.reset()).

function ExerciseSetBuilderEditLoader({ setId }: { readonly setId: string }) {
  const router = useRouter();
  const { detail, isLoading, error, refetch } = useExerciseSetDetail(setId);

  // * Brak zestawu po zakończeniu ładowania → powrót do bazy (stałe `id` chroni przed dublem toastu)
  useEffect(() => {
    if (isLoading || detail || error) return;
    toast.error("Nie znaleziono zestawu", { id: "exercise-set-not-found" });
    router.push("/exercise-sets");
  }, [isLoading, detail, error, router]);

  if (isLoading) {
    return (
      <div className="space-y-12 pb-16">
        <ContentLoader minHeight="min-h-125" />
      </div>
    );
  }

  // * Błąd ładowania: NIE pokazujemy pustego formularza edycji (zapis nadpisałby zestaw)
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!detail) return null;

  return (
    <ExerciseSetBuilderForm
      key={setId}
      setId={setId}
      initialValues={{
        name: detail.name,
        description: detail.description ?? "",
        items: detail.exercises.map((exercise, index) => ({
          exercise_id: exercise.id,
          position: index,
        })),
        folderId: detail.folderId,
      }}
    />
  );
}

// ==========================================
// WIDOK GŁÓWNY: nowy zestaw albo edycja (po ID z propsa lub z trasy)
// ==========================================

export function ExerciseSetBuilderView({
  setId: propSetId,
}: {
  readonly setId?: string;
}) {
  const params = useParams();
  // * Parametr trasy bywa string | string[] — przyjmujemy tylko pojedynczy string
  const routeId = params?.id;
  const setId =
    propSetId ?? (typeof routeId === "string" ? routeId : undefined);

  return setId ? (
    <ExerciseSetBuilderEditLoader setId={setId} />
  ) : (
    <ExerciseSetBuilderForm />
  );
}
