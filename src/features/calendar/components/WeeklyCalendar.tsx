// ==========================================
// KOMPONENT: Siatka Kalendarza Tygodniowego
// ==========================================
// Widok siatki 7 dni x 24h z blokami lekcji, scrollowaniem do pierwszej
// lekcji i klikaniem w puste sloty do szybkiego planowania.

"use client";

import * as React from "react";
import { format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import { CornerDownRight, XCircle, Repeat, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarLessonItem } from "../types";
import { timeToMinutes, addMinutesToTime, parseDateKey } from "../utils";
import { getStudentColor } from "@/features/students/utils";
import { CalendarSettings } from "@/config";

interface WeeklyCalendarProps {
  readonly days: Date[];
  readonly selectedDate: Date;
  readonly items: readonly CalendarLessonItem[];
  readonly onItemClick?: (item: CalendarLessonItem) => void;
  readonly onEmptySlotClick?: (date: string, time: string) => void;
  readonly isLoading?: boolean;
}

const START_HOUR = 0;
const END_HOUR = 23;
// * 1.4 px/min -> 84 px/h — wystarczająca gęstość do czytelnych bloków
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

  // * Stała tablica godzin — nie zmienia się między renderami
  const hours = React.useMemo(
    () =>
      Array.from(
        { length: END_HOUR - START_HOUR + 1 },
        (_, i) => START_HOUR + i,
      ),
    [],
  );

  // * Przy pierwszym renderze scrolluj do najwcześniejszej lekcji (lub 14:00)
  React.useEffect(() => {
    if (!isFirstRender.current || !scrollRef.current || isLoading) return;

    let targetHour = 14;
    if (items.length > 0) {
      const earliestMins = Math.min(
        ...items.map((item) => timeToMinutes(item.startTime)),
      );
      targetHour = Math.max(START_HOUR, Math.floor(earliestMins / 60) - 0.5);
    }

    scrollRef.current.scrollTop = (targetHour - START_HOUR) * HOUR_HEIGHT;
    isFirstRender.current = false;
  }, [isLoading, items]);

  // * Pojedynczy blok lekcji na siatce — pozycjonowany absolutnie
  const renderLessonBlock = (item: CalendarLessonItem) => {
    const startMins = timeToMinutes(item.startTime);
    const top = (startMins - START_HOUR * 60) * MINUTE_HEIGHT;
    const height = item.durationMins * MINUTE_HEIGHT;
    const endTime = addMinutesToTime(item.startTime, item.durationMins);

    const colorInfo = getStudentColor(item.studentId);
    const isCancelled = item.status === "cancelled";
    const isMoved = item.status === "moved";
    const isPlanned = item.status === "planned";
    const isRecurring = item.id.startsWith("v-") || Boolean(item.originalDate);

    // * Wyciągamy nazwę koloru z klasy Tailwind (np. bg-blue-500 -> blue)
    const colorName = colorInfo.solid.split("-")[1];

    return (
      <div
        key={item.id}
        role="button"
        tabIndex={0}
        aria-label={`${item.studentFirstName} ${item.studentLastName}, ${item.startTime}–${endTime}`}
        onClick={(e) => {
          e.stopPropagation();
          onItemClick?.(item);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onItemClick?.(item);
          }
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
            ? { borderLeftColor: `var(--color-${colorName}-500)` }
            : {}),
        }}
      >
        {/* * Ikony statusu płatności i typu lekcji (prawy górny róg) */}
        {!isCancelled && !isMoved && (
          <div className="absolute top-2 right-2 flex flex-col items-center gap-1.5">
            {CalendarSettings.showPaymentStatus && (
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full font-black leading-none shadow-xs ring-1",
                  item.isPaid
                    ? "bg-emerald-500 text-white ring-emerald-600/30 text-[10px]"
                    : "bg-amber-400 text-amber-950 ring-amber-600/25 text-[12px]",
                )}
                title={item.isPaid ? "Opłacone" : "Do zapłaty"}
              >
                {item.isPaid ? "✓" : "!"}
              </div>
            )}
            <div
              className="flex items-center justify-center text-muted-foreground/70"
              title={isRecurring ? "Zajęcia regularne" : "Zajęcia jednorazowe"}
            >
              {isRecurring ? (
                <Repeat className="h-3 w-3" strokeWidth={2.5} />
              ) : (
                <Calendar className="h-3 w-3" strokeWidth={2.5} />
              )}
            </div>
          </div>
        )}

        {/* * Godziny i nazwisko ucznia */}
        <div
          className="font-bold text-[11px] leading-tight pr-6 mb-0.5 truncate"
          style={
            isPlanned ? { color: `var(--color-${colorName}-500)` } : undefined
          }
        >
          {item.startTime} - {endTime}
        </div>

        <div
          className={cn(
            "font-semibold text-xs leading-tight line-clamp-2 pr-6",
            isCancelled && "opacity-80",
          )}
        >
          {item.studentFirstName} {item.studentLastName}
        </div>

        {/* * Badge odwołania na dole bloku */}
        {isCancelled && (
          <div className="mt-auto pt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-destructive/70">
            <XCircle className="h-3 w-3" /> Odwołane
          </div>
        )}

        {/* * Informacja o nowym terminie dla przeniesionej lekcji */}
        {isMoved && item.originalDate && (
          <div className="mt-auto pt-1 flex items-center gap-1 text-[10px] font-medium text-muted-foreground/80">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            <span className="truncate">
              Na: {format(parseDateKey(item.date), "d MMM", { locale: pl })}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-170px)] min-h-125 rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden relative">
      {/* * Overlay ładowania — pełnoekranowy blur na siatce */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-r-transparent shadow-lg" />
        </div>
      )}

      {/* * Nagłówki dni tygodnia (pon–niedz) */}
      <div className="grid grid-cols-[50px_1fr] md:grid-cols-[60px_1fr] border-b border-border/60 bg-muted/30 relative z-10 shrink-0">
        <div className="border-r border-border/50" />
        <div className="grid grid-cols-1 xl:grid-cols-7">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            return (
              <div
                key={dateKey}
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
            );
          })}
        </div>
      </div>

      {/* * Scrollowalna siatka godzin z blokami lekcji */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-none relative"
      >
        <div
          className="grid grid-cols-[50px_1fr] md:grid-cols-[60px_1fr] relative min-h-max"
          style={{ height: `${hours.length * HOUR_HEIGHT}px` }}
        >
          {/* * Kolumna z etykietami godzin (lewa strona) */}
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

          {/* * Siatka dni z liniami godzinowymi i blokami lekcji */}
          <div className="grid grid-cols-1 xl:grid-cols-7 relative bg-background">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full border-t border-border/40 pointer-events-none"
                style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}
              />
            ))}

            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayItems = items.filter((item) => item.date === dateStr);

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "relative border-r border-border/30 last:border-r-0 cursor-pointer group hover:bg-muted/10 transition-colors",
                    !isSameDay(day, selectedDate) ? "hidden xl:block" : "block",
                  )}
                  // * Kliknięcie w pusty slot — otwiera modal planowania
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const totalMins = START_HOUR * 60 + y / MINUTE_HEIGHT;
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
