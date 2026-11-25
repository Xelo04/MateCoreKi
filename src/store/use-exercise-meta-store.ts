// ==========================================
// STORE: Wspólne słowniki metadanych zadań
// ==========================================

import { create } from "zustand";
import { apiClient } from "@/lib/api/api-client";
import { metaSchema, type ExerciseMeta } from "@/features/exercise-database/schema";

interface ExerciseMetaState {
  meta: ExerciseMeta | null;
  loading: boolean;
  error: string | null;
}

interface ExerciseMetaActions {
  load: () => Promise<void>;
  retry: () => void;
}

export const useExerciseMetaStore = create<ExerciseMetaState & ExerciseMetaActions>((set, get) => ({
  meta: null,
  loading: false,
  error: null,
  load: async () => {
    if (get().meta || get().loading || get().error) return;
    set({ loading: true });
    try {
      const meta = metaSchema.parse(await apiClient.get<unknown>("/api/v1/exercises/meta"));
      set({ meta, loading: false });
    } catch (error) {
      console.error("Nie udało się pobrać metadanych zadań:", error);
      set({ error: "Nie udało się pobrać metadanych zadań lub serwer zwrócił nieobsługiwane wartości.", loading: false });
    }
  },
  retry: () => {
    set({ error: null });
    void get().load();
  },
}));
