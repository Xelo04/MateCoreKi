// ==========================================
// HOOK: useStudentsList & useStudentDetails
// ==========================================
// Zarządza stanem listy uczniów oraz szczegółów ucznia z obsługą asynchronicznych efektów

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { StudentService } from "./service";
import type { StudentDetails, StudentListItem } from "./types";
import type { StudentFormData } from "./schema";

export function useStudentsList() {
  const [students, setStudents] = useState<StudentListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // * Funkcja do pobrania listy uczniów
  const fetchStudents = useCallback(async () => {
    try {
      setIsLoading(true);
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

  // * Pobiera listę uczniów po zamontowaniu bez wywoływania synchronicznego setState w ciele efektu
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        void fetchStudents();
      }
    });
    return () => {
      isMounted = false;
    };
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

  return {
    students,
    activeStudents: students.filter((s) => s.status === "active"),
    archivedStudents: students.filter((s) => s.status === "archived"),
    isLoading,
    error,
    archiveStudent,
    restoreStudent,
    refetch: fetchStudents,
  };
}

export function useStudentDetails(id: string) {
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // * Funkcja do pobrania szczegółów ucznia
  const fetchStudent = useCallback(async () => {
    try {
      setIsLoading(true);
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

  // * Pobiera dane po zamontowaniu/zmianie id bez synchronicznego wywoływania setState
  useEffect(() => {
    let isMounted = true;
    Promise.resolve().then(() => {
      if (isMounted) {
        void fetchStudent();
      }
    });
    return () => {
      isMounted = false;
    };
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
