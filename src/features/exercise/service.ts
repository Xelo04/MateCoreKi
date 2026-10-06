// ==========================================
// SERWIS: Komunikacja z API bazy zadań
// ==========================================

import type { StudentListItem } from "@/features/students/types";
import { StudentService } from "@/features/students/service";
import type {
  ApiExercise,
  ApiExerciseSet,
  Exercise,
  ExerciseSet,
  ExerciseListItem,
  ExerciseSetListItem,
  ExerciseSetDetail,
  Tag,
} from "./types";
import type { ExerciseFormData, ExerciseSetFormData } from "./schema";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ==========================================
// DANE MOCKOWE: Tagi
// ==========================================

const mockTags: Tag[] = [
  { id: "t-arytmetyka", name: "Arytmetyka" },
  { id: "t-algebra", name: "Algebra" },
  { id: "t-funkcje", name: "Funkcje" },
  { id: "t-geometria-plaska", name: "Geometria płaska" },
  { id: "t-geometria-analityczna", name: "Geometria analityczna" },
  { id: "t-trygonometria", name: "Trygonometria" },
  { id: "t-ciagi", name: "Ciągi" },
  { id: "t-prawdopodobienstwo", name: "Rachunek prawdopodobieństwa" },
  { id: "t-statystyka", name: "Statystyka" },
  { id: "t-analiza", name: "Analiza matematyczna" },
  { id: "t-logika", name: "Logika i zbiory" },
  { id: "t-inne", name: "Inne" },
];

// ==========================================
// DANE MOCKOWE: Zadania
// ==========================================
// * Rozszerzone o edge-case'y: różne formaty treści, rozwiązania, brak tagów itp.

let mockExercises: ApiExercise[] = [
  {
    id: "ex-1",
    title: "Równanie kwadratowe",
    content_text:
      "Rozwiąż równanie kwadratowe: x² + 5x + 6 = 0. Wyznacz deltę i oba pierwiastki.",
    content_images_urls: [],
    content_files_urls: [],
    solution_text: "Δ = 25 - 24 = 1, x₁ = -2, x₂ = -3",
    solution_images_urls: [],
    solution_files_urls: [],
    tag_ids: ["t-algebra"],
    description: null,
    difficulty: "easy",
    points: 2,
    last_modified: "2025-06-10T10:00:00Z",
  },
  // EDGE CASE: Brak tagów, brak punktów, brak trudności, brak rozwiązania
  {
    id: "ex-2",
    title: "Szybkie zadanie tekstowe z treści",
    content_text:
      "Oblicz sumę kątów w trójkącie prostokątnym, jeśli jeden z kątów ostrych ma 35°.",
    content_images_urls: [],
    content_files_urls: [],
    solution_text: null,
    solution_images_urls: [],
    solution_files_urls: [],
    tag_ids: [],
    description: null,
    difficulty: null,
    points: null,
    last_modified: "2025-06-11T14:30:00Z",
  },
  {
    id: "ex-3",
    title: "Pochodna iloczynu funkcji trygonometrycznych",
    content_text:
      "Oblicz pochodną funkcji f(x) = x² · sin(x). Zastosuj wzór na pochodną iloczynu.",
    content_images_urls: ["https://example.com/pochodna-wzor.png"],
    content_files_urls: [],
    solution_text: "f'(x) = 2x·sin(x) + x²·cos(x)",
    solution_images_urls: ["https://example.com/pochodna-rozw.png"],
    solution_files_urls: [],
    tag_ids: ["t-analiza", "t-trygonometria"],
    description: null,
    difficulty: "hard",
    points: 5,
    last_modified: "2025-06-12T09:15:00Z",
  },
  // EDGE CASE: Tylko zdjęcie, brak tekstu
  {
    id: "ex-4",
    title: "Geometria — pole trapezu ze zdjęcia",
    content_text: null,
    content_images_urls: ["https://example.com/trapez.png"],
    content_files_urls: [],
    solution_text: null,
    solution_images_urls: [],
    solution_files_urls: ["https://example.com/trapez-rozw.pdf"],
    tag_ids: ["t-geometria-plaska"],
    description: "Zadanie ze zdjęcia z podręcznika",
    difficulty: "medium",
    points: 3,
    last_modified: "2025-06-13T11:00:00Z",
  },
  // EDGE CASE: PDF jako treść i rozwiązanie
  {
    id: "ex-5",
    title: "Funkcja kwadratowa — wyznaczanie wierzchołka paraboli",
    content_text:
      "Dana jest funkcja kwadratowa f(x) = 2x² - 8x + 6. Wyznacz współrzędne wierzchołka paraboli i naszkicuj wykres.",
    content_images_urls: [],
    content_files_urls: ["https://example.com/zadanie-funkcja.pdf"],
    solution_text: "p = 2, q = -2, W = (2, -2)",
    solution_images_urls: [],
    solution_files_urls: [],
    tag_ids: ["t-funkcje", "t-algebra"],
    description: null,
    difficulty: "medium",
    points: 4,
    last_modified: "2025-06-14T08:00:00Z",
  },
  // EDGE CASE: Brak treści tekstowej, same zdjęcia, brak rozwiązania
  {
    id: "ex-6",
    title: "Ciąg arytmetyczny — zadanie maturalne",
    content_text: null,
    content_images_urls: [
      "https://example.com/ciag-zad.png",
      "https://example.com/ciag-wykres.png",
    ],
    content_files_urls: [],
    solution_text: null,
    solution_images_urls: [],
    solution_files_urls: [],
    tag_ids: ["t-ciagi"],
    description: null,
    difficulty: "hard",
    points: null,
    last_modified: "2025-06-15T16:00:00Z",
  },
];

// ==========================================
// DANE MOCKOWE: Zestawy zadań
// ==========================================

let mockExerciseSets: ApiExerciseSet[] = [
  {
    id: "set-1",
    name: "Sprawdzian — równania i nierówności",
    description: "Sprawdzian dla klasy 2 LO",
    exercise_ids: ["ex-1"],
    student_id: null,
    last_modified: "2025-06-10T12:00:00Z",
  },
  {
    id: "set-2",
    name: "Powtórka przed maturą — funkcje i analiza matematyczna rozszerzenie",
    description: "Zestaw z zadaniami z najtrudniejszych arkuszy",
    exercise_ids: ["ex-3", "ex-1", "ex-5"],
    student_id: "uuid-1",
    last_modified: "2025-06-14T09:00:00Z",
  },
  // EDGE CASE: Pusty zestaw (0 zadań), bardzo długi tytuł
  {
    id: "set-3",
    name: "Zadania domowe z zakresu geometrii analitycznej oraz stereometrii przestrzennej - cz. 1",
    description: "Do zrobienia na wtorek",
    exercise_ids: [],
    student_id: null,
    last_modified: "2025-06-15T17:30:00Z",
  },
  {
    id: "set-4",
    name: "Ciągi",
    description: null,
    exercise_ids: ["ex-2", "ex-6"],
    student_id: null,
    last_modified: "2025-06-16T10:00:00Z",
  },
  {
    id: "set-5",
    name: "Logika",
    description: null,
    exercise_ids: [],
    student_id: null,
    last_modified: "2025-06-17T10:00:00Z",
  },
  {
    id: "set-6",
    name: "Prawdopodobieństwo",
    description: null,
    exercise_ids: [],
    student_id: null,
    last_modified: "2025-06-18T10:00:00Z",
  },
  {
    id: "set-7",
    name: "Trygonometria",
    description: null,
    exercise_ids: [],
    student_id: null,
    last_modified: "2025-06-19T10:00:00Z",
  },
  {
    id: "set-8",
    name: "Geometria płaska",
    description: null,
    exercise_ids: [],
    student_id: null,
    last_modified: "2025-06-20T10:00:00Z",
  },
];

// ==========================================
// HELPERY MAPOWANIA
// ==========================================

const resolveTags = (tagIds: string[]): Tag[] =>
  tagIds
    .map((id) => mockTags.find((t) => t.id === id))
    .filter((t): t is Tag => t !== undefined);

export const mapExerciseFromApi = (api: ApiExercise): Exercise => ({
  id: api.id,
  title: api.title,
  contentText: api.content_text,
  contentImages: api.content_images_urls,
  contentFiles: api.content_files_urls,
  solutionText: api.solution_text,
  solutionImagesUrls: api.solution_images_urls,
  solutionFilesUrls: api.solution_files_urls,
  tags: resolveTags(api.tag_ids),
  description: api.description,
  difficulty: api.difficulty,
  points: api.points,
  lastModified: new Date(api.last_modified),
});

const mapExerciseSetFromApi = (api: ApiExerciseSet): ExerciseSet => ({
  id: api.id,
  name: api.name,
  description: api.description,
  exerciseIds: api.exercise_ids,
  studentId: api.student_id,
  lastModified: new Date(api.last_modified),
});

const mapExerciseFormToApiPayload = (
  form: ExerciseFormData,
): Omit<ApiExercise, "id" | "last_modified"> => ({
  title: form.title.trim(),
  content_text: form.contentText?.trim() || null,
  content_images_urls: form.contentImages,
  content_files_urls: form.contentFiles,
  solution_text: form.solutionText?.trim() || null,
  solution_images_urls: form.solutionImagesUrls,
  solution_files_urls: form.solutionFilesUrls,
  tag_ids: form.tagIds,
  description: form.description?.trim() || null,
  difficulty: form.difficulty,
  points: form.points,
});

const mapExerciseSetFormToApiPayload = (
  form: ExerciseSetFormData,
): Omit<ApiExerciseSet, "id" | "last_modified"> => ({
  name: form.name.trim(),
  description: form.description?.trim() || null,
  exercise_ids: form.exerciseIds,
  student_id: form.studentId || null,
});

const countSetsForExercise = (exerciseId: string): number =>
  mockExerciseSets.filter((s) => s.exercise_ids.includes(exerciseId)).length;

const getPreviewTagsForSet = (exerciseIds: string[], limit = 3): Tag[] => {
  const seen = new Set<string>();
  const result: Tag[] = [];
  for (const exId of exerciseIds) {
    const ex = mockExercises.find((e) => e.id === exId);
    if (!ex) continue;
    for (const tagId of ex.tag_ids) {
      if (seen.has(tagId)) continue;
      seen.add(tagId);
      const tag = mockTags.find((t) => t.id === tagId);
      if (tag) result.push(tag);
      if (result.length >= limit) return result;
    }
  }
  return result;
};

const getStudentName = async (
  studentId: string | null,
  studentsCache: StudentListItem[],
): Promise<string | null> => {
  if (!studentId) return null;
  const student = studentsCache.find((s) => s.id === studentId);
  return student ? `${student.firstName} ${student.lastName}` : null;
};

// ==========================================
// SERWIS: Eksportowane metody API
// ==========================================

export const ExerciseService = {
  // ----- Tagi -----
  // TODO: [BACKEND] GET /api/v1/exercises/tags
  async getTags(): Promise<Tag[]> {
    await delay(200);
    return [...mockTags];
  },

  // ----- Lista zadań -----
  // TODO: [BACKEND] GET /api/v1/exercises
  // * Mapuje hasSolution i contentText do modelu widoku listy
  async getExercisesList(): Promise<ExerciseListItem[]> {
    await delay(400);
    return mockExercises.map((ex) => ({
      id: ex.id,
      title: ex.title,
      contentText: ex.content_text,
      tags: resolveTags(ex.tag_ids),
      difficulty: ex.difficulty,
      points: ex.points,
      setCount: countSetsForExercise(ex.id),
      hasText: !!ex.content_text && ex.content_text.trim().length > 0,
      hasImages: ex.content_images_urls.length > 0,
      hasFiles: ex.content_files_urls.length > 0,
      // * Pre-computed: czy zadanie ma jakiekolwiek rozwiązanie
      hasSolution:
        (!!ex.solution_text && ex.solution_text.trim().length > 0) ||
        ex.solution_images_urls.length > 0 ||
        ex.solution_files_urls.length > 0,
      lastModified: new Date(ex.last_modified),
    }));
  },

  // ----- Szczegóły zadania -----
  // TODO: [BACKEND] GET /api/v1/exercises/:id
  async getExercise(id: string): Promise<Exercise | null> {
    await delay(300);
    const row = mockExercises.find((e) => e.id === id);
    return row ? mapExerciseFromApi(row) : null;
  },

  // ----- Tworzenie zadania -----
  // TODO: [BACKEND] POST /api/v1/exercises
  async createExercise(form: ExerciseFormData): Promise<Exercise> {
    await delay(500);
    const payload = mapExerciseFormToApiPayload(form);
    const newExercise: ApiExercise = {
      ...payload,
      id: `ex-${Date.now()}`,
      last_modified: new Date().toISOString(),
    };
    mockExercises = [newExercise, ...mockExercises];
    return mapExerciseFromApi(newExercise);
  },

  // ----- Aktualizacja zadania -----
  // TODO: [BACKEND] PUT /api/v1/exercises/:id
  async updateExercise(id: string, form: ExerciseFormData): Promise<Exercise> {
    await delay(500);
    const index = mockExercises.findIndex((e) => e.id === id);
    if (index === -1) throw new Error("Nie znaleziono zadania");
    const payload = mapExerciseFormToApiPayload(form);
    mockExercises[index] = {
      ...mockExercises[index],
      ...payload,
      last_modified: new Date().toISOString(),
    };
    return mapExerciseFromApi(mockExercises[index]);
  },

  // ----- Usuwanie zadania -----
  // * Czyści też referencje z zestawów
  // TODO: [BACKEND] DELETE /api/v1/exercises/:id
  async deleteExercise(id: string): Promise<void> {
    await delay(400);
    mockExercises = mockExercises.filter((e) => e.id !== id);
    mockExerciseSets = mockExerciseSets.map((s) => ({
      ...s,
      exercise_ids: s.exercise_ids.filter((exId) => exId !== id),
      last_modified: new Date().toISOString(),
    }));
  },

  // ----- Lista zestawów -----
  // TODO: [BACKEND] GET /api/v1/exercises/sets
  async getExerciseSetsList(): Promise<ExerciseSetListItem[]> {
    await delay(400);
    let students: StudentListItem[] = [];
    try {
      students = await StudentService.getStudentsList();
    } catch {
      console.error("Błąd pobrania uczniów");
    }

    const result: ExerciseSetListItem[] = [];
    for (const set of mockExerciseSets) {
      const studentName = await getStudentName(set.student_id, students);
      result.push({
        id: set.id,
        name: set.name,
        description: set.description,
        exerciseCount: set.exercise_ids.length,
        previewTags: getPreviewTagsForSet(set.exercise_ids),
        studentId: set.student_id,
        studentName,
        lastModified: new Date(set.last_modified),
      });
    }
    return result.sort(
      (a, b) => b.lastModified.getTime() - a.lastModified.getTime(),
    );
  },

  // ----- Szczegóły zestawu -----
  // TODO: [BACKEND] GET /api/v1/exercises/sets/:id
  async getExerciseSetDetail(id: string): Promise<ExerciseSetDetail | null> {
    await delay(400);
    const row = mockExerciseSets.find((s) => s.id === id);
    if (!row) return null;
    const set = mapExerciseSetFromApi(row);
    const exercises: Exercise[] = row.exercise_ids
      .map((exId) => {
        const ex = mockExercises.find((e) => e.id === exId);
        return ex ? mapExerciseFromApi(ex) : null;
      })
      .filter((e): e is Exercise => e !== null);
    return { ...set, exercises };
  },

  // ----- Tworzenie zestawu -----
  // TODO: [BACKEND] POST /api/v1/exercises/sets
  async createExerciseSet(form: ExerciseSetFormData): Promise<ExerciseSet> {
    await delay(500);
    const payload = mapExerciseSetFormToApiPayload(form);
    const newSet: ApiExerciseSet = {
      ...payload,
      id: `set-${Date.now()}`,
      last_modified: new Date().toISOString(),
    };
    mockExerciseSets = [newSet, ...mockExerciseSets];
    return mapExerciseSetFromApi(newSet);
  },

  // ----- Aktualizacja zestawu -----
  // TODO: [BACKEND] PUT /api/v1/exercises/sets/:id
  async updateExerciseSet(
    id: string,
    form: ExerciseSetFormData,
  ): Promise<ExerciseSet> {
    await delay(500);
    const index = mockExerciseSets.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Nie znaleziono zestawu");
    const payload = mapExerciseSetFormToApiPayload(form);
    mockExerciseSets[index] = {
      ...mockExerciseSets[index],
      ...payload,
      last_modified: new Date().toISOString(),
    };
    return mapExerciseSetFromApi(mockExerciseSets[index]);
  },

  // ----- Duplikacja zestawu -----
  // * Tworzy nowy zestaw z tymi samymi zadaniami, opisem i przypisanym uczniem
  // * Dodaje sufiks "(kopia)" do nazwy, aby odróżnić od oryginału
  // TODO: [BACKEND] POST /api/v1/exercises/sets/:id/duplicate
  async duplicateExerciseSet(id: string): Promise<ExerciseSet> {
    await delay(500);
    const original = mockExerciseSets.find((s) => s.id === id);
    if (!original) throw new Error("Nie znaleziono zestawu do duplikacji");

    const copy: ApiExerciseSet = {
      id: `set-${Date.now()}`,
      name: `${original.name} (kopia)`,
      description: original.description,
      exercise_ids: [...original.exercise_ids],
      student_id: original.student_id,
      last_modified: new Date().toISOString(),
    };
    mockExerciseSets = [copy, ...mockExerciseSets];
    return mapExerciseSetFromApi(copy);
  },

  // ----- Usuwanie zestawu -----
  // * Nie usuwa zadań — tylko sam zestaw
  // TODO: [BACKEND] DELETE /api/v1/exercises/sets/:id
  async deleteExerciseSet(id: string): Promise<void> {
    await delay(400);
    mockExerciseSets = mockExerciseSets.filter((s) => s.id !== id);
  },
};
