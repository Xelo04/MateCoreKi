// ==========================================
// HOOK: useStudentsList
// ==========================================
// Zarządza stanem listy uczniów z wbudowanymi optymistycznymi aktualizacjami

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { StudentService } from "./service";
import type { StudentDetails, StudentListItem } from "./types";
import type { StudentFormData } from "./schema";

export function useStudentsList() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isFetchedRef = useRef(false);

  // * Funkcja do pobrania listy uczniów
  const fetchStudents = useCallback(async () => {
    try {
      const data = await StudentService.getStudentsList();
      setStudents(data);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Nie udało się pobrać listy.";
      setError(msg);
      toast.error("Błąd sieciowy", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // * Pobiera listę uczniów tylko raz przy montowaniu komponentu
  useEffect(() => {
    if (isFetchedRef.current) return;
    isFetchedRef.current = true;

    void fetchStudents();
  }, [fetchStudents]);

  // * Funkcja do archiwizacji ucznia
  const archiveStudent = useCallback(
    async (id: string) => {
      const previousStudents = [...students];
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "archived" } : s)),
      );
      try {
        await StudentService.archiveStudent(id);
        toast.success("Uczeń został zarchiwizowany.");
      } catch {
        setStudents(previousStudents);
        toast.error("Nie udało się zarchiwizować ucznia.");
      }
    },
    [students],
  );

  // * Funkcja do przywracania ucznia
  const restoreStudent = useCallback(
    async (id: string) => {
      const previousStudents = [...students];
      setStudents((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "active" } : s)),
      );
      try {
        await StudentService.restoreStudent(id);
        toast.success("Uczeń przywrócony.");
      } catch {
        setStudents(previousStudents);
        toast.error("Nie udało się przywrócić ucznia.");
      }
    },
    [students],
  );

  // * Funkcja do tworzenia nowego ucznia
  const createStudent = useCallback(
    async (form: StudentFormData): Promise<boolean> => {
      try {
        const newStudent = await StudentService.createStudent(form);
        setStudents((prev) => [newStudent, ...prev]);
        toast.success("Uczeń został dodany.");
        return true;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Nie udało się dodać ucznia.";
        toast.error("Błąd", { description: msg });
        return false;
      }
    },
    [],
  );

  // * Funkcja do aktualizacji ucznia z poziomu listy kart
  const updateStudent = useCallback(
    async (id: string, form: StudentFormData): Promise<boolean> => {
      try {
        const updatedStudent = await StudentService.updateStudent(id, form);
        setStudents((prev) =>
          prev.map((s) => (s.id === id ? updatedStudent : s)),
        );
        toast.success("Dane ucznia zostały zaktualizowane.");
        return true;
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : "Nie udało się zaktualizować ucznia.";
        toast.error("Błąd", { description: msg });
        return false;
      }
    },
    [],
  );

  return {
    students,
    activeStudents: students.filter((s) => s.status === "active"),
    archivedStudents: students.filter((s) => s.status === "archived"),
    isLoading,
    error,
    archiveStudent,
    restoreStudent,
    createStudent,
    updateStudent,
  };
}

export function useStudentDetails(id: string) {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const lastFetchedIdRef = useRef<string | null>(null);

  // * Funkcja do pobrania szczegółów ucznia
  const fetchStudent = useCallback(async () => {
    try {
      const data = await StudentService.getStudentDetails(id);
      setStudent(data);
      setError(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Błąd pobierania danych ucznia.";
      setError(msg);
      toast.error("Błąd", { description: msg });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // * Pobiera dane tylko raz przy montowaniu / zmianie id
  useEffect(() => {
    if (lastFetchedIdRef.current === id) return;
    lastFetchedIdRef.current = id;

    void fetchStudent();
  }, [id, fetchStudent]);

  // * Aktualizacja ucznia i odświeżenie danych profilu
  const updateStudent = useCallback(
    async (form: StudentFormData): Promise<boolean> => {
      try {
        await StudentService.updateStudent(id, form);
        await fetchStudent();
        toast.success("Dane ucznia zostały zaktualizowane.");
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Błąd aktualizacji.";
        toast.error("Błąd", { description: msg });
        return false;
      }
    },
    [id, fetchStudent],
  );

  return { student, isLoading, error, updateStudent, refetch: fetchStudent };
}
