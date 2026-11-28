// ==========================================
// HOOK: Dane i mutacje zestawów zadań
// ==========================================

"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExerciseSetService } from "./service";
import type {
  ExerciseSetDetail,
  ExerciseSetFolder,
  ExerciseSetListItem,
} from "./types";

interface ResourceMessages {
  readonly stateError: string;
  readonly toastError: string;
  readonly logContext: string;
}

interface ResourceState<T> {
  readonly data: T;
  readonly isLoading: boolean;
  readonly error: string | null;
}

const SETS_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać listy zestawów",
  toastError: "Błąd ładowania zestawów",
  logContext: "Exercise sets fetch error",
};

const DETAIL_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać szczegółów zestawu",
  toastError: "Błąd ładowania zestawu",
  logContext: "Exercise set detail fetch error",
};

const FOLDERS_MESSAGES: ResourceMessages = {
  stateError: "Nie udało się pobrać folderów zestawów",
  toastError: "Błąd ładowania folderów zestawów",
  logContext: "Exercise set folders fetch error",
};

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
  const [requestKey, setRequestKey] = useState(0);
  const [trackedLoad, setTrackedLoad] = useState(() => load);

  if (trackedLoad !== load) {
    setTrackedLoad(() => load);
    setState({ data: initialValue, isLoading: true, error: null });
  }

  useEffect(() => {
    let isCancelled = false;

    async function fetchResource() {
      try {
        const data = await load();
        if (isCancelled) return;
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        console.error(`${messages.logContext}:`, error);
        if (isCancelled) return;
        setState((previous) => ({
          ...previous,
          isLoading: false,
          error: messages.stateError,
        }));
        toast.error(messages.toastError);
      }
    }

    void fetchResource();
    return () => {
      isCancelled = true;
    };
  }, [load, messages, requestKey]);

  const refetch = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: true }));
    setRequestKey((key) => key + 1);
  }, []);

  const setData = useCallback((updater: (previous: T) => T) => {
    setState((previous) => ({ ...previous, data: updater(previous.data) }));
  }, []);

  return { ...state, refetch, setData };
}

async function runMutation(
  action: () => Promise<unknown>,
  success: string,
  errorMessage: string,
  logContext: string,
  onSuccess: () => void,
): Promise<boolean> {
  try {
    await action();
    toast.success(success);
    onSuccess();
    return true;
  } catch (error) {
    console.error(`${logContext}:`, error);
    toast.error(error instanceof Error ? error.message : errorMessage);
    return false;
  }
}

// * Udostępnia listę zestawów i mutacje używane przez zakładkę zestawów.
export function useExerciseSetsList(archived = false) {
  const load = useCallback(() => ExerciseSetService.getList(archived), [archived]);
  const { data, isLoading, error, refetch } = useServiceResource<
    ExerciseSetListItem[]
  >(load, [], SETS_MESSAGES);

  const deleteExerciseSet = useCallback(
    (id: string) =>
      runMutation(
        () => ExerciseSetService.remove(id),
        "Zestaw został usunięty",
        "Błąd usuwania zestawu",
        "Delete exercise set error",
        refetch,
      ),
    [refetch],
  );

  const moveExerciseSet = useCallback(
    (id: string, folderId: string | null) =>
      runMutation(
        () => ExerciseSetService.move(id, folderId),
        "Zestaw został przeniesiony",
        "Błąd przenoszenia zestawu",
        "Move exercise set error",
        refetch,
      ),
    [refetch],
  );

  const archiveExerciseSet = useCallback(
    (id: string) => runMutation(
      () => ExerciseSetService.archive(id), "Zestaw został zarchiwizowany",
      "Błąd archiwizacji zestawu", "Archive exercise set error", refetch,
    ),
    [refetch],
  );
  const restoreExerciseSet = useCallback(
    (id: string) => runMutation(
      () => ExerciseSetService.restore(id), "Zestaw został przywrócony",
      "Błąd przywracania zestawu", "Restore exercise set error", refetch,
    ),
    [refetch],
  );

  return {
    items: data,
    isLoading,
    error,
    refetch,
    deleteExerciseSet,
    moveExerciseSet,
    archiveExerciseSet,
    restoreExerciseSet,
  };
}

// * Pobiera szczegóły zestawu po wybraniu go do edycji albo podglądu.
export function useExerciseSetDetail(id: string) {
  const load = useCallback(() => ExerciseSetService.getDetail(id), [id]);
  const { data, isLoading, error, refetch } = useServiceResource<
    ExerciseSetDetail | null
  >(load, null, DETAIL_MESSAGES);
  return { detail: data, isLoading, error, refetch };
}

// * Pobiera foldery i zapisuje nowy folder bez ukrywania błędu przed użytkownikiem.
export function useExerciseSetFolders() {
  const load = useCallback(() => ExerciseSetService.getFolders(), []);
  const { data, isLoading, error, refetch, setData } = useServiceResource<
    ExerciseSetFolder[]
  >(load, [], FOLDERS_MESSAGES);

  const createFolder = useCallback(
    async (name: string, parentId: string | null) => {
      try {
        const folder = await ExerciseSetService.createFolder(name, parentId);
        setData((previous) => [...previous, folder]);
        toast.success("Folder został utworzony");
        return folder;
      } catch (error) {
        console.error("Create exercise set folder error:", error);
        toast.error(error instanceof Error ? error.message : "Błąd tworzenia folderu");
        return null;
      }
    },
    [setData],
  );

  const renameFolder = useCallback(
    async (id: string, name: string) => {
      try {
        const folder = await ExerciseSetService.renameFolder(id, name);
        setData((previous) => previous.map((item) => item.id === id ? folder : item));
        toast.success("Folder został zmieniony");
        return folder;
      } catch (error) {
        console.error("Rename exercise set folder error:", error);
        toast.error(error instanceof Error ? error.message : "Błąd zmiany nazwy folderu");
        return null;
      }
    },
    [setData],
  );

  const deleteFolder = useCallback(
    async (id: string, fingerprint: string) => {
      try {
        await ExerciseSetService.removeFolder(id, fingerprint);
        refetch();
        toast.success("Folder i niezadane zestawy zostały usunięte");
        return true;
      } catch (error) {
        console.error("Delete exercise set folder error:", error);
        toast.error(error instanceof Error ? error.message : "Błąd usuwania folderu");
        return false;
      }
    },
    [refetch],
  );

  return { folders: data, isLoading, error, refetch, createFolder, renameFolder, deleteFolder };
}
