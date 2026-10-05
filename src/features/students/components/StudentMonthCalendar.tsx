// ==========================================
// KOMPONENT: Miesięczna siatka kalendarza ucznia
// ==========================================
// Kompaktowy widok miesiąca z markerami statusów lekcji.
// Kliknięcie w dzień zaznacza go i triggeruje panel szczegółów.

"use client";

import * as React from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toDateKey } from "@/features/calendar/utils";
import type { CalendarLessonItem } from "@/features/calendar/types";

interface StudentMonthCalendarProps {
  readonly monthDate: Date;
  readonly selectedDate: Date;
  readonly items: readonly CalendarLessonItem[];
  readonly onSelectDate: (date: Date) => void;
}

// * Nagłówki dni tygodnia (poniedziałek-pierwszy)
const WEEKDAY_LABELS = ["pn", "wt", "śr", "cz", "pt", "so", "nd"] as const;

export function StudentMonthCalendar({
  monthDate,
  selectedDate,
  items,
  onSelectDate,
}: StudentMonthCalendarProps) {
  // * Siatka 6 tygodni x 7 dni obejmująca cały miesiąc + wypełnienie z sąsiednich
  const gridDays = React.useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [monthDate]);

  // * Mapa data -> lekcje tego dnia (dla szybkiego lookupu w renderze)
  const itemsByDate = React.useMemo(() => {
    const map = new Map<string, CalendarLessonItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    return map;
  }, [items]);

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 shadow-sm">
      {/* * Nagłówki dni tygodnia */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* * Siatka dni miesiąca */}
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day) => {
          const dateKey = toDateKey(day);
          const dayItems = itemsByDate.get(dateKey) ?? [];
          const isInMonth = isSameMonth(day, monthDate);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentDay = isToday(day);

          // * Zliczanie statusów dla markerów
          const planned = dayItems.filter((i) => i.status === "planned").length;
          const cancelled = dayItems.filter(
            (i) => i.status === "cancelled",
          ).length;
          const moved = dayItems.filter((i) => i.status === "moved").length;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(day)}
              aria-label={format(day, "d MMMM yyyy", { locale: pl })}
              aria-pressed={isSelected}
              className={cn(
                "aspect-square flex flex-col items-center justify-start p-1.5 rounded-xl text-sm transition-all cursor-pointer outline-none relative",
                "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary",
                !isInMonth && "text-muted-foreground/40",
                isInMonth && !isSelected && "text-foreground",
                isSelected &&
                  "bg-primary text-primary-foreground font-bold hover:bg-primary/90",
                isCurrentDay && !isSelected && "ring-2 ring-primary/40",
              )}
            >
              {/* * Numer dnia */}
              <span
                className={cn(
                  "text-sm leading-none mt-1",
                  isSelected && "font-black",
                )}
              >
                {format(day, "d")}
              </span>

              {/* * Markery statusów lekcji (max 3 widoczne) */}
              {dayItems.length > 0 && (
                <div className="flex items-center gap-0.5 mt-auto mb-0.5">
                  {planned > 0 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected ? "bg-primary-foreground" : "bg-primary",
                      )}
                      title={`${planned} zaplanowane`}
                    />
                  )}
                  {cancelled > 0 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected
                          ? "bg-primary-foreground/70"
                          : "bg-destructive",
                      )}
                      title={`${cancelled} odwołane`}
                    />
                  )}
                  {moved > 0 && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        isSelected
                          ? "bg-primary-foreground/50"
                          : "bg-muted-foreground/60",
                      )}
                      title={`${moved} przeniesione`}
                    />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* * Legenda markerów */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-border/40 text-[11px] font-medium text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>Zaplanowane</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          <span>Odwołane</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
          <span>Przeniesione</span>
        </div>
      </div>
    </div>
  );
}
