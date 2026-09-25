// ==========================================
// KOMPONENT: Siatka Kalendarza Tygodniowego
// ==========================================

"use client";

import * as React from "react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { CornerDownRight, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarLessonItem } from "../types";
import { timeToMinutes, addMinutesToTime } from "../utils";
import { getStudentColor } from "@/features/students/utils";

interface WeeklyCalendarProps {
  days: Date[]; // Tablica 7 dni tygodnia
  selectedDate: Date; // Aktualnie wybrany dzień
  items: CalendarLessonItem[];
  onItemClick?: (item: CalendarLessonItem) => void;
  onEmptySlotClick?: (date: string, time: string) => void;
  isLoading?: boolean;
}

const START_HOUR = 0;
const END_HOUR = 23;
const MINUTE_HEIGHT = 1.4;
const HOUR_HEIGHT = 60 * MINUTE_HEIGHT;

export function WeeklyCalendar({
  days,
  selectedDate,
  items,
  onItemClick,
  onEmptySlotClick,
  isLoading,
}: WeeklyCalendarProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const isFirstRender = React.useRef(true);

  // * Generujemy tablicę godzin od START_HOUR do END_HOUR
  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  // * Automatyczny scroll do najwcześniejszej lekcji (lub 14:00 jako fallback)
  React.useLayoutEffect(() => {
    if (isFirstRender.current && scrollRef.current && !isLoading) {
      let targetHour = 14; // Fallback

      if (items.length > 0) {
        // Znjadź najwcześniejszą godzinę w minutach
        const earliestMins = Math.min(
          ...items.map((item) => timeToMinutes(item.startTime)),
        );
        // Konwertuj minuty na pełne godziny i odejmij 0.5 (żeby mieć margines nad lekcją)
        targetHour = Math.max(START_HOUR, Math.floor(earliestMins / 60) - 0.5);
      }

      const topOffset = (targetHour - START_HOUR) * HOUR_HEIGHT;
      scrollRef.current.scrollTop = topOffset;
      isFirstRender.current = false;
    }
  }, [isLoading, items]);

  // * Renderuje pojedynczy klocek lekcji w siatce
  const renderLessonBlock = (item: CalendarLessonItem) => {
    const startMins = timeToMinutes(item.startTime);
    const top = (startMins - START_HOUR * 60) * MINUTE_HEIGHT;
    const height = item.durationMins * MINUTE_HEIGHT;
    const endTime = addMinutesToTime(item.startTime, item.durationMins);

    const colorInfo = getStudentColor(item.studentId);

    const isCancelled = item.status === "cancelled";
    const isMoved = item.status === "moved";
    const isPlanned = item.status === "planned";

    return (
      <div
        key={item.id}
        onClick={(e) => {
          e.stopPropagation();
          onItemClick?.(item);
        }}
        className={cn(
          "absolute left-1 right-1 rounded-xl p-2 text-sm transition-all overflow-hidden cursor-pointer flex flex-col group",
          isPlanned &&
            cn("border-l-4 shadow-sm", colorInfo.glow, colorInfo.hoverBg),
          isCancelled &&
            "bg-destructive/5 border border-destructive/20 hover:bg-destructive/10 text-destructive/90",
          isMoved &&
            "bg-muted/30 border border-dashed border-muted-foreground/30 text-muted-foreground hover:bg-muted/50",
        )}
        style={{
          top: `${top}px`,
          height: `${height}px`,
          ...(isPlanned
            ? {
                borderLeftColor: `var(--color-${colorInfo.solid.split("-")[1]}-500)`,
              }
            : {}),
        }}
      >
        <div className="flex items-start justify-between mb-0.5">
          <div
            className={cn(
              "font-bold text-[11px] leading-tight",
              isPlanned && colorInfo.solid.replace("bg-", "text-"),
            )}
          >
            {item.startTime} - {endTime}
          </div>
        </div>

        <div
          className={cn(
            "font-semibold text-xs leading-tight line-clamp-2",
            isCancelled && "opacity-80",
          )}
        >
          {item.studentFirstName} {item.studentLastName}
        </div>

        {isCancelled && (
          <div className="mt-auto pt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-destructive/70">
            <XCircle className="h-3 w-3" /> Odwołane
          </div>
        )}

        {isMoved && item.originalDate && (
          <div className="mt-auto pt-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Na: {format(new Date(item.date), "d MMM", { locale: pl })}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] min-h-125 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden relative">
      {/* Ekran ładowania podczas pobierania danych o lekcjach i slotach. */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent shadow-lg" />
        </div>
      )}

      <div className="grid grid-cols-[50px_1fr] md:grid-cols-[60px_1fr] border-b border-border/60 bg-muted/30 relative z-10 shrink-0">
        <div className="border-r border-border/50" />
        <div className="grid grid-cols-1 xl:grid-cols-7">
          {days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "flex-col items-center justify-center py-3 border-r border-border/30 last:border-r-0",
                !isSameDay(day, selectedDate) ? "hidden xl:flex" : "flex",
              )}
            >
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {format(day, "EEEE", { locale: pl }).slice(0, 3)}
              </span>
              <span
                className={cn(
                  "text-lg font-bold mt-0.5 flex items-center justify-center h-8 w-8 rounded-full",
                  isSameDay(day, new Date())
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground",
                )}
              >
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none relative"
      >
        <div
          className="grid grid-cols-[50px_1fr] md:grid-cols-[60px_1fr] relative min-h-max"
          style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
        >
          <div className="relative border-r border-border/50 bg-card z-10">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full text-center pr-1 md:pr-2"
                style={{
                  top: `${(h - START_HOUR) * HOUR_HEIGHT}px`,
                  transform: "translateY(-50%)",
                }}
              >
                <span className="text-[10px] md:text-xs font-medium text-muted-foreground bg-card py-1 px-1">
                  {h}:00
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-7 relative bg-background">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-border/40 pointer-events-none"
                style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
              />
            ))}

            {days.map((day, i) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayItems = items.filter((item) => item.date === dateStr);

              return (
                <div
                  key={i}
                  className={cn(
                    "relative border-r border-border/30 last:border-r-0 cursor-pointer group hover:bg-muted/10 transition-colors",
                    !isSameDay(day, selectedDate) ? "hidden xl:block" : "block",
                  )}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const mins = y / MINUTE_HEIGHT;
                    const totalMins = START_HOUR * 60 + mins;
                    const snappedMins = Math.floor(totalMins / 30) * 30;
                    const h = Math.floor(snappedMins / 60);
                    const m = snappedMins % 60;
                    onEmptySlotClick?.(
                      dateStr,
                      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
                    );
                  }}
                >
                  {dayItems.map(renderLessonBlock)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
