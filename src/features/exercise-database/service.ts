// ==========================================
// SERWIS: Komunikacja z API bazy zadań
// ==========================================
// * Warstwa anti-corruption: DTO (Api*) ↔ model domenowy UI.
// * Mappery Exercise/ExerciseListItem pochodzą z types.ts (kontrakt zamrożony);
// * mapowanie zestawów i formularzy jest zdefiniowane tutaj.
// * Obecnie oparty o mocki w pamięci — przy integracji z FastAPI podmieniamy
// * wywołania mocków na api-client (src/lib/api/api-client.ts).

import type {
  ApiExercise,
  ApiExerciseBlock,
  Category,
  CategoryNode,
  Exercise,
  ExerciseListItem,
  Tag,
} from "./types";
import { mapApiExerciseToExercise, mapApiExerciseToListItem } from "./types";
import type {
  ExerciseFormBlockData,
  ExerciseFormData,
} from "./schema";

// ==========================================
// BŁĘDY DOMENOWE
// ==========================================

export type ExerciseServiceErrorCode = "NOT_FOUND" | "VALIDATION";

// * Błąd serwisu z kodem — warstwa widoku/hooka decyduje o komunikacie dla użytkownika.
// TODO: [BACKEND] Mapować statusy HTTP (404 → NOT_FOUND, 422 → VALIDATION) w api-client.
export class ExerciseServiceError extends Error {
  readonly code: ExerciseServiceErrorCode;

  constructor(code: ExerciseServiceErrorCode, message: string) {
    super(message);
    this.name = "ExerciseServiceError";
    this.code = code;
  }
}

// ==========================================
// STAŁE MOCKÓW
// ==========================================

// * Symulowane opóźnienia sieci (ms)
const MOCK_LATENCY_MS = {
  tiny: 200,
  short: 300,
  medium: 400,
  write: 500,
  slowWrite: 600,
} as const;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// * Unikalne ID mocków — licznik eliminuje kolizje Date.now() w tej samej milisekundzie
let mockIdSequence = 0;
const createMockId = (prefix: string): string =>
  `${prefix}-${Date.now()}-${++mockIdSequence}`;

// ==========================================
// DANE MOCKOWE
// ==========================================

type ApiTag = ApiExercise["tags"][number];
type ApiCategory = ApiExercise["categories"][number];

const mockTags: Tag[] = [
  { id: "t-1", name: "Arytmetyka", isGlobal: true },
  { id: "t-2", name: "Algebra", isGlobal: true },
  { id: "t-3", name: "Funkcje", isGlobal: true },
  { id: "t-4", name: "Trudne maturalne", isGlobal: false },
];

const mockCategories: Category[] = [
  { id: "c-sp", name: "Szkoła Podstawowa", parentId: null },
  { id: "c-sp-aryt", name: "Arytmetyka", parentId: "c-sp" },
  { id: "c-sp-geo", name: "Geometria", parentId: "c-sp" },

  { id: "c-lo", name: "Liceum / Technikum", parentId: null },
  { id: "c-lo-func", name: "Funkcje", parentId: "c-lo" },
  { id: "c-lo-func-kwad", name: "Funkcja kwadratowa", parentId: "c-lo-func" },
  { id: "c-lo-func-lin", name: "Funkcja liniowa", parentId: "c-lo-func" },
];

// * Rozwiązuje ID tagu do DTO na podstawie słownika mockTags.
// * Dzięki temu nazwy w zadaniach są ZAWSZE spójne ze słownikiem.
// ! Nieznane ID to błąd (NOT_FOUND), a nie cichy fallback „Nieznany”.
const resolveApiTag = (tagId: string): ApiTag => {
  const tag = mockTags.find((candidate) => candidate.id === tagId);
  if (!tag) {
    throw new ExerciseServiceError("NOT_FOUND", `Tag ${tagId} nie istnieje`);
  }
  return { id: tag.id, name: tag.name, is_global: tag.isGlobal };
};

const resolveApiCategory = (categoryId: string): ApiCategory => {
  const category = mockCategories.find(
    (candidate) => candidate.id === categoryId,
  );
  if (!category) {
    throw new ExerciseServiceError(
      "NOT_FOUND",
      `Kategoria ${categoryId} nie istnieje`,
    );
  }
  return { id: category.id, name: category.name, parent_id: category.parentId };
};

let mockExercises: ApiExercise[] = [
  {
    id: "ex-1",
    title: "Równanie kwadratowe",
    source_type_code: "cke",
    exercise_type_code: "open",
    math_level: "highschool_basic",
    difficulty: "easy",
    points: 2,
    content: [
      {
        id: "b1",
        type: "text",
        content: "Rozwiąż równanie kwadratowe: x² + 5x + 6 = 0.",
      },
    ],
    solution: [
      { id: "s1", type: "text", content: "Δ = 25 - 24 = 1, x₁ = -2, x₂ = -3" },
    ],
    grading_rules_url: null,
    tags: [resolveApiTag("t-2")],
    categories: [
      resolveApiCategory("c-lo"),
      resolveApiCategory("c-lo-func-kwad"),
    ],
    created_at: "2025-06-10T10:00:00Z",
    updated_at: "2025-06-10T10:00:00Z",
  },
  {
    id: "ex-2",
    title: "Szybkie zadanie tekstowe z trójkąta",
    source_type_code: "tutor",
    exercise_type_code: "closed",
    math_level: "primary_4_8",
    difficulty: "medium",
    points: null,
    content: [
      { id: "b2", type: "text", content: "Oblicz sumę kątów..." },
      {
        id: "b3",
        type: "image",
        url: "https://example.com/trojkat.png",
        asset_id: 12,
      },
    ],
    solution: null,
    grading_rules_url: null,
    tags: [],
    categories: [resolveApiCategory("c-sp-geo")],
    created_at: "2025-06-11T14:30:00Z",
    updated_at: "2025-06-11T14:30:00Z",
  },
  {
    id: "ex-3",
    title: "Pochodna iloczynu",
    source_type_code: "generated",
    exercise_type_code: "proof",
    math_level: "highschool_extended",
    difficulty: "hard",
    points: 5,
    content: [
      {
        id: "b4",
        type: "text",
        content: "Oblicz pochodną funkcji f(x) = x² · sin(x).",
      },
    ],
    solution: [{ id: "s2", type: "text", content: "Wzór: (f*g)' = f'g + fg'" }],
    grading_rules_url: null,
    tags: [resolveApiTag("t-3"), resolveApiTag("t-4")],
    categories: [resolveApiCategory("c-lo-func")],
    created_at: "2025-06-12T09:15:00Z",
    updated_at: "2025-06-12T09:15:00Z",
  },
];

// ==========================================
// HELPERY: Wyszukiwanie w mockach
// ==========================================

const findExerciseOrThrow = (id: string): ApiExercise => {
  const exercise = mockExercises.find((candidate) => candidate.id === id);
  if (!exercise) {
    throw new ExerciseServiceError("NOT_FOUND", `Zadanie ${id} nie istnieje`);
  }
  return exercise;
};

// ==========================================
// MAPOWANIE: Formularz → DTO (kierunek zapisu)
// ==========================================

// * Mapuje blok formularza (camelCase, assetId) na blok API (snake_case, asset_id).
// * fallbackId nadaje ID nowym blokom, które nie mają jeszcze własnego.
const mapFormBlockToApiBlock = (
  block: ExerciseFormBlockData,
  fallbackId: string,
): ApiExerciseBlock => {
  const id = block.id || fallbackId;
  if (block.type === "text") {
    return { id, type: "text", content: block.content };
  }
  return { id, type: block.type, url: block.url, asset_id: block.assetId };
};

// * Pola ApiExercise edytowalne z formularza (reszta: id, daty, grading_rules_url).
type ApiExerciseEditableFields = Omit<
  ApiExercise,
  "id" | "grading_rules_url" | "created_at" | "updated_at"
>;

// * Wspólne mapowanie ExerciseFormData → pola DTO dla create i update.
// TODO: [BACKEND] Docelowo payload: ExerciseCreatePayload (tag_ids, category_ids, asset_id bez url).
const mapFormToApiFields = (
  form: ExerciseFormData,
  idPrefix: string,
): ApiExerciseEditableFields => ({
  title: form.title,
  source_type_code: form.sourceTypeCode,
  exercise_type_code: form.exerciseTypeCode,
  math_level: form.mathLevel,
  difficulty: form.difficulty,
  points: form.points,
  content: form.content.map((block, index) =>
    mapFormBlockToApiBlock(block, `${idPrefix}-b${index}`),
  ),
  solution:
    form.solution.length > 0
      ? form.solution.map((block, index) =>
          mapFormBlockToApiBlock(block, `${idPrefix}-s${index}`),
        )
      : null,
  tags: form.tagIds.map(resolveApiTag),
  categories: form.categoryIds.map(resolveApiCategory),
});

// ==========================================
// MAPOWANIE: DTO → model domenowy (kierunek odczytu)
// ==========================================

// ==========================================
// MAPOWANIE: Drzewo kategorii
// ==========================================

// * Buduje drzewo z płaskiej listy. Kategorie z nieistniejącym rodzicem
// * (osierocone) trafiają na poziom główny, żeby nie zniknęły z UI.
const buildCategoryTree = (categories: readonly Category[]): CategoryNode[] => {
  const nodes = new Map<string, CategoryNode>(
    categories.map((category): [string, CategoryNode] => [
      category.id,
      { ...category, children: [] },
    ]),
  );
  const roots: CategoryNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category.id);
    if (!node) continue;

    const parent = category.parentId ? nodes.get(category.parentId) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
};

// ==========================================
// SERWIS: Eksportowane metody API
// ==========================================

export const ExerciseService = {
  // ----- Słowniki: tagi i kategorie -----

  // * Lista wszystkich dostępnych tagów.
  // TODO: [BACKEND] GET /api/v1/exercises/tags
  async getTags(): Promise<Tag[]> {
    await delay(MOCK_LATENCY_MS.tiny);
    return mockTags.map((tag) => ({ ...tag }));
  },

  // * Tworzy tag inline z formularza zadania. Duplikat (case-insensitive) zwraca istniejący tag.
  // * Pusta nazwa → ExerciseServiceError("VALIDATION").
  // TODO: [BACKEND] POST /api/v1/exercises/tags
  async createTag(name: string): Promise<Tag> {
    await delay(MOCK_LATENCY_MS.tiny);

    const trimmed = name.trim();
    if (!trimmed) {
      throw new ExerciseServiceError(
        "VALIDATION",
        "Nazwa tagu nie może być pusta",
      );
    }

    const existing = mockTags.find(
      (tag) => tag.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) return { ...existing };

    const newTag: Tag = {
      id: createMockId("t"),
      name: trimmed,
      isGlobal: false,
    };
    mockTags.push(newTag);
    return { ...newTag };
  },

  // * Hierarchiczne drzewo kategorii (działów) do selectów i drzewka w formularzu.
  // TODO: [BACKEND] GET /api/v1/exercises/categories
  async getCategoriesTree(): Promise<CategoryNode[]> {
    await delay(MOCK_LATENCY_MS.short);
    return buildCategoryTree(mockCategories);
  },

  // ----- Zadania: odczyt -----

  // * Lekka lista zadań (bez treści) do przeglądarki i kreatora zestawu.
  // TODO: [BACKEND] GET /api/v1/exercises
  async getExercisesList(): Promise<ExerciseListItem[]> {
    await delay(MOCK_LATENCY_MS.medium);
    return mockExercises.map(mapApiExerciseToListItem);
  },

  // * Pełne szczegóły zadania; null, gdy zadanie nie istnieje (widoki obsługują ten stan).
  // TODO: [BACKEND] GET /api/v1/exercises/:id (404 → null)
  async getExercise(id: string): Promise<Exercise | null> {
    await delay(MOCK_LATENCY_MS.short);
    const row = mockExercises.find((exercise) => exercise.id === id);
    return row ? mapApiExerciseToExercise(row) : null;
  },

  // ----- Zadania: mutacje -----

  // * Tworzy zadanie z danych formularza (camelCase → snake_case DTO).
  // TODO: [BACKEND] POST /api/v1/exercises
  async createExercise(form: ExerciseFormData): Promise<Exercise> {
    await delay(MOCK_LATENCY_MS.slowWrite);

    const newId = createMockId("ex");
    const now = new Date().toISOString();
    const created: ApiExercise = {
      id: newId,
      ...mapFormToApiFields(form, newId),
      grading_rules_url: null,
      created_at: now,
      updated_at: now,
    };

    mockExercises = [...mockExercises, created];
    return mapApiExerciseToExercise(created);
  },

  // * Aktualizuje zadanie; nieistniejące ID → NOT_FOUND. Zachowuje created_at i grading_rules_url.
  // TODO: [BACKEND] PUT /api/v1/exercises/:id
  async updateExercise(id: string, form: ExerciseFormData): Promise<Exercise> {
    await delay(MOCK_LATENCY_MS.slowWrite);

    const existing = findExerciseOrThrow(id);
    const updated: ApiExercise = {
      ...existing,
      ...mapFormToApiFields(form, id),
      updated_at: new Date().toISOString(),
    };

    mockExercises = mockExercises.map((exercise) =>
      exercise.id === id ? updated : exercise,
    );
    return mapApiExerciseToExercise(updated);
  },

  // * Usuwa zadanie; backend powinien usunąć referencje zgodnie z kontraktem kaskady.
  // TODO: [BACKEND] DELETE /api/v1/exercises/:id
  async deleteExercise(id: string): Promise<void> {
    await delay(MOCK_LATENCY_MS.medium);

    findExerciseOrThrow(id);
    mockExercises = mockExercises.filter((exercise) => exercise.id !== id);
  },
};
