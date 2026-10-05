// ==========================================
// Pobieranie i mutacje kalendarza tygodniowego.
// ==========================================
// useCalendarWeek — pobiera lekcje na zakres dat i udostępnia akcje CRUD
// Obsługa powiadomień toast i odświeżania po każdej mutacji.

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CalendarService } from "./service";
import type { CalendarLessonItem } from "./types";
import type {
  LessonCancelData,
  LessonMoveData,
  LessonNotesData,
  LessonCreateData,
} from "./schema";

export function useCalendarWeek(from: string, to: string, studentId?: string) {
  const [items, setItems] = useState<CalendarLessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // * Inkrementowany przy ręcznym refetch — wymusza ponowny useEffect
  const [fetchKey, setFetchKey] = useState(0);

  // * Główne pobieranie danych — przerywa poprzedni request przez AbortController
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      try {
        const data = await CalendarService.getCalendarLessons(
          from,
          to,
          studentId,
        );
        if (!controller.signal.aborted) {
          setItems(data);
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          console.error("Calendar fetch error:", err);
          toast.error("Błąd ładowania kalendarza");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [from, to, studentId, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // * Zapis notatek i tematu lekcji
  const updateLessonNotes = useCallback(
    async (
      lessonStudentId: string,
      date: string,
      startTime: string,
      durationMins: number,
      data: LessonNotesData,
    ): Promise<boolean> => {
      try {
        await CalendarService.updateLessonNotes(
          lessonStudentId,
          date,
          startTime,
          durationMins,
          data,
        );
        toast.success("Notatki zostały zapisane");
        refetch();
        return true;
      } catch (err) {
        console.error("Update notes error:", err);
        toast.error("Błąd zapisu notatek");
        return false;
      }
    },
    [refetch],
  );

  // * Przeniesienie lekcji na inny termin
  const moveLesson = useCallback(
    async (
      lessonStudentId: string,
      originalDate: string,
      originalStartTime: string,
      durationMins: number,
      data: LessonMoveData,
    ): Promise<boolean> => {
      try {
        await CalendarService.moveLesson(
          lessonStudentId,
          originalDate,
          originalStartTime,
          durationMins,
          data,
        );
        toast.success("Lekcja została przeniesiona");
        refetch();
        return true;
      } catch (err) {
        console.error("Move lesson error:", err);
        toast.error("Błąd przenoszenia lekcji");
        return false;
      }
    },
    [refetch],
  );

  // * Odwołanie lekcji (przez ucznia lub nauczyciela)
  const cancelLesson = useCallback(
    async (
      lessonStudentId: string,
      date: string,
      startTime: string,
      durationMins: number,
      data: LessonCancelData,
    ): Promise<boolean> => {
      try {
        await CalendarService.cancelLesson(
          lessonStudentId,
          date,
          startTime,
          durationMins,
          data,
        );
        toast.success("Lekcja została odwołana");
        refetch();
        return true;
      } catch (err) {
        console.error("Cancel lesson error:", err);
        toast.error("Błąd odwoływania lekcji");
        return false;
      }
    },
    [refetch],
  );

  // * Przełączenie statusu płatności (opłacone / nieopłacone)
  const togglePayment = useCallback(
    async (
      lessonStudentId: string,
      date: string,
      startTime: string,
      durationMins: number,
      isPaid: boolean,
    ): Promise<boolean> => {
      try {
        await CalendarService.toggleLessonPayment(
          lessonStudentId,
          date,
          startTime,
          durationMins,
          isPaid,
        );
        toast.success(
          isPaid ? "Oznaczono jako opłacone" : "Cofnięto status płatności",
        );
        refetch();
        return true;
      } catch (err) {
        console.error("Toggle payment error:", err);
        toast.error("Błąd przy zmianie statusu płatności");
        return false;
      }
    },
    [refetch],
  );

  // * Utworzenie nowej lekcji lub cyklu
  const createLesson = useCallback(
    async (data: LessonCreateData): Promise<boolean> => {
      try {
        await CalendarService.createLesson(data);
        toast.success("Zajęcia zostały zaplanowane!");
        refetch();
        return true;
      } catch (err) {
        console.error("Create lesson error:", err);
        toast.error("Wystąpił błąd przy planowaniu zajęć.");
        return false;
      }
    },
    [refetch],
  );

  return {
    items,
    isLoading,
    refetch,
    createLesson,
    updateLessonNotes,
    moveLesson,
    cancelLesson,
    togglePayment,
  };
}
