// ==========================================
// SERWIS: API bazy zadań i mapowanie modeli
// ==========================================

import { apiClient } from "@/lib/api/api-client";
import { ApiError } from "@/lib/api/api-errors";
import type { ExerciseFormBlockData, ExerciseFormData } from "./schema";
import type {
  ApiCategoryNode,
  ApiCategoryRef,
  ApiExercise,
  ApiExerciseBlock,
  ApiExerciseListItem,
  ApiTag,
  Category,
  CategoryNode,
  Exercise,
  ExerciseBlock,
  ExerciseBlockPayload,
  ExerciseCreatePayload,
  ExerciseListItem,
  Tag,
} from "./types";

const BASE_PATH = "/api/v1/exercises";

function numericId(id: string): number {
  const parsed = Number(id);
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(parsed)) {
    throw new Error("Nieprawidłowy identyfikator zasobu.");
  }
  return parsed;
}

function mapTag(tag: ApiTag): Tag {
  return { id: String(tag.id), name: tag.name, isGlobal: tag.is_system };
}

function mapCategory(category: ApiCategoryRef): Category {
  if (!Array.isArray(category.path) || category.path.length === 0 || !category.path.every((part) => typeof part === "string")) {
    throw new Error("Serwer zwrócił nieprawidłową ścieżkę działu.");
  }
  return { id: String(category.id), name: category.name, path: category.path };
}

function mapCategoryNode(node: ApiCategoryNode, parentId: string | null): CategoryNode {
  const id = String(node.id);
  return {
    id,
    name: node.name,
    parentId,
    children: node.children.map((child) => mapCategoryNode(child, id)),
  };
}

function mapBlock(block: ApiExerciseBlock, index: number): ExerciseBlock {
  const id = `block-${index}`;
  switch (block.type) {
    case "text":
      return { id, type: "text", content: block.text };
    case "image":
      return { id, type: "image", assetId: block.asset_id, caption: block.caption ?? null };
    case "file":
      return { id, type: "file", assetId: block.asset_id, name: block.name ?? null };
    default:
      throw new Error("Serwer zwrócił nieobsługiwany typ bloku zadania.");
  }
}

function mapExercise(api: ApiExercise): Exercise {
  return {
    id: String(api.id),
    title: api.title,
    sourceType: api.source_type,
    exerciseType: api.exercise_type,
    mathLevel: api.math_level,
    difficulty: api.difficulty,
    points: api.points,
    content: api.content.map(mapBlock),
    solution: api.solution?.map(mapBlock) ?? null,
    tags: api.tags.map(mapTag),
    categories: api.categories.map(mapCategory),
    isOwner: api.is_owner,
    createdAt: new Date(api.created_at),
    updatedAt: new Date(api.updated_at),
  };
}

function mapListItem(api: ApiExerciseListItem): ExerciseListItem {
  return {
    id: String(api.id),
    title: api.title,
    difficulty: api.difficulty,
    points: api.points,
    mathLevel: api.math_level,
    exerciseType: api.exercise_type,
    sourceType: api.source_type,
    tags: api.tags.map(mapTag),
    categories: api.categories.map(mapCategory),
    hasSolution: api.has_solution,
    isOwner: api.is_owner,
    updatedAt: new Date(api.updated_at),
  };
}

function mapFormBlock(block: ExerciseFormBlockData): ExerciseBlockPayload {
  switch (block.type) {
    case "text":
      return { type: "text", text: block.content };
    case "image":
      return { type: "image", asset_id: block.assetId, caption: block.caption };
    case "file":
      return { type: "file", asset_id: block.assetId, name: block.name };
    case "pending":
      throw new Error("Załącznik nie został jeszcze przesłany.");
    default:
      throw new Error("Nieobsługiwany typ bloku zadania.");
  }
}

function mapForm(form: ExerciseFormData): ExerciseCreatePayload {
  return {
    title: form.title,
    exercise_type: form.exerciseTypeCode,
    math_level: form.mathLevel,
    difficulty: form.difficulty,
    points: form.points,
    content: form.content.map(mapFormBlock),
    solution: form.solution.length ? form.solution.map(mapFormBlock) : null,
    tag_ids: form.tagIds.map(numericId),
    category_ids: form.categoryIds.map(numericId),
  };
}

export function mapExerciseToFormData(exercise: Exercise): ExerciseFormData {
  const mapBlock = (block: ExerciseBlock): ExerciseFormBlockData => {
    if (block.type === "text") {
      return { id: block.id, type: "text", content: block.content };
    }
    if (block.type === "image") {
      return { id: block.id, type: "image", assetId: block.assetId, caption: block.caption };
    }
    return { id: block.id, type: "file", assetId: block.assetId, name: block.name };
  };

  return {
    title: exercise.title,
    exerciseTypeCode: exercise.exerciseType,
    mathLevel: exercise.mathLevel,
    difficulty: exercise.difficulty,
    points: exercise.points,
    categoryIds: exercise.categories.map((category) => category.id),
    tagIds: exercise.tags.map((tag) => tag.id),
    content: exercise.content.map(mapBlock),
    solution: exercise.solution?.map(mapBlock) ?? [],
  };
}

export const ExerciseService = {
  async uploadAsset(file: File): Promise<{ id: number; mimeType: string; originalName: string | null }> {
    const body = new FormData();
    body.append("file", file);
    let result: { id: number; mime_type: string; original_name: string | null };
    try {
      result = await apiClient.post("/api/v1/assets", { body });
    } catch (error) {
      if (error instanceof ApiError && error.status === 429) {
        throw new ApiError("Przekroczono limit przesyłania plików (60 na minutę). Spróbuj ponownie za minutę.", 429, error.details);
      }
      throw error;
    }
    if (!Number.isSafeInteger(result.id) || result.id <= 0 ||
        !["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(result.mime_type) ||
        (result.original_name !== null && typeof result.original_name !== "string")) {
      throw new Error("Nieprawidłowa odpowiedź serwera po przesłaniu pliku.");
    }
    return { id: result.id, mimeType: result.mime_type, originalName: result.original_name };
  },

  async deleteUnusedAsset(id: number): Promise<void> {
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("Nieprawidłowy identyfikator pliku.");
    await apiClient.delete<void>(`/api/v1/assets/${id}`);
  },

  // * GET /api/v1/tags — tagi systemowe i własne.
  async getTags(): Promise<Tag[]> {
    return (await apiClient.get<ApiTag[]>("/api/v1/tags")).map(mapTag);
  },

  // * POST /api/v1/tags — konflikt nazwy jest zwracany przez backend.
  async createTag(name: string): Promise<Tag> {
    return mapTag(await apiClient.post<ApiTag>("/api/v1/tags", { body: { name: name.trim() } }));
  },

  // * GET /api/v1/categories — uporządkowane drzewo działów.
  async getCategoriesTree(): Promise<CategoryNode[]> {
    return (await apiClient.get<ApiCategoryNode[]>("/api/v1/categories"))
      .map((node) => mapCategoryNode(node, null));
  },

  // * GET /api/v1/exercises — lekka lista widocznych zadań.
  async getExercisesList(): Promise<ExerciseListItem[]> {
    const items = await apiClient.get<ApiExerciseListItem[]>(BASE_PATH);
    if (!Array.isArray(items)) throw new Error("Nieprawidłowa odpowiedź listy zadań.");
    return items.map(mapListItem);
  },

  // * GET /api/v1/exercises/{id} — szczegóły albo brak zasobu.
  async getExercise(id: string): Promise<Exercise | null> {
    try {
      return mapExercise(await apiClient.get<ApiExercise>(`${BASE_PATH}/${numericId(id)}`));
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },

  // * POST /api/v1/exercises — utworzenie zadania z formularza.
  async createExercise(form: ExerciseFormData): Promise<Exercise> {
    return mapExercise(await apiClient.post<ApiExercise>(BASE_PATH, { body: mapForm(form) }));
  },

  // * PATCH /api/v1/exercises/{id} — zapis bez zmiany nieedytowanych zasad oceniania.
  async updateExercise(id: string, form: ExerciseFormData): Promise<Exercise> {
    return mapExercise(await apiClient.patch<ApiExercise>(`${BASE_PATH}/${numericId(id)}`, { body: mapForm(form) }));
  },

  // * DELETE /api/v1/exercises/{id} — backend egzekwuje powiązania z zestawami.
  async deleteExercise(id: string): Promise<void> {
    await apiClient.delete<void>(`${BASE_PATH}/${numericId(id)}`);
  },
};
