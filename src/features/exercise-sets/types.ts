// ==========================================
// TYPY: Feature zestawów zadań
// ==========================================
// * Kontrakty zestawów są niezależne od feature'u bazy pojedynczych zadań.

import type { Exercise } from "@/features/exercise-database/types";

export interface ApiExerciseSet {
  id: string;
  name: string;
  description: string | null;
  folder_id: string | null;
  exercise_items: { exercise_id: string; position: number }[];
  created_at: string;
  updated_at: string;
}

export interface ExerciseSet {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null;
  exerciseIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseSetListItem {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null;
  exerciseCount: number;
  previewTags: Exercise["tags"];
  updatedAt: Date;
}

export interface ExerciseSetDetail extends ExerciseSet {
  exercises: Exercise[];
}

export interface ExerciseSetFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface ExerciseSetItemPayload {
  exercise_id: string;
  position: number;
}
