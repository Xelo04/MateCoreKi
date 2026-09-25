// ==========================================
// HOOK: Pobieranie klocków kalendarza
// ==========================================

"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { CalendarService } from "./service";
import type { CalendarLessonItem } from "./types";

export function useCalendarWeek(from: string, to: string, studentId?: string) {
  const [items, setItems] = useState<CalendarLessonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCalendar = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsLoading(true);
      try {
        const data = await CalendarService.getCalendarLessons(
          from,
          to,
          studentId,
        );
        setItems(data);
      } catch {
        toast.error("Błąd ładowania kalendarza");
      } finally {
        setIsLoading(false);
      }
    },
    [from, to, studentId],
  );

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      try {
        const data = await CalendarService.getCalendarLessons(
          from,
          to,
          studentId,
        );
        if (!ignore) setItems(data);
      } catch {
        if (!ignore) toast.error("Błąd ładowania kalendarza");
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    void load();
    return () => {
      ignore = true;
    };
  }, [from, to, studentId]);

  return { items, isLoading, refetch: () => fetchCalendar(true) };
}
