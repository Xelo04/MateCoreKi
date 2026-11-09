// ==========================================
// SERWIS: Zestawy zadań
// ==========================================
// * Feature zestawów posiada własne odczyty, mutacje i mapowanie DTO.
// * Pojedyncze zadania są odczytywane przez publiczny serwis exercise-database.

import { ExerciseService } from "@/features/exercise-database/service";
import { getPreviewTags } from "@/features/exercise-database/utils";
import type {
  ApiExerciseSet,
  ExerciseSet,
  ExerciseSetDetail,
  ExerciseSetFolder,
  ExerciseSetListItem,
} from "./types";
import type { ExerciseSetFormData } from "./schema";

export type ExerciseSetServiceErrorCode = "NOT_FOUND" | "VALIDATION";

export class ExerciseSetServiceError extends Error {
  readonly code: ExerciseSetServiceErrorCode;

  constructor(code: ExerciseSetServiceErrorCode, message: string) {
    super(message);
    this.name = "ExerciseSetServiceError";
    this.code = code;
  }
}

const MOCK_LATENCY_MS = {
  short: 300,
  medium: 400,
  write: 500,
} as const;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let mockIdSequence = 0;
const createMockId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${++mockIdSequence}`;

const mockFolders: ExerciseSetFolder[] = [
  { id: "folder-school", name: "Szkoła", parentId: null },
  {
    id: "folder-school-primary",
    name: "Szkoła podstawowa",
    parentId: "folder-school",
  },
  { id: "folder-school-high", name: "Liceum", parentId: "folder-school" },
];

let mockSets: ApiExerciseSet[] = [
  {
    id: "set-1",
    name: "Sprawdzian - równania i nierówności",
    description: "Sprawdzian dla klasy 2 LO",
    folder_id: "folder-school-high",
    exercise_items: [
      { exercise_id: "ex-1", position: 0 },
      { exercise_id: "ex-2", position: 1 },
    ],
    created_at: "2025-06-10T12:00:00Z",
    updated_at: "2025-06-10T12:00:00Z",
  },
  {
    id: "set-2",
    name: "Równania liniowe - ćwiczenia",
    description: "Powtórka przed sprawdzianem dla klasy 1 LO",
    folder_id: "folder-school-high",
    exercise_items: [
      { exercise_id: "ex-1", position: 0 },
      { exercise_id: "ex-3", position: 1 },
    ],
    created_at: "2025-06-12T10:00:00Z",
    updated_at: "2025-06-12T10:00:00Z",
  },
  {
    id: "set-3",
    name: "Potęgi i pierwiastki",
    description: "Zestaw utrwalający podstawowe rachunki",
    folder_id: "folder-school-primary",
    exercise_items: [{ exercise_id: "ex-2", position: 0 }],
    created_at: "2025-06-08T09:00:00Z",
    updated_at: "2025-06-08T09:00:00Z",
  },
  {
    id: "set-4",
    name: "Geometria - pola figur",
    description: "Materiały do pracy z klasą 7",
    folder_id: "folder-school-primary",
    exercise_items: [
      { exercise_id: "ex-2", position: 0 },
      { exercise_id: "ex-3", position: 1 },
    ],
    created_at: "2025-06-07T08:00:00Z",
    updated_at: "2025-06-07T08:00:00Z",
  },
  {
    id: "set-5",
    name: "Kartkówka na start",
    description: "Krótka diagnoza poziomu grupy",
    folder_id: null,
    exercise_items: [{ exercise_id: "ex-1", position: 0 }],
    created_at: "2025-06-05T07:00:00Z",
    updated_at: "2025-06-05T07:00:00Z",
  },
  {
    id: "set-6",
    name: "Zadania domowe - tydzień 1",
    description: "Zestaw do samodzielnej pracy ucznia",
    folder_id: null,
    exercise_items: [
      { exercise_id: "ex-1", position: 0 },
      { exercise_id: "ex-2", position: 1 },
    ],
    created_at: "2025-06-04T07:00:00Z",
    updated_at: "2025-06-04T07:00:00Z",
  },
];

const sortItems = (items: ApiExerciseSet["exercise_items"]) =>
  [...items].sort((a, b) => a.position - b.position);

const findSetOrThrow = (id: string): ApiExerciseSet => {
  const set = mockSets.find((candidate) => candidate.id === id);
  if (!set) {
    throw new ExerciseSetServiceError("NOT_FOUND", `Zestaw ${id} nie istnieje`);
  }
  return set;
};

const mapSet = (api: ApiExerciseSet): ExerciseSet => ({
  id: api.id,
  name: api.name,
  description: api.description,
  folderId: api.folder_id,
  exerciseIds: sortItems(api.exercise_items).map((item) => item.exercise_id),
  createdAt: new Date(api.created_at),
  updatedAt: new Date(api.updated_at),
});

const mapItems = async (
  items: ExerciseSetFormData["items"],
): Promise<ApiExerciseSet["exercise_items"]> => {
  const mapped = [];
  for (const [position, item] of items.entries()) {
    const exercise = await ExerciseService.getExercise(item.exercise_id);
    if (!exercise) {
      throw new ExerciseSetServiceError(
        "NOT_FOUND",
        `Zadanie ${item.exercise_id} nie istnieje`,
      );
    }
    mapped.push({ exercise_id: item.exercise_id, position });
  }
  return mapped;
};

const mapListItem = async (
  api: ApiExerciseSet,
): Promise<ExerciseSetListItem> => {
  const exercises = await Promise.all(
    sortItems(api.exercise_items).map((item) =>
      ExerciseService.getExercise(item.exercise_id),
    ),
  );
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    folderId: api.folder_id,
    exerciseCount: api.exercise_items.length,
    previewTags: getPreviewTags(
      exercises.filter((exercise) => exercise !== null).map((exercise) => exercise.tags),
    ),
    updatedAt: new Date(api.updated_at),
  };
};

export const ExerciseSetService = {
  // * Pobiera listę zestawów z liczbą zadań i tagami podglądowymi.
  // TODO: [BACKEND] GET /api/v1/exercises/sets
  async getList(): Promise<ExerciseSetListItem[]> {
    await delay(MOCK_LATENCY_MS.medium);
    const items = await Promise.all(mockSets.map(mapListItem));
    return items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  // * Pobiera szczegóły zestawu i zadania w zapisanej kolejności.
  // TODO: [BACKEND] GET /api/v1/exercises/sets/:id
  async getDetail(id: string): Promise<ExerciseSetDetail | null> {
    await delay(MOCK_LATENCY_MS.medium);
    const set = mockSets.find((candidate) => candidate.id === id);
    if (!set) return null;
    const exercises = await Promise.all(
      sortItems(set.exercise_items).map((item) =>
        ExerciseService.getExercise(item.exercise_id),
      ),
    );
    return { ...mapSet(set), exercises: exercises.filter((exercise) => exercise !== null) };
  },

  // * Pobiera foldery i podfoldery zestawów.
  // TODO: [BACKEND] GET /api/v1/exercises/set-folders
  async getFolders(): Promise<ExerciseSetFolder[]> {
    await delay(MOCK_LATENCY_MS.short);
    return mockFolders.map((folder) => ({ ...folder }));
  },

  // * Tworzy folder główny albo podfolder.
  // TODO: [BACKEND] POST /api/v1/exercises/set-folders
  async createFolder(
    name: string,
    parentId: string | null,
  ): Promise<ExerciseSetFolder> {
    await delay(MOCK_LATENCY_MS.short);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ExerciseSetServiceError("VALIDATION", "Nazwa folderu nie może być pusta");
    }
    if (parentId && !mockFolders.some((folder) => folder.id === parentId)) {
      throw new ExerciseSetServiceError("NOT_FOUND", "Folder nadrzędny nie istnieje");
    }
    const folder = { id: createMockId("folder"), name: trimmed, parentId };
    mockFolders.push(folder);
    return { ...folder };
  },

  async renameFolder(id: string, name: string): Promise<ExerciseSetFolder> {
    await delay(MOCK_LATENCY_MS.short);
    const trimmed = name.trim();
    if (!trimmed) {
      throw new ExerciseSetServiceError("VALIDATION", "Nazwa folderu nie może być pusta");
    }
    const folder = mockFolders.find((candidate) => candidate.id === id);
    if (!folder) {
      throw new ExerciseSetServiceError("NOT_FOUND", "Folder nie istnieje");
    }
    folder.name = trimmed;
    return { ...folder };
  },

  async removeFolder(id: string): Promise<void> {
    await delay(MOCK_LATENCY_MS.medium);
    if (!mockFolders.some((folder) => folder.id === id)) {
      throw new ExerciseSetServiceError("NOT_FOUND", "Folder nie istnieje");
    }
    const ids = new Set([id]);
    let changed = true;
    while (changed) {
      changed = false;
      mockFolders.forEach((folder) => {
        if (folder.parentId && ids.has(folder.parentId) && !ids.has(folder.id)) {
          ids.add(folder.id);
          changed = true;
        }
      });
    }
    mockFolders.splice(0, mockFolders.length, ...mockFolders.filter((folder) => !ids.has(folder.id)));
    mockSets = mockSets.filter((set) => !set.folder_id || !ids.has(set.folder_id));
  },

  // * Tworzy zestaw z przeliczoną pozycją elementów.
  // TODO: [BACKEND] POST /api/v1/exercises/sets
  async create(form: ExerciseSetFormData): Promise<ExerciseSet> {
    await delay(MOCK_LATENCY_MS.write);
    const now = new Date().toISOString();
    const created: ApiExerciseSet = {
      id: createMockId("set"),
      name: form.name,
      description: form.description || null,
      folder_id: form.folderId,
      exercise_items: await mapItems(form.items),
      created_at: now,
      updated_at: now,
    };
    mockSets = [...mockSets, created];
    return mapSet(created);
  },

  // * Aktualizuje nazwę, opis, folder i kolejność zadań.
  // TODO: [BACKEND] PUT /api/v1/exercises/sets/:id
  async update(id: string, form: ExerciseSetFormData): Promise<ExerciseSet> {
    await delay(MOCK_LATENCY_MS.write);
    const existing = findSetOrThrow(id);
    const updated = {
      ...existing,
      name: form.name,
      description: form.description || null,
      folder_id: form.folderId,
      exercise_items: await mapItems(form.items),
      updated_at: new Date().toISOString(),
    };
    mockSets = mockSets.map((set) => (set.id === id ? updated : set));
    return mapSet(updated);
  },

  // * Duplikuje zestaw w tym samym folderze.
  // TODO: [BACKEND] POST /api/v1/exercises/sets/:id/duplicate
  async duplicate(id: string): Promise<ExerciseSet> {
    await delay(MOCK_LATENCY_MS.write);
    const original = findSetOrThrow(id);
    const now = new Date().toISOString();
    const duplicate = {
      ...original,
      id: createMockId("set"),
      name: `${original.name} (Kopia)`,
      exercise_items: original.exercise_items.map((item) => ({ ...item })),
      created_at: now,
      updated_at: now,
    };
    mockSets = [...mockSets, duplicate];
    return mapSet(duplicate);
  },

  async move(id: string, folderId: string | null): Promise<ExerciseSet> {
    await delay(MOCK_LATENCY_MS.short);
    const existing = findSetOrThrow(id);
    const updated = {
      ...existing,
      folder_id: folderId,
      updated_at: new Date().toISOString(),
    };
    mockSets = mockSets.map((set) => (set.id === id ? updated : set));
    return mapSet(updated);
  },

  // * Usuwa zestaw bez usuwania pojedynczych zadań.
  // TODO: [BACKEND] DELETE /api/v1/exercises/sets/:id
  async remove(id: string): Promise<void> {
    await delay(MOCK_LATENCY_MS.medium);
    findSetOrThrow(id);
    mockSets = mockSets.filter((set) => set.id !== id);
  },
};
