import { apiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-errors";
import type { ApiExercise, ApiExerciseBlock, ApiTag, Exercise, ExerciseBlock, Tag } from "@/features/exercise-database/types";
import type { ExerciseSetFormData } from "./schema";
import type { ExerciseSet, ExerciseSetDetail, ExerciseSetFolder, ExerciseSetListItem, FolderDeletionPreview } from "./types";

const SETS = "/api/v1/exercise-sets";
const FOLDERS = "/api/v1/set-folders";

interface ApiSetList {
  id: number;
  name: string;
  description: string | null;
  folder_id: number | null;
  exercise_count: number;
  preview_tags: ApiTag[];
  tags: ApiTag[];
  assignment_count: number;
  archived_at: string | null;
  updated_at: string;
}

interface ApiSetDetail extends Omit<ApiSetList, "exercise_count" | "preview_tags" | "tags"> {
  exercise_ids: number[];
  exercises: ApiExercise[];
  created_at: string;
}

interface ApiFolder {
  id: number;
  name: string;
  parent_id: number | null;
}

interface ApiFolderNode extends ApiFolder {
  children: ApiFolderNode[];
}

interface ApiDeletionPreview {
  fingerprint: string;
  folder_names: string[][];
  deleted_sets: { id: number; name: string; folder_path: string[] }[];
  protected_sets: { id: number; name: string; folder_path: string[] }[];
}

function numericId(id: string): number {
  const parsed = Number(id);
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(parsed)) {
    throw new Error("Nieprawidłowy identyfikator zasobu.");
  }
  return parsed;
}

const mapTag = (tag: ApiTag): Tag => ({
  id: String(tag.id), name: tag.name, isGlobal: tag.is_system,
});

function mapBlock(block: ApiExerciseBlock, index: number): ExerciseBlock {
  const id = `block-${index}`;
  switch (block.type) {
    case "text": return { id, type: "text", content: block.text };
    case "image": return { id, type: "image", assetId: block.asset_id, caption: block.caption ?? null };
    case "file": return { id, type: "file", assetId: block.asset_id, name: block.name ?? null };
    default: throw new Error("Serwer zwrócił nieobsługiwany typ bloku zadania.");
  }
}

function mapExercise(api: ApiExercise): Exercise {
  return {
    id: String(api.id), title: api.title, sourceType: api.source_type,
    exerciseType: api.exercise_type, mathLevel: api.math_level,
    difficulty: api.difficulty, points: api.points, content: api.content.map(mapBlock),
    solution: api.solution?.map(mapBlock) ?? null, tags: api.tags.map(mapTag),
    categories: api.categories.map((category) => {
      if (!Array.isArray(category.path) || !category.path.length || !category.path.every((part) => typeof part === "string")) {
        throw new Error("Serwer zwrócił nieprawidłową ścieżkę działu.");
      }
      return { id: String(category.id), name: category.name, path: category.path };
    }),
    isOwner: api.is_owner, createdAt: new Date(api.created_at), updatedAt: new Date(api.updated_at),
  };
}

function mapDetail(api: ApiSetDetail): ExerciseSetDetail {
  if (!Array.isArray(api.exercise_ids) || !Array.isArray(api.exercises) ||
      api.exercise_ids.length !== api.exercises.length ||
      api.exercise_ids.some((id, index) => id !== api.exercises[index].id)) {
    throw new Error("Serwer zwrócił niespójne zadania zestawu.");
  }
  return {
    id: String(api.id), name: api.name, description: api.description,
    folderId: api.folder_id === null ? null : String(api.folder_id),
    exerciseIds: api.exercise_ids.map(String), exercises: api.exercises.map(mapExercise),
    assignmentCount: api.assignment_count, archivedAt: api.archived_at ? new Date(api.archived_at) : null,
    createdAt: new Date(api.created_at), updatedAt: new Date(api.updated_at),
  };
}

function mapFolder(folder: ApiFolder): ExerciseSetFolder {
  return { id: String(folder.id), name: folder.name, parentId: folder.parent_id === null ? null : String(folder.parent_id) };
}

function formBody(form: ExerciseSetFormData) {
  return {
    name: form.name, description: form.description || null,
    folder_id: form.folderId === null ? null : numericId(form.folderId),
    exercise_ids: form.items.map((item) => numericId(item.exercise_id)),
  };
}

export const ExerciseSetService = {
  async getList(archived = false): Promise<ExerciseSetListItem[]> {
    const items = await apiClient.get<ApiSetList[]>(`${SETS}?archived=${archived}`);
    return items.map((item) => ({
      id: String(item.id), name: item.name, description: item.description,
      folderId: item.folder_id === null ? null : String(item.folder_id),
      exerciseCount: item.exercise_count, previewTags: item.preview_tags.map(mapTag),
      tags: item.tags.map(mapTag), assignmentCount: item.assignment_count,
      archivedAt: item.archived_at ? new Date(item.archived_at) : null,
      updatedAt: new Date(item.updated_at),
    }));
  },

  async getDetail(id: string): Promise<ExerciseSetDetail | null> {
    try {
      return mapDetail(await apiClient.get<ApiSetDetail>(`${SETS}/${numericId(id)}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  async getFolders(): Promise<ExerciseSetFolder[]> {
    const tree = await apiClient.get<ApiFolderNode[]>(FOLDERS);
    const flatten = (nodes: ApiFolderNode[]): ExerciseSetFolder[] =>
      nodes.flatMap((node) => [mapFolder(node), ...flatten(node.children)]);
    return flatten(tree);
  },

  async createFolder(name: string, parentId: string | null): Promise<ExerciseSetFolder> {
    return mapFolder(await apiClient.post<ApiFolder>(FOLDERS, {
      body: { name, parent_id: parentId === null ? null : numericId(parentId) },
    }));
  },

  async renameFolder(id: string, name: string): Promise<ExerciseSetFolder> {
    return mapFolder(await apiClient.patch<ApiFolder>(`${FOLDERS}/${numericId(id)}`, { body: { name } }));
  },

  async previewFolderDeletion(id: string): Promise<FolderDeletionPreview> {
    const preview = await apiClient.get<ApiDeletionPreview>(`${FOLDERS}/${numericId(id)}/deletion-preview`);
    const mapEntry = (entry: ApiDeletionPreview["deleted_sets"][number]) =>
      ({ id: String(entry.id), name: entry.name, folderPath: entry.folder_path });
    return {
      fingerprint: preview.fingerprint, folderNames: preview.folder_names,
      deletedSets: preview.deleted_sets.map(mapEntry), protectedSets: preview.protected_sets.map(mapEntry),
    };
  },

  async removeFolder(id: string, fingerprint: string): Promise<void> {
    await apiClient.delete<void>(`${FOLDERS}/${numericId(id)}`, { body: { fingerprint } });
  },

  async create(form: ExerciseSetFormData): Promise<ExerciseSet> {
    return mapDetail(await apiClient.post<ApiSetDetail>(SETS, { body: formBody(form) }));
  },

  async update(id: string, form: ExerciseSetFormData): Promise<ExerciseSet> {
    return mapDetail(await apiClient.patch<ApiSetDetail>(`${SETS}/${numericId(id)}`, { body: formBody(form) }));
  },

  async move(id: string, folderId: string | null): Promise<ExerciseSet> {
    return mapDetail(await apiClient.patch<ApiSetDetail>(`${SETS}/${numericId(id)}`, {
      body: { folder_id: folderId === null ? null : numericId(folderId) },
    }));
  },

  async archive(id: string): Promise<void> {
    await apiClient.post(`${SETS}/${numericId(id)}/archive`);
  },

  async restore(id: string): Promise<void> {
    await apiClient.post(`${SETS}/${numericId(id)}/restore`);
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`${SETS}/${numericId(id)}`);
  },
};
