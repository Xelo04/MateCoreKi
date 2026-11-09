// ==========================================
// HOOK: Pobieranie i mutacje bazy zadań
// ==========================================
// * Hooki zadań, tagów i kategorii. Wspólny wzorzec „fetch → loading →
// * error → refetch” jest zaimplementowany RAZ (useServiceResource); publiczne
// * hooki są cienkimi wrapperami z zachowaniem dotychczasowego API zwracanych pól.
// * Mutacje przechodzą przez runMutation: toast + refetch listy po sukcesie.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ExerciseService } from "./service";
import type {
  CategoryNode,
  Exercise,
  ExerciseListItem,
  Tag,
} from "./types";
import type { ExerciseFormData } from "./schema";

// ==========================================
// INFRASTRUKTURA: Generyczny zasób pobierany z serwisu
// ==========================================

interface ResourceMessages {
  // * Komunikat trzymany w stanie `error` (dla widoku z ErrorState)
  readonly stateError: string;
  // * Komunikat toast pokazywany użytkownikowi
  readonly toastError: string;
  // * Kontekst do console.error
  readonly logContext: string;
}

interface ResourceState<T> {
  readonly data: T;
  readonly isLoading: boolean;
  readonly error: string | null;
}

// * Ładuje dane funkcją `load` i udostępnia stan + refetch + lokalny setter danych.
// * - `load` MUSI mieć stabilną referencję (stała modułowa lub useCallback);
// *   zmiana `load` (np. inny id) resetuje stan i pobiera dane od nowa.
// * - `messages` powinno być stałą modułową (jest zależnością efektu).
function useServiceResource<T>(
  load: () => Promise<T>,
  initialValue: T,
  messages: ResourceMessages,
) {
  const [state, setState] = useState<ResourceState<T>>({
    data: initialValue,
    isLoading: true,
    error: null,
  });
  const [fetchKey, setFetchKey] = useState(0);
  const [trackedLoad, setTrackedLoad] = useState(() => load);

  // * Reset stanu przy zmianie `load` (np. zmiana id) wykonujemy podczas renderu —
  // * wzorzec „adjusting state on prop change” z dokumentacji Reacta. Dzięki niemu
  // * nie potrzebujemy synchronicznego setState na początku efektu.
  if (trackedLoad !== load) {
    setTrackedLoad(() => load);
    setState({ data: initialValue, isLoading: true, error: null });
  }

  // * Pobranie danych. Cleanup ustawia flagę, więc spóźniona odpowiedź
  // * nie nadpisze stanu po odmontowaniu lub zmianie zależności.
  useEffect(() => {
    let isCancelled = false;

    async function run() {
      try {
        const data = await load();
        if (isCancelled) return;
        setState({ data, isLoading: false, error: null });
      } catch (err) {
        console.error(`${messages.logContext}:`, err);
        // * Celowe wyciszenie po anulowaniu requestu (brak setState po unmount)
        if (isCancelled) return;
        // * Zachowujemy poprzednie dane — błąd nie kasuje tego, co użytkownik już widzi
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: messages.stateError,
        }));
        toast.error(messages.toastError);
      }
    }

    void run();
    return () => {
      isCancelled = true;
    };
  }, [load, fetchKey, messages]);

  // * Ponowne pobranie danych (np. po mutacji). Loading ustawiamy w handlerze, nie w efekcie.
  const refetch = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true }));
    setFetchKey((key) => key + 1);
  }, []);

  // * Lokalna aktualizacja danych bez ponownego pobierania (np. dodanie tagu)
  const setData = useCallback((updater: (previous: T) => T) => {
    setState((prev) => ({ ...prev, data: updater(prev.data) }));
  }, []);

  return { ...state, refetch, setData };
}

// ==========================================
// INFRASTRUKTURA: Wspólny runner mutacji
// ==========================================

interface MutationMessages {
  readonly success: string;
  readonly error: string;
  readonly logContext: string;
}

// * Wykonuje mutację, pokazuje toast i wywołuje onSuccess (refetch).
// * Zwraca true/false, żeby widok mógł zamknąć modal lub zostawić go otwartego.
async function runMutation(
  action: () => Promise<unknown>,
  messages: MutationMessages,
  onSuccess: () => void,
): Promise<boolean> {
  try {
    await action();
    toast.success(messages.success);
    onSuccess();
    return true;
  } catch (err) {
    console.error(`${messages.logContext}:`, err);
    toast.error(messages.error);
    return false;
  }
}

// ==========================================
// STAŁE: Loadery i komunikaty (stabilne referencje modułowe)
// ==========================================

const loadExercisesList = () => ExerciseService.getExercisesList();
const loadTags = () => ExerciseService.getTags();
const loadCategoriesTree = () => ExerciseService.getCategoriesTree();

const EXERCISES_LIST_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać listy zadań",
  toastError: "Błąd ładowania zadań",
  logContext: "Exercises fetch error",
};
const EXERCISE_DETAILS_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać szczegółów zadania",
  toastError: "Błąd ładowania zadania",
  logContext: "Exercise details fetch error",
};
const TAGS_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać listy tagów",
  toastError: "Nie udało się pobrać listy tagów",
  logContext: "Tags fetch error",
};
const CATEGORIES_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać drzewa kategorii",
  toastError: "Nie udało się pobrać drzewa kategorii",
  logContext: "Categories fetch error",
};

const EXERCISE_MUTATIONS = {
  create: {
    success: "Zadanie zostało dodane",
    error: "Błąd dodawania zadania",
    logContext: "Create exercise error",
  },
  update: {
    success: "Zadanie zostało zaktualizowane",
    error: "Błąd aktualizacji zadania",
    logContext: "Update exercise error",
  },
  remove: {
    success: "Zadanie zostało usunięte",
    error: "Błąd usuwania zadania",
    logContext: "Delete exercise error",
  },
} as const satisfies Record<string, MutationMessages>;

// ==========================================
// HOOK: Lista zadań
// ==========================================

export function useExercisesList() {
  const { data, isLoading, error, refetch } = useServiceResource<
    ExerciseListItem[]
  >(loadExercisesList, [], EXERCISES_LIST_MESSAGES);

  // * Tworzenie zadania; true = sukces (lista odświeżona)
  const createExercise = useCallback(
    (form: ExerciseFormData): Promise<boolean> =>
      runMutation(
        () => ExerciseService.createExercise(form),
        EXERCISE_MUTATIONS.create,
        refetch,
      ),
    [refetch],
  );

  // * Aktualizacja zadania; true = sukces
  const updateExercise = useCallback(
    (id: string, form: ExerciseFormData): Promise<boolean> =>
      runMutation(
        () => ExerciseService.updateExercise(id, form),
        EXERCISE_MUTATIONS.update,
        refetch,
      ),
    [refetch],
  );

  // * Usuwanie zadania (serwis czyści też referencje z zestawów); true = sukces
  const deleteExercise = useCallback(
    (id: string): Promise<boolean> =>
      runMutation(
        () => ExerciseService.deleteExercise(id),
        EXERCISE_MUTATIONS.remove,
        refetch,
      ),
    [refetch],
  );

  return {
    items: data,
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
  // * Nowa funkcja `load` przy zmianie id → useServiceResource resetuje stan i pobiera dane
  const load = useCallback(() => ExerciseService.getExercise(id), [id]);
  const { data, isLoading, error, refetch } =
    useServiceResource<Exercise | null>(load, null, EXERCISE_DETAILS_MESSAGES);

  return { exercise: data, isLoading, error, refetch };
}

// ==========================================
// HOOK: Lista dostępnych tagów (+ tworzenie inline)
// ==========================================
// * Tagi pobieramy raz na zamontowanie komponentu (dane rzadko się zmieniają).
// ? Instancje hooka nie współdzielą stanu: tag dodany w formularzu zadania pojawi się
// ? w filtrze tagów widoku listy dopiero po jego ponownym zamontowaniu.

export function useTags() {
  const { data, isLoading, setData } = useServiceResource<Tag[]>(
    loadTags,
    [],
    TAGS_MESSAGES,
  );

  // * Tworzy tag i dodaje go do lokalnej listy. Serwis zwraca istniejący tag dla duplikatu —
  // * wtedy nie dodajemy go drugi raz (kolizja `key`) i informujemy użytkownika.
  const createTag = useCallback(
    async (name: string): Promise<Tag | null> => {
      try {
        const tag = await ExerciseService.createTag(name);
        const isAlreadyListed = data.some((existing) => existing.id === tag.id);

        setData((previous) =>
          previous.some((existing) => existing.id === tag.id)
            ? previous
            : [...previous, tag],
        );

        if (isAlreadyListed) {
          toast.info(`Tag „${tag.name}” już istnieje`);
        } else {
          toast.success(`Dodano tag „${tag.name}”`);
        }
        return tag;
      } catch (err) {
        console.error("Create tag error:", err);
        toast.error("Błąd tworzenia tagu");
        return null;
      }
    },
    [data, setData],
  );

  return { tags: data, isLoading, createTag };
}

// ==========================================
// HOOK: Drzewo kategorii
// ==========================================
// * Pobierane raz na zamontowanie komponentu; używane przez formularze i filtry działów.

export function useCategoriesTree() {
  const { data, isLoading } = useServiceResource<CategoryNode[]>(
    loadCategoriesTree,
    [],
    CATEGORIES_MESSAGES,
  );

  return { tree: data, isLoading };
}

// ==========================================
// HOOK: Szczegóły wielu zadań naraz (cache sesyjny)
// ==========================================
// * Pobiera pełne zadania dla podanych ID RÓWNOLEGLE i trzyma je w cache'u instancji.
// * Używany przez podgląd zestawu w kreatorze (zastępuje pobieranie N+1 w każdym elemencie).
// * `ids` musi być stabilną referencją (useMemo); `isEnabled=false` wstrzymuje pobieranie.
// ? Nieudane ID nie są ponawiane w obrębie życia komponentu (element można usunąć z zestawu).

export function useExerciseDetailsMap(
  ids: readonly string[],
  isEnabled: boolean,
) {
  const [details, setDetails] = useState<ReadonlyMap<string, Exercise>>(
    () => new Map(),
  );
  const [failedIds, setFailedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  // * ID, o które już zapytaliśmy (zapobiega dublowaniu requestów między renderami)
  const requestedIdsRef = useRef<Set<string>>(new Set());
  const isMountedRef = useRef(false);

  // * Znacznik zamontowania — chroni przed zapisem stanu po odmontowaniu.
  // * Ref mutowany wyłącznie w efekcie (React 19).
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // * Dociąga brakujące zadania. Nie anulujemy requestów przy zmianie `ids` —
  // * wynik trafia do cache'u i tak, a dublowanie zapytań jest blokowane przez requestedIdsRef.
  useEffect(() => {
    if (!isEnabled) return;

    const missingIds = ids.filter((id) => !requestedIdsRef.current.has(id));
    if (missingIds.length === 0) return;

    missingIds.forEach((id) => requestedIdsRef.current.add(id));

    async function loadMissing() {
      const results = await Promise.allSettled(
        missingIds.map((id) => ExerciseService.getExercise(id)),
      );
      if (!isMountedRef.current) return;

      const loaded = new Map<string, Exercise>();
      const failed = new Set<string>();

      results.forEach((result, index) => {
        const id = missingIds[index];
        if (result.status === "fulfilled" && result.value) {
          loaded.set(id, result.value);
          return;
        }
        failed.add(id);
        if (result.status === "rejected") {
          console.error("Exercise details fetch error:", result.reason);
        }
      });

      setDetails((previous) => new Map([...previous, ...loaded]));
      if (failed.size > 0) {
        setFailedIds((previous) => new Set([...previous, ...failed]));
      }
    }

    void loadMissing();
  }, [ids, isEnabled]);

  return { details, failedIds };
}
