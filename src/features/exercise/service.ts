// ==========================================
// SERWIS: Komunikacja z API bazy zadań
// ==========================================

import type {
  ApiExercise,
  ApiExerciseSet,
  Exercise,
  ExerciseSet,
  ExerciseListItem,
  ExerciseSetListItem,
  ExerciseSetDetail,
  Tag,
  Category,
  CategoryNode,
} from "./types";
import { mapApiExerciseToExercise, mapApiExerciseToListItem } from "./types";
import type { ExerciseFormData, ExerciseSetFormData } from "./schema";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ==========================================
// DANE MOCKOWE
// ==========================================

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
    tags: [{ id: "t-1", name: "Ważne maturalne", is_global: false }],
    categories: [
      { id: "c-lo", name: "Liceum / Technikum", parent_id: null },
      {
        id: "c-lo-func-kwad",
        name: "Funkcja kwadratowa",
        parent_id: "c-lo-func",
      },
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
    categories: [],
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
    tags: [
      { id: "t-3", name: "Pochodne", is_global: false },
      { id: "t-4", name: "Funkcje", is_global: false },
    ],
    categories: [],
    created_at: "2025-06-12T09:15:00Z",
    updated_at: "2025-06-12T09:15:00Z",
  },
];

let mockExerciseSets: ApiExerciseSet[] = [
  {
    id: "set-1",
    name: "Sprawdzian - równania i nierówności",
    description: "Sprawdzian dla klasy 2 LO",
    exercise_items: [
      { exercise_id: "ex-1", position: 0 },
      { exercise_id: "ex-2", position: 1 },
    ],
    created_at: "2025-06-10T12:00:00Z",
    updated_at: "2025-06-10T12:00:00Z",
  },
];

// ==========================================
// HELPERY MAPOWANIA
// ==========================================

const getPreviewTagsForSet = (exerciseIds: string[], limit = 3): Tag[] => {
  const seen = new Set<string>();
  const result: Tag[] = [];
  for (const exId of exerciseIds) {
    const ex = mockExercises.find((e) => e.id === exId);
    if (!ex) continue;
    for (const tag of ex.tags) {
      if (seen.has(tag.id)) continue;
      seen.add(tag.id);
      result.push({
        id: tag.id,
        name: tag.name,
        isGlobal: tag.is_global,
      });
      if (result.length >= limit) return result;
    }
  }
  return result;
};

// ==========================================
// SERWIS: Eksportowane metody API
// ==========================================

export const ExerciseService = {
  // TODO: [BACKEND] GET /api/v1/exercises/tags
  async getTags(): Promise<Tag[]> {
    await delay(200);
    return [...mockTags];
  },

  // TODO: [BACKEND] GET /api/v1/exercises/categories
  async getCategoriesTree(): Promise<CategoryNode[]> {
    await delay(300);
    const allCats = [...mockCategories];

    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    allCats.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [] });
    });

    allCats.forEach((cat) => {
      const node = map.get(cat.id);
      if (!node) return;

      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  },

  // TODO: [BACKEND] GET /api/v1/exercises
  async getExercisesList(): Promise<ExerciseListItem[]> {
    await delay(400);
    return mockExercises.map((ex) => mapApiExerciseToListItem(ex));
  },

  // TODO: [BACKEND] GET /api/v1/exercises/:id
  async getExercise(id: string): Promise<Exercise | null> {
    await delay(300);
    const row = mockExercises.find((e) => e.id === id);
    return row ? mapApiExerciseToExercise(row) : null;
  },

  // TODO: [BACKEND] POST /api/v1/exercises
  async createExercise(_form: ExerciseFormData): Promise<Exercise> {
    await delay(500);
    throw new Error(
      "Tymczasowo wyłączone - czeka na implementację formularza.",
    );
  },

  // TODO: [BACKEND] PUT /api/v1/exercises/:id
  async updateExercise(
    _id: string,
    _form: ExerciseFormData,
  ): Promise<Exercise> {
    await delay(500);
    throw new Error(
      "Tymczasowo wyłączone - czeka na implementację formularza.",
    );
  },

  // TODO: [BACKEND] DELETE /api/v1/exercises/:id
  async deleteExercise(id: string): Promise<void> {
    await delay(400);
    mockExercises = mockExercises.filter((e) => e.id !== id);
    mockExerciseSets = mockExerciseSets.map((s) => ({
      ...s,
      exercise_items: s.exercise_items.filter(
        (item) => item.exercise_id !== id,
      ),
    }));
  },

  // TODO: [BACKEND] GET /api/v1/exercises/sets
  async getExerciseSetsList(): Promise<ExerciseSetListItem[]> {
    await delay(400);
    const result: ExerciseSetListItem[] = [];
    for (const set of mockExerciseSets) {
      result.push({
        id: set.id,
        name: set.name,
        description: set.description,
        exerciseCount: set.exercise_items.length,
        previewTags: getPreviewTagsForSet(
          set.exercise_items.map((i) => i.exercise_id),
        ),
        updatedAt: new Date(set.updated_at),
      });
    }
    return result.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  },

  // TODO: [BACKEND] GET /api/v1/exercises/sets/:id
  async getExerciseSetDetail(id: string): Promise<ExerciseSetDetail | null> {
    await delay(400);
    const row = mockExerciseSets.find((s) => s.id === id);
    if (!row) return null;

    const exercises: Exercise[] = row.exercise_items
      .sort((a, b) => a.position - b.position)
      .map((item) => {
        const ex = mockExercises.find((e) => e.id === item.exercise_id);
        return ex ? mapApiExerciseToExercise(ex) : null;
      })
      .filter((e): e is Exercise => e !== null);

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      exerciseIds: row.exercise_items.map((i) => i.exercise_id),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      exercises,
    };
  },

  // TODO: [BACKEND] POST /api/v1/exercises/sets
  async createExerciseSet(_form: ExerciseSetFormData): Promise<ExerciseSet> {
    await delay(500);
    throw new Error("Czeka na refaktor");
  },

  // TODO: [BACKEND] PUT /api/v1/exercises/sets/:id
  async updateExerciseSet(
    _id: string,
    _form: ExerciseSetFormData,
  ): Promise<ExerciseSet> {
    await delay(500);
    throw new Error("Czeka na refaktor");
  },

  // TODO: [BACKEND] POST /api/v1/exercises/sets/:id/duplicate
  async duplicateExerciseSet(_id: string): Promise<ExerciseSet> {
    await delay(500);
    throw new Error("Czeka na refaktor");
  },

  // TODO: [BACKEND] DELETE /api/v1/exercises/sets/:id
  async deleteExerciseSet(id: string): Promise<void> {
    await delay(400);
    mockExerciseSets = mockExerciseSets.filter((s) => s.id !== id);
  },
};
