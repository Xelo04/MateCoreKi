// ==========================================
// HOOK: Pobieranie i mutacje bazy zadań
// ==========================================
// Hooki do zarządzania zadaniami, zestawami i tagami.
// Każdy hook pobierający używa AbortController do czyszczenia requestów.
// Mutacje odświeżają listę po sukcesie i pokazują toast.

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ExerciseService } from "./service";
import type {
  Exercise,
  ExerciseListItem,
  ExerciseSetListItem,
  ExerciseSetDetail,
  Tag,
} from "./types";
import type { ExerciseFormData, ExerciseSetFormData } from "./schema";

// ==========================================
// HOOK: Lista zadań
// ==========================================

export function useExercisesList() {
  const [items, setItems] = useState<ExerciseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const data = await ExerciseService.getExercisesList();
        if (!controller.signal.aborted) {
          setItems(data);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Exercises fetch error:", err);
          setError("Nie udało się pobrać listy zadań");
          toast.error("Błąd ładowania zadań");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // * Tworzenie nowego zadania
  const createExercise = useCallback(
    async (form: ExerciseFormData): Promise<boolean> => {
      try {
        await ExerciseService.createExercise(form);
        toast.success("Zadanie zostało dodane");
        refetch();
        return true;
      } catch (err) {
        console.error("Create exercise error:", err);
        toast.error("Błąd dodawania zadania");
        return false;
      }
    },
    [refetch],
  );

  // * Aktualizacja istniejącego zadania
  const updateExercise = useCallback(
    async (id: string, form: ExerciseFormData): Promise<boolean> => {
      try {
        await ExerciseService.updateExercise(id, form);
        toast.success("Zadanie zostało zaktualizowane");
        refetch();
        return true;
      } catch (err) {
        console.error("Update exercise error:", err);
        toast.error("Błąd aktualizacji zadania");
        return false;
      }
    },
    [refetch],
  );

  // * Usuwanie zadania (czyści też referencje z zestawów)
  const deleteExercise = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await ExerciseService.deleteExercise(id);
        toast.success("Zadanie zostało usunięte");
        refetch();
        return true;
      } catch (err) {
        console.error("Delete exercise error:", err);
        toast.error("Błąd usuwania zadania");
        return false;
      }
    },
    [refetch],
  );

  return {
    items,
    isLoading,
    error,
    refetch,
    createExercise,
    updateExercise,
    deleteExercise,
  };
}

// ==========================================
// HOOK: Szczegóły pojedynczego zadania
// ==========================================

export function useExerciseDetails(id: string) {
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchExercise = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ExerciseService.getExercise(id);
      setExercise(data);
      setError(null);
    } catch (err) {
      console.error("Exercise details fetch error:", err);
      setError("Nie udało się pobrać szczegółów zadania");
      toast.error("Błąd ładowania zadania");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (lastFetchedIdRef.current === id) return;
    lastFetchedIdRef.current = id;
    void fetchExercise();
  }, [id, fetchExercise]);

  return { exercise, isLoading, error, refetch: fetchExercise };
}

// ==========================================
// HOOK: Lista zestawów zadań
// ==========================================

export function useExerciseSetsList() {
  const [items, setItems] = useState<ExerciseSetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const data = await ExerciseService.getExerciseSetsList();
        if (!controller.signal.aborted) {
          setItems(data);
          setError(null);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Exercise sets fetch error:", err);
          setError("Nie udało się pobrać listy zestawów");
          toast.error("Błąd ładowania zestawów");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // * Tworzenie nowego zestawu
  const createExerciseSet = useCallback(
    async (form: ExerciseSetFormData): Promise<boolean> => {
      try {
        await ExerciseService.createExerciseSet(form);
        toast.success("Zestaw został utworzony");
        refetch();
        return true;
      } catch (err) {
        console.error("Create exercise set error:", err);
        toast.error("Błąd tworzenia zestawu");
        return false;
      }
    },
    [refetch],
  );

  // * Aktualizacja zestawu
  const updateExerciseSet = useCallback(
    async (id: string, form: ExerciseSetFormData): Promise<boolean> => {
      try {
        await ExerciseService.updateExerciseSet(id, form);
        toast.success("Zestaw został zaktualizowany");
        refetch();
        return true;
      } catch (err) {
        console.error("Update exercise set error:", err);
        toast.error("Błąd aktualizacji zestawu");
        return false;
      }
    },
    [refetch],
  );

  // * Duplikacja istniejącego zestawu - tworzy kopię z tymi samymi zadaniami i parametrami
  const duplicateExerciseSet = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await ExerciseService.duplicateExerciseSet(id);
        toast.success("Utworzono kopię zestawu");
        refetch();
        return true;
      } catch (err) {
        console.error("Duplicate exercise set error:", err);
        toast.error("Błąd duplikowania zestawu");
        return false;
      }
    },
    [refetch],
  );

  // * Usuwanie zestawu (nie usuwa zadań)
  const deleteExerciseSet = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await ExerciseService.deleteExerciseSet(id);
        toast.success("Zestaw został usunięty");
        refetch();
        return true;
      } catch (err) {
        console.error("Delete exercise set error:", err);
        toast.error("Błąd usuwania zestawu");
        return false;
      }
    },
    [refetch],
  );

  return {
    items,
    isLoading,
    error,
    refetch,
    createExerciseSet,
    updateExerciseSet,
    duplicateExerciseSet,
    deleteExerciseSet,
  };
}

// ==========================================
// HOOK: Szczegóły zestawu z rozwiniętymi zadaniami
// ==========================================

export function useExerciseSetDetail(id: string) {
  const [detail, setDetail] = useState<ExerciseSetDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ExerciseService.getExerciseSetDetail(id);
      setDetail(data);
      setError(null);
    } catch (err) {
      console.error("Exercise set detail fetch error:", err);
      setError("Nie udało się pobrać szczegółów zestawu");
      toast.error("Błąd ładowania zestawu");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (lastFetchedIdRef.current === id) return;
    lastFetchedIdRef.current = id;
    void fetchDetail();
  }, [id, fetchDetail]);

  return { detail, isLoading, error, refetch: fetchDetail };
}

// ==========================================
// HOOK: Lista dostępnych tagów (cache)
// ==========================================
// * Tagi pobieramy raz i cache'ujemy - rzadko się zmieniają.
// * Używany w formularzach zadań do wyświetlania listy tagów do wyboru.

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFetchedRef = useRef(false);

  useEffect(() => {
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;

    async function load() {
      try {
        const data = await ExerciseService.getTags();
        setTags(data);
      } catch (err) {
        console.error("Tags fetch error:", err);
        toast.error("Nie udało się pobrać listy tagów");
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  return { tags, isLoading };
}
