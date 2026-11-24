// ==========================================
// STORE: Filtry bazy zadań zachowywane między widokami
// ==========================================

"use client";

import { useCallback, useContext, type Dispatch, type SetStateAction } from "react";
import { create } from "zustand";
import { DEFAULT_EXERCISE_FILTERS, type ExerciseFilters } from "@/features/exercise-database/utils";
import { InitialSessionContext } from "./use-session-store";

interface ExerciseFiltersStore {
  readonly byUser: Readonly<Record<number, ExerciseFilters>>;
  readonly update: (userId: number, value: SetStateAction<ExerciseFilters>) => void;
}

export const useExerciseFiltersStore = create<ExerciseFiltersStore>((set) => ({
  byUser: {},
  update: (userId, value) => set((state) => {
    const previous = state.byUser[userId] ?? DEFAULT_EXERCISE_FILTERS;
    const filters = typeof value === "function" ? value(previous) : value;
    return { byUser: { ...state.byUser, [userId]: filters } };
  }),
}));

export function useExerciseFilters(): {
  readonly filters: ExerciseFilters;
  readonly setFilters: Dispatch<SetStateAction<ExerciseFilters>>;
} {
  const userId = useContext(InitialSessionContext)?.user.id;
  const filters = useExerciseFiltersStore((state) =>
    userId === undefined ? DEFAULT_EXERCISE_FILTERS : state.byUser[userId] ?? DEFAULT_EXERCISE_FILTERS,
  );
  const update = useExerciseFiltersStore((state) => state.update);
  const setFilters = useCallback<Dispatch<SetStateAction<ExerciseFilters>>>((value) => {
    if (userId === undefined) throw new Error("Brak sesji użytkownika dla filtrów zadań.");
    update(userId, value);
  }, [update, userId]);

  return { filters, setFilters };
}
