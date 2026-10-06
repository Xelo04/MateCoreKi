// ==========================================
// TYPY: Moduł Bazy Zadań
// ==========================================
// Definiuje kontrakty danych dla bazy zadań nauczyciela:

// ==========================================
// TYPY ENUMERACYJNE
// ==========================================

// * Stopień trudności zadania (3 poziomy)
export type ExerciseDifficulty = "easy" | "medium" | "hard";

// ==========================================
// TAGI
// ==========================================

// * Tag tematyczny - pobierany z GET /api/v1/exercises/tags TODO
export interface Tag {
  id: string;
  name: string; // * Nazwa po polsku, np. "Geometria płaska"
}

// ==========================================
// DTO Z BACKENDU
// ==========================================

// * Pojedyncze zadanie - DTO z API
export interface ApiExercise {
  id: string;
  title: string;
  // * Treść zadania - przynajmniej jedno z trzech pól musi być niepuste
  content_text: string | null;
  content_images_urls: string[]; // * URL-e do zdjęć
  content_files_urls: string[]; // * URL-e do PDF-ów
  // * Rozwiązanie zadania
  solution_text: string | null;
  solution_images_urls: string[]; // * URL-e do zdjęć rozwiązania
  solution_files_urls: string[]; // * URL-e do PDF-ów rozwiązania
  // * Tagi jako ID (rozwijane na obiekty Tag w warstwie mapowania)
  tag_ids: string[];
  description: string | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null; // * Liczba całkowita, null = nieoceniane
  last_modified: string;
}

// * Zestaw zadań - DTO z API
export interface ApiExerciseSet {
  id: string;
  name: string;
  description: string | null;
  // * Tablica ID zadań - kolejność w tablicy = kolejność w zestawie
  exercise_ids: string[];
  // * Opcjonalne przypisanie do konkretnego ucznia
  student_id: string | null;
  last_modified: string;
}

// * Payload do tworzenia/aktualizacji zadania
export type ApiExercisePayload = Omit<ApiExercise, "id" | "last_modified">;

// * Payload do tworzenia/aktualizacji zestawu
export type ApiExerciseSetPayload = Omit<
  ApiExerciseSet,
  "id" | "last_modified"
>;

// ==========================================
// MODELE DOMENOWE (camelCase)
// ==========================================

// * Pojedyncze zadanie - model używany w logice aplikacji
export interface Exercise {
  id: string;
  title: string;
  contentText: string | null;
  contentImages: string[];
  contentFiles: string[];
  solutionText: string | null;
  solutionImagesUrls: string[];
  solutionFilesUrls: string[];
  // * Tagi jako rozwinięte obiekty (z id + nazwą po polsku)
  tags: Tag[];
  description: string | null;
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  lastModified: Date;
}

// * Zestaw zadań - model używany w logice aplikacji
export interface ExerciseSet {
  id: string;
  name: string;
  description: string | null;
  // * Kolejność zadań w zestawie (tablica ID)
  exerciseIds: string[];
  // * Opcjonalne przypisanie do ucznia (ID z modułu students)
  studentId: string | null;
  lastModified: Date;
}

// ==========================================
// MODELE WIDOKU
// ==========================================

// * Zestaw z denormalizowanymi danymi do wyświetlenia na liście
export interface ExerciseSetListItem {
  id: string;
  name: string;
  description: string | null;
  exerciseCount: number;
  // * Podgląd tagów ze wszystkich zadań w zestawie (bez duplikatów, max 3)
  previewTags: Tag[];
  studentId: string | null;
  studentName: string | null;
  lastModified: Date;
}

// * Zadanie z denormalizowanymi danymi do wyświetlenia na liście
export interface ExerciseListItem {
  id: string;
  title: string;
  // * Treść tekstowa zadania do podglądu w wierszu (pełna treść, obcięcie w komponencie)
  contentText: string | null;
  tags: Tag[];
  difficulty: ExerciseDifficulty | null;
  points: number | null;
  // * Ile zestawów zawiera to zadanie (informacja dla nauczyciela przy edycji)
  setCount: number;
  // * Flagi obecności poszczególnych formatów treści
  hasText: boolean;
  hasImages: boolean;
  hasFiles: boolean;
  // * Czy zadanie posiada jakiekolwiek rozwiązanie (tekst, zdjęcia lub pliki)
  hasSolution: boolean;
  lastModified: Date;
}

// * Pełny widok zestawu z rozwiniętymi zadaniami (dla strony szczegółów)
export interface ExerciseSetDetail extends ExerciseSet {
  exercises: Exercise[];
}

// ==========================================
// STAŁE POMOCNICZE
// ==========================================

// * Mapa trudności na przyjazne nazwy po polsku
export const EXERCISE_DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  easy: "Łatwy",
  medium: "Średni",
  hard: "Trudny",
};
