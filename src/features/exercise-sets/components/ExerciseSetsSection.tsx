// ==========================================
// KOMPONENT: Sekcja zestawów zadań (lista + filtry)
// ==========================================
// * Wyniesione z ExercisesView: wyszukiwanie, sortowanie, filtr tagu i siatka kart.
// * Dane i mutacje dostarcza widok (props) — sekcja zarządza tylko stanem filtrów.

"use client";

import { useMemo, useState } from "react";
import type { DragEvent } from "react";
import { ArrowUpDown, Check, ChevronRight, Folder, FolderOpen, MoreVertical, Pencil, Plus, Search, SearchX, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useExerciseSetFolders } from "../hook";
import { ExerciseSetService } from "../service";
import { useTags } from "@/features/exercise-database/hook";
import type { ExerciseSetListItem, FolderDeletionPreview } from "../types";
import { toast } from "sonner";
import {
  compareByUpdatedAtDesc,
  smartSearch,
} from "@/features/exercise-database/utils";
import { getLabelEntries, getSetVisuals, isLabelKey } from "../utils";
import { ErrorState } from "@/components/ListStates";
import { ContentLoader } from "@/components/layout/ContentLoader";
import { ExerciseSetCard } from "./ExerciseSetCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteConfirmModal } from "@/components/DeleteConfirmModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ==========================================
// STAŁE: Sortowanie zestawów
// ==========================================

// * Ile kart widać przed kliknięciem „Pokaż wszystkie”
type SetsSort =
  | "date_desc"
  | "date_asc"
  | "count_desc"
  | "count_asc"
  | "alpha_asc"
  | "alpha_desc";

const DEFAULT_SETS_SORT: SetsSort = "date_desc";

const SET_SORT_LABELS: Record<SetsSort, string> = {
  date_desc: "Najnowsze najpierw",
  date_asc: "Najstarsze najpierw",
  count_desc: "Najwięcej zadań",
  count_asc: "Najmniej zadań",
  alpha_asc: "Alfabetycznie (A-Z)",
  alpha_desc: "Alfabetycznie (Z-A)",
};

const SET_SORT_COMPARATORS: Record<
  SetsSort,
  (a: ExerciseSetListItem, b: ExerciseSetListItem) => number
> = {
  date_desc: compareByUpdatedAtDesc,
  date_asc: (a, b) => a.updatedAt.getTime() - b.updatedAt.getTime(),
  count_desc: (a, b) => b.exerciseCount - a.exerciseCount,
  count_asc: (a, b) => a.exerciseCount - b.exerciseCount,
  alpha_asc: (a, b) => a.name.localeCompare(b.name, "pl"),
  alpha_desc: (a, b) => b.name.localeCompare(a.name, "pl"),
};

// ==========================================
// KOMPONENT
// ==========================================

interface ExerciseSetsSectionProps {
  readonly sets: readonly ExerciseSetListItem[];
  readonly isLoading: boolean;
  readonly error: string | null;
  readonly onRetry: () => void;
  readonly searchQuery: string;
  readonly onClearSearch: () => void;
  readonly onCreate: () => void;
  readonly onEdit: (id: string) => void;
  readonly onDuplicate: (id: string) => void;
  readonly onDelete: (id: string) => void;
  readonly onArchive: (id: string) => void;
  readonly onAssign: (id: string) => void;
  readonly onSetsChanged: () => void;
  readonly onMoveSet: (id: string, folderId: string | null) => Promise<boolean>;
}

export function ExerciseSetsSection({
  sets,
  isLoading,
  error,
  onRetry,
  searchQuery,
  onClearSearch,
  onCreate,
  onEdit,
  onDuplicate,
  onDelete,
  onArchive,
  onAssign,
  onSetsChanged,
  onMoveSet,
}: ExerciseSetsSectionProps) {
  const { tags } = useTags();
  const { folders, renameFolder, deleteFolder, isLoading: foldersLoading, error: foldersError, refetch: refetchFolders } = useExerciseSetFolders();

  const [sort, setSort] = useState<SetsSort>(DEFAULT_SETS_SORT);
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [tagQuery, setTagQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // * Filtrowanie (smartSearch: odporny na polskie znaki i końcówki) + sortowanie
  const filteredSets = useMemo(
    () =>
      sets
        .filter(
          (set) =>
            smartSearch(searchQuery, [set.name, set.description]) &&
            (tagFilter.length === 0 ||
              tagFilter.every((tagId) =>
                set.tags.some((tag) => tag.id === tagId),
              ))
        )
        .sort(SET_SORT_COMPARATORS[sort]),
    [sets, searchQuery, sort, tagFilter],
  );

  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  const [deletionPreview, setDeletionPreview] = useState<FolderDeletionPreview | null>(null);
  const [confirmProtected, setConfirmProtected] = useState(false);
  const [folderToRename, setFolderToRename] = useState<{ id: string; name: string } | null>(null);
  const [folderName, setFolderName] = useState("");

  const currentFolder = folders.find((folder) => folder.id === currentFolderId);
  const childFolders = folders.filter(
    (folder) => folder.parentId === currentFolderId,
  );
  const visibleSets = filteredSets.filter(
    (set) => set.folderId === currentFolderId,
  );
  const hasFilters = searchQuery.trim().length > 0 || tagFilter.length > 0;
  const hasSetsInFolder = sets.some((set) => set.folderId === currentFolderId);
  const showNoResults = hasFilters && hasSetsInFolder && visibleSets.length === 0;
  const breadcrumbs = currentFolder
    ? (() => {
        const path = [];
        let folder: typeof currentFolder | undefined = currentFolder;
        while (folder) {
          path.unshift(folder);
          folder = folders.find((candidate) => candidate.id === folder?.parentId);
        }
        return path;
      })()
    : [];
  const renderSets = (items: readonly ExerciseSetListItem[]) => (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {items.map((set) => (
        <ExerciseSetCard
          key={set.id}
          set={set}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onArchive={onArchive}
          onAssign={onAssign}
        />
      ))}
    </div>
  );
  const enterFolder = (id: string | null) => setCurrentFolderId(id);
  const dropSetIntoFolder = (event: DragEvent, folderId: string | null) => {
    event.preventDefault();
    const setId = event.dataTransfer.getData("text/exercise-set-id");
    if (setId) void onMoveSet(setId, folderId);
  };
  const openRenameFolder = (id: string, name: string) => {
    setFolderToRename({ id, name });
    setFolderName(name);
  };
  const openDeleteFolder = async (id: string) => {
    try {
      const preview = await ExerciseSetService.previewFolderDeletion(id);
      setDeletionPreview(preview);
      setConfirmProtected(false);
      setFolderToDelete(id);
    } catch (error) {
      console.error("Folder deletion preview error:", error);
      toast.error(error instanceof Error ? error.message : "Nie udało się sprawdzić zawartości folderu.");
    }
  };

  return (
    <section className="space-y-6">
      {/* FILTRY: wyszukiwarka, sortowanie, tag      */}
      {/* ========================================== */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="grid w-full gap-3 md:grid-cols-3">
        <TreeSelect
          items={folders}
          value={currentFolderId}
          onChange={enterFolder}
          placeholder="Wybierz folder"
          rootLabel="Mój dysk"
          icon={
            <Folder
              className="mr-2 h-4 w-4 shrink-0 text-foreground"
              aria-hidden="true"
            />
          }
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" style={{ backgroundColor: "white" }} className="h-11 w-full justify-start rounded-xl shadow-sm">
              <Search className="mr-2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {tagFilter.length === 0
                ? "Wszystkie tagi"
                : `${tagFilter.length} wybranych tagów`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="rounded-xl bg-white p-2 shadow-sm xl:w-64" style={{ backgroundColor: "white" }}>
            <Input
              aria-label="Szukaj tagu"
              placeholder="Wpisz nazwę tagu..."
              value={tagQuery}
              onChange={(event) => setTagQuery(event.target.value)}
              className="mb-1 h-10 rounded-xl bg-white"
            />
            <div className="max-h-60 overflow-y-auto">
              <Button type="button" variant="ghost" size="sm" className="h-9 w-full justify-start rounded-xl px-2 text-left" onClick={() => setTagFilter([])}>
                {tagFilter.length === 0 && <Check className="mr-2 h-4 w-4" aria-hidden="true" />}
                Wszystkie tagi
              </Button>
              {tags.filter((tag) => smartSearch(tagQuery, [tag.name])).map((tag) => (
                <Button type="button" variant="ghost" size="sm" key={tag.id} className="h-9 w-full justify-start rounded-xl px-2 text-left" onClick={() => setTagFilter((previous) => previous.includes(tag.id) ? previous.filter((id) => id !== tag.id) : [...previous, tag.id])}>
                  {tagFilter.includes(tag.id) && <Check className="mr-2 h-4 w-4" aria-hidden="true" />}
                  {tag.name}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Select
          value={sort}
          onValueChange={(value) => {
            if (isLabelKey(SET_SORT_LABELS, value)) setSort(value);
          }}
        >
          <SelectTrigger
            className="h-11 w-full rounded-xl bg-card"
            aria-label="Sortuj zestawy"
          >
            <ArrowUpDown
              className="mr-2 h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
            <SelectValue placeholder="Sortuj" />
          </SelectTrigger>
          <SelectContent>
            {getLabelEntries(SET_SORT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      </div>

      {/* ========================================== */}
      {/* LISTA KART (błąd / pusto / siatka)         */}
      {/* ========================================== */}
      {(isLoading && sets.length === 0) || foldersLoading ? (
        <ContentLoader minHeight="h-100" />
      ) : foldersError ? (
        <ErrorState message={foldersError} onRetry={refetchFolders} />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : (
        <div className="space-y-6">
          <nav aria-label="Ścieżka folderu" className="flex flex-wrap items-center gap-1 text-sm">
            <button
              type="button"
              className="cursor-pointer font-semibold text-primary hover:underline"
              onClick={() => enterFolder(null)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }}
              onDrop={(event) => dropSetIntoFolder(event, null)}
            >
              Mój dysk
            </button>
            {breadcrumbs.map((folder) => (
              <span
                key={folder.id}
                className="flex cursor-pointer items-center gap-1 rounded-md px-1 hover:bg-muted"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => dropSetIntoFolder(event, folder.id)}
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <button type="button" className={`cursor-pointer ${folder.id === currentFolderId ? "font-semibold text-foreground" : "text-primary hover:underline"}`} onClick={() => enterFolder(folder.id)}>
                  {folder.name}
                </button>
              </span>
            ))}
          </nav>

          {childFolders.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {childFolders.map((folder) => (
              <button
                type="button"
                key={folder.id}
                onClick={() => enterFolder(folder.id)}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                }}
                onDrop={(event) => dropSetIntoFolder(event, folder.id)}
                className={`group relative flex min-h-14 cursor-pointer items-center gap-3 overflow-hidden rounded-xl border border-border/60 bg-card px-3 text-left shadow-sm transition-all ${getSetVisuals(folder.id).hoverBorder} hover:shadow-md`}
              >
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-100 ${getSetVisuals(folder.id).glow}`}
                  aria-hidden="true"
                />
                <Folder className={`relative z-10 h-6 w-6 shrink-0 fill-current ${getSetVisuals(folder.id).accentText}`} aria-hidden="true" />
                <span className="relative z-10 min-w-0 truncate font-semibold text-foreground">{folder.name}</span>
                <span className="relative z-20 ml-auto" onClick={(event) => event.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <MoreVertical className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openRenameFolder(folder.id, folder.name)}>
                        <Pencil className="mr-2 h-4 w-4" aria-hidden="true" /> Zmień nazwę
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => void openDeleteFolder(folder.id)}>
                        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> Usuń folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </span>
              </button>
            ))}
          </div>
          )}
          {visibleSets.length > 0 && renderSets(visibleSets)}
          {showNoResults ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/60 bg-card px-6 py-16 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
                <SearchX className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Brak zestawów spełniających kryteria</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Spróbuj zmienić wyszukiwanie lub wybrane tagi, aby znaleźć zestaw.
              </p>
              <Button type="button" variant="outline" className="mt-6 h-11 rounded-xl" onClick={() => {
                onClearSearch();
                setTagFilter([]);
              }}>
                Wyczyść filtry
              </Button>
            </div>
          ) : childFolders.length === 0 && visibleSets.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-border/60 bg-card px-6 py-16 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <FolderOpen className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {currentFolderId ? "Ten folder jest pusty" : "Stwórz swój pierwszy zestaw"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Zbierz zadania w zestaw, uporządkuj je i miej materiały zawsze pod ręką.
              </p>
              <Button type="button" className="mt-6 h-11 rounded-xl font-semibold" onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Utwórz zestaw
              </Button>
            </div>
          ) : null}
        </div>
      )}
      <DeleteConfirmModal
        open={folderToDelete !== null}
        title={confirmProtected ? "Zestawy przypisane do prac domowych" : "Usuń folder"}
        description={confirmProtected ? (
          <>Foldery i pozostałe zestawy zostaną usunięte. Przypisane zestawy zostaną przeniesione poziom wyżej:
            {deletionPreview?.protectedSets.map((set) => <span className="block" key={set.id}>{set.folderPath.join(" › ")}: {set.name}</span>)}
          </>
        ) : (
          <>Folder i wszystkie podfoldery zostaną usunięte. Usunięte zestawy:
            {deletionPreview?.deletedSets.length ? deletionPreview.deletedSets.map((set) => <span className="block" key={set.id}>{set.folderPath.join(" › ")}: {set.name}</span>) : " brak."}
          </>
        )}
        isDeleting={isDeletingFolder}
        onClose={() => { setFolderToDelete(null); setDeletionPreview(null); }}
        onConfirm={() => {
          if (!folderToDelete || !deletionPreview) return;
          if (deletionPreview.protectedSets.length && !confirmProtected) {
            setConfirmProtected(true);
            return;
          }
          setIsDeletingFolder(true);
          void deleteFolder(folderToDelete, deletionPreview.fingerprint).then((deleted) => {
            if (deleted) {
              setFolderToDelete(null);
              setCurrentFolderId(null);
              onSetsChanged();
            } else {
              setFolderToDelete(null);
              setDeletionPreview(null);
            }
            setIsDeletingFolder(false);
          });
        }}
      />
      <Dialog
        open={folderToRename !== null}
        onOpenChange={(open) => {
          if (!open) setFolderToRename(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień nazwę folderu</DialogTitle>
            <DialogDescription>Wpisz nową nazwę folderu.</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            aria-label="Nowa nazwa folderu"
            value={folderName}
            onChange={(event) => setFolderName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && folderToRename) {
                event.preventDefault();
                void renameFolder(folderToRename.id, folderName).then((folder) => {
                  if (folder) setFolderToRename(null);
                });
              }
            }}
          />
          <DialogFooter showCloseButton>
            <Button
              type="button"
              onClick={() => {
                if (!folderToRename) return;
                void renameFolder(folderToRename.id, folderName).then((folder) => {
                  if (folder) setFolderToRename(null);
                });
              }}
            >
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
