// ==========================================
// TYPY: Feature zestawów zadań
// ==========================================
// * Kontrakty zestawów są niezależne od feature'u bazy pojedynczych zadań.

import type { Exercise } from "@/features/exercise-database/types";

export interface ExerciseSet {
  id: string;
  name: string;
  description: string | null;
  folderId: string | null;
  exerciseIds: string[];
  assignmentCount: number;
  archivedAt: Date | null;
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
  tags: Exercise["tags"];
  assignmentCount: number;
  archivedAt: Date | null;
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

export interface FolderDeletionPreview {
  fingerprint: string;
  folderNames: string[][];
  deletedSets: { id: string; name: string; folderPath: string[] }[];
  protectedSets: { id: string; name: string; folderPath: string[] }[];
}
