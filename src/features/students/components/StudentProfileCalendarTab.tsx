// ==========================================
// KOMPONENT: Zakładka "Kalendarz" w profilu ucznia
// ==========================================
// Widok miesięczny (desktop) z blokami lekcji w komórkach.
// Widok mobilny w stylu natywnych kalendarzy: kompaktowy miesiąc + lista dnia.

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  format,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  XCircle,
  CornerDownRight,
  Repeat,
  Calendar as CalendarIcon,
  CalendarSearch,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

import { useCalendarWeek } from "@/features/calendar/hook";
import { LessonFormModal } from "@/features/calendar/components/LessonFormModal";
import { LessonDetailsModal } from "@/features/calendar/components/LessonDetailsModal";
import { toDateKey, addMinutesToTime } from "@/features/calendar/utils";
import { getStudentColor } from "@/features/students/utils";
import { CalendarSettings } from "@/config";
import type { CalendarLessonItem } from "@/features/calendar/types";
import type {
  LessonCreateData,
  LessonNotesData,
  LessonMoveData,
  LessonCancelData,
} from "@/features/calendar/schema";

interface StudentCalendarTabProps {
  readonly studentId: string;
}

// * Nagłówki dni tygodnia (pełne i skrócone)
const WEEKDAY_LABELS_SHORT = [
  "Pn",
  "Wt",
  "Śr",
  "Cz",
  "Pt",
  "So",
  "Nd",
] as const;

// * Ile lekcji mieści się w komórce desktopowej przed "+ N więcej"
const MAX_VISIBLE_LESSONS = 2;

export function StudentCalendarTab({ studentId }: StudentCalendarTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formDefaults, setFormDefaults] = useState<Partial<LessonCreateData>>(
    {},
  );
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] =
    useState<CalendarLessonItem | null>(null);

  // * Kolor przypisany do tego ucznia (dla bloków lekcji)
  const colorInfo = getStudentColor(studentId);

  // * Zakres pobierania obejmuje całą siatkę 6×7
  const { gridDays, fromDate, toDate } = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(currentMonth), {
      weekStartsOn: 1,
    });
    const gridEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return {
      gridDays: eachDayOfInterval({ start: gridStart, end: gridEnd }),
      fromDate: toDateKey(gridStart),
      toDate: toDateKey(gridEnd),
    };
  }, [currentMonth]);

  // * Hook kalendarza przefiltrowany na tego ucznia
  const {
    items,
    isLoading,
    createLesson,
    updateLessonNotes,
    moveLesson,
    cancelLesson,
    togglePayment,
  } = useCalendarWeek(fromDate, toDate, studentId);

  // * Mapa data -> lekcje (posortowane chronologicznie)
  const itemsByDate = useMemo(() => {
    const map = new Map<string, CalendarLessonItem[]>();
    for (const item of items) {
      const list = map.get(item.date) ?? [];
      list.push(item);
      map.set(item.date, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [items]);

  // * Lekcje wybranego dnia (dla widoku mobilnego)
  const selectedDateKey = toDateKey(selectedDate);
  const selectedDayItems = useMemo(
    () => itemsByDate.get(selectedDateKey) ?? [],
    [itemsByDate, selectedDateKey],
  );

  const monthLabel = format(currentMonth, "LLLL yyyy", { locale: pl });

  // * Nawigacja
  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((d) => subMonths(d, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((d) => addMonths(d, 1));
  }, []);

  const handleToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  }, []);

  // * Wybór dnia (mobile — zmienia listę pod spodem)
  const handleSelectDate = useCallback((day: Date) => {
    setSelectedDate(day);
  }, []);

  // * Skok do konkretnej daty z date pickera
  const handleJumpToDate = useCallback((date: Date | undefined) => {
    if (date) {
      setCurrentMonth(date);
      setSelectedDate(date);
    }
    setIsDatePickerOpen(false);
  }, []);

  // * Klik w pusty dzień → planowanie z prefill daty
  const handleEmptyDayClick = useCallback(
    (day: Date) => {
      setFormDefaults({
        studentId,
        date: toDateKey(day),
        recurrence: "none",
      });
      setIsFormOpen(true);
    },
    [studentId],
  );

  // * Przycisk nagłówkowy planowania
  const handlePlanClick = useCallback(() => {
    setFormDefaults({
      studentId,
      date: toDateKey(selectedDate),
      recurrence: "none",
    });
    setIsFormOpen(true);
  }, [studentId, selectedDate]);

  // * Klik w lekcję → modal szczegółów
  const handleItemClick = useCallback((item: CalendarLessonItem) => {
    setSelectedLesson(item);
    setIsDetailsOpen(true);
  }, []);

  // * Mutacje — delegacja do hooka
  const handleCreateSubmit = async (data: LessonCreateData): Promise<boolean> =>
    createLesson(data);

  const handleUpdateNotes = async (data: LessonNotesData): Promise<boolean> => {
    if (!selectedLesson) return false;
    return updateLessonNotes(
      selectedLesson.studentId,
      selectedLesson.date,
      selectedLesson.startTime,
      selectedLesson.durationMins,
      data,
    );
  };

  const handleMoveLesson = async (data: LessonMoveData): Promise<boolean> => {
    if (!selectedLesson) return false;
    return moveLesson(
      selectedLesson.studentId,
      selectedLesson.date,
      selectedLesson.startTime,
      selectedLesson.durationMins,
      data,
    );
  };

  const handleCancelLesson = async (
    data: LessonCancelData,
  ): Promise<boolean> => {
    if (!selectedLesson) return false;
    return cancelLesson(
      selectedLesson.studentId,
      selectedLesson.date,
      selectedLesson.startTime,
      selectedLesson.durationMins,
      data,
    );
  };

  const handleTogglePayment = async (isPaid: boolean): Promise<boolean> => {
    if (!selectedLesson) return false;
    return togglePayment(
      selectedLesson.studentId,
      selectedLesson.date,
      selectedLesson.startTime,
      selectedLesson.durationMins,
      isPaid,
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* * Pasek nawigacji — identyczny layout jak w CalendarView (bez filtra ucznia) */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <CalendarIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground capitalize">
              {monthLabel}
            </h2>
            {/* * Na mobile — wybrany dzień */}
            <p className="text-sm text-muted-foreground block xl:hidden capitalize">
              {format(selectedDate, "EEEE, d MMM", { locale: pl })}
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          {/* * Przycisk planowania */}
          <Button
            className="h-11 w-full xl:w-auto shadow-md order-1 xl:order-3"
            onClick={handlePlanClick}
          >
            <Plus className="mr-2 h-4 w-4" /> Zaplanuj
          </Button>

          {/* * Skok do daty */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center h-11 w-full xl:w-auto px-4 justify-start rounded-xl border border-input bg-card text-foreground shadow-sm font-medium text-sm transition-colors hover:bg-accent/50 order-2 xl:order-2 outline-none cursor-pointer"
                aria-label="Skocz do wybranej daty"
              >
                <CalendarSearch className="mr-2 h-4 w-4 text-primary" />
                Skocz do daty...
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComp
                mode="single"
                selected={selectedDate}
                onSelect={handleJumpToDate}
                locale={pl}
                defaultMonth={currentMonth}
                className="rounded-xl font-sans"
              />
            </PopoverContent>
          </Popover>

          {/* * Nawigacja prev / dzisiaj / next */}
          <div className="flex w-full xl:w-auto items-center rounded-xl border border-border/50 bg-card p-1 shadow-sm order-3 xl:order-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 flex-1 xl:flex-none"
              onClick={handlePrevMonth}
              aria-label="Poprzedni miesiąc"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm h-9 px-4 flex-1 xl:flex-none"
              onClick={handleToday}
            >
              Dzisiaj
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 flex-1 xl:flex-none"
              onClick={handleNextMonth}
              aria-label="Następny miesiąc"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ===== DESKTOP: Pełna siatka miesięczna z blokami lekcji ===== */}
      <div className="hidden md:block relative rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          </div>
        )}

        {/* * Nagłówek dni tygodnia */}
        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30">
          {WEEKDAY_LABELS_SHORT.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 border-r border-border/30 last:border-r-0"
            >
              {label}
            </div>
          ))}
        </div>

        {/* * Siatka dni */}
        <div className="grid grid-cols-7 auto-rows-fr">
          {gridDays.map((day) => {
            const dateKey = toDateKey(day);
            const dayItems = itemsByDate.get(dateKey) ?? [];
            const isInMonth = isSameMonth(day, currentMonth);
            const isCurrentDay = isToday(day);

            return (
              <DesktopDayCell
                key={dateKey}
                day={day}
                items={dayItems}
                isInMonth={isInMonth}
                isCurrentDay={isCurrentDay}
                colorInfo={colorInfo}
                onEmptyClick={() => handleEmptyDayClick(day)}
                onItemClick={handleItemClick}
              />
            );
          })}
        </div>
      </div>

      {/* ===== MOBILE: Kompaktowy miesiąc + lista dnia ===== */}
      <div className="md:hidden space-y-4">
        {/* * Kompaktowa siatka miesięczna (jak w natywnym kalendarzu) */}
        <div className="relative rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-r-transparent" />
            </div>
          )}

          <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30">
            {WEEKDAY_LABELS_SHORT.map((label) => (
              <div
                key={label}
                className="text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground py-2"
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 p-1 gap-0.5">
            {gridDays.map((day) => {
              const dateKey = toDateKey(day);
              const dayItems = itemsByDate.get(dateKey) ?? [];
              const isInMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);
              const isSelected = isSameDay(day, selectedDate);
              const hasPlanned = dayItems.some((i) => i.status === "planned");
              const hasCancelled = dayItems.some(
                (i) => i.status === "cancelled",
              );

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => handleSelectDate(day)}
                  aria-label={format(day, "d MMMM", { locale: pl })}
                  aria-pressed={isSelected}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center rounded-xl transition-all outline-none relative",
                    "focus-visible:ring-2 focus-visible:ring-primary",
                    !isInMonth && "text-muted-foreground/30",
                    isInMonth &&
                      !isSelected &&
                      !isCurrentDay &&
                      "text-foreground",
                    isCurrentDay && !isSelected && "ring-2 ring-primary/40",
                    isSelected &&
                      "bg-primary text-primary-foreground shadow-sm",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-bold leading-none",
                      isSelected && "font-black",
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* * Kropki pod numerem dnia — widać że są zajęcia */}
                  {isInMonth && (hasPlanned || hasCancelled) && (
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {hasPlanned && (
                        <span
                          className={cn(
                            "h-1 w-1 rounded-full",
                            isSelected
                              ? "bg-primary-foreground"
                              : colorInfo.solid,
                          )}
                        />
                      )}
                      {hasCancelled && (
                        <span
                          className={cn(
                            "h-1 w-1 rounded-full",
                            isSelected
                              ? "bg-primary-foreground/60"
                              : "bg-destructive",
                          )}
                        />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* * Lista lekcji wybranego dnia */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold text-foreground capitalize">
              {format(selectedDate, "EEEE, d MMMM", { locale: pl })}
            </h3>
            <Button
              variant="outline"
              size="sm"
              className="h-9"
              onClick={handlePlanClick}
            >
              <Plus className="mr-1.5 h-4 w-4" /> Dodaj
            </Button>
          </div>

          {selectedDayItems.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center space-y-2 rounded-2xl border border-dashed border-border/50 bg-secondary/10 py-10 text-center cursor-pointer hover:bg-secondary/20 transition-colors"
              onClick={handlePlanClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePlanClick();
                }
              }}
            >
              <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Brak zajęć — kliknij aby zaplanować
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDayItems.map((item) => (
                <MobileLessonCard
                  key={item.id}
                  item={item}
                  colorInfo={colorInfo}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* * Modal planowania nowej lekcji */}
      <LessonFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        defaultValues={formDefaults}
        onSubmit={handleCreateSubmit}
        hideStudentSelect={true}
      />

      {/* * Modal szczegółów i akcji istniejącej lekcji */}
      <LessonDetailsModal
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        item={selectedLesson}
        onUpdateNotes={handleUpdateNotes}
        onMoveLesson={handleMoveLesson}
        onCancelLesson={handleCancelLesson}
        onTogglePayment={handleTogglePayment}
      />
    </div>
  );
}

// ==========================================
// POMOCNICZY: Komórka dnia (DESKTOP)
// ==========================================

interface DesktopDayCellProps {
  readonly day: Date;
  readonly items: readonly CalendarLessonItem[];
  readonly isInMonth: boolean;
  readonly isCurrentDay: boolean;
  readonly colorInfo: ReturnType<typeof getStudentColor>;
  readonly onEmptyClick: () => void;
  readonly onItemClick: (item: CalendarLessonItem) => void;
}

function DesktopDayCell({
  day,
  items,
  isInMonth,
  isCurrentDay,
  colorInfo,
  onEmptyClick,
  onItemClick,
}: DesktopDayCellProps) {
  const hasItems = items.length > 0;
  const visibleItems = items.slice(0, MAX_VISIBLE_LESSONS);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div
      className={cn(
        "min-h-28 border-r border-b border-border/30 last:border-r-0 flex flex-col p-1.5 gap-1 transition-colors group",
        !isInMonth && "bg-muted/20",
        isInMonth && !hasItems && "cursor-pointer hover:bg-muted/30",
      )}
      onClick={!hasItems && isInMonth ? onEmptyClick : undefined}
      role={!hasItems && isInMonth ? "button" : undefined}
      tabIndex={!hasItems && isInMonth ? 0 : undefined}
      onKeyDown={(e) => {
        if (!hasItems && isInMonth && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onEmptyClick();
        }
      }}
      aria-label={
        !hasItems && isInMonth
          ? `Dodaj zajęcia na ${format(day, "d MMMM", { locale: pl })}`
          : undefined
      }
    >
      {/* * Numer dnia */}
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-bold flex items-center justify-center h-6 w-6 rounded-full shrink-0",
            !isInMonth && "text-muted-foreground/40",
            isInMonth && !isCurrentDay && "text-foreground",
            isCurrentDay && "bg-primary text-primary-foreground",
          )}
        >
          {format(day, "d")}
        </span>

        {/* * Ikonka "+" na hover pustego dnia */}
        {!hasItems && isInMonth && (
          <Plus className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
        )}
      </div>

      {/* * Bloki lekcji */}
      {visibleItems.map((item) => (
        <DesktopLessonBlock
          key={item.id}
          item={item}
          colorInfo={colorInfo}
          onClick={onItemClick}
        />
      ))}

      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onItemClick(items[MAX_VISIBLE_LESSONS]);
          }}
          className="text-[10px] font-bold text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded-md hover:bg-muted/50 transition-colors text-left cursor-pointer"
        >
          +{hiddenCount} więcej
        </button>
      )}
    </div>
  );
}

// ==========================================
// POMOCNICZY: Blok lekcji w komórce (DESKTOP)
// ==========================================

interface DesktopLessonBlockProps {
  readonly item: CalendarLessonItem;
  readonly colorInfo: ReturnType<typeof getStudentColor>;
  readonly onClick: (item: CalendarLessonItem) => void;
}

function DesktopLessonBlock({
  item,
  colorInfo,
  onClick,
}: DesktopLessonBlockProps) {
  const endTime = addMinutesToTime(item.startTime, item.durationMins);
  const isPlanned = item.status === "planned";
  const isCancelled = item.status === "cancelled";
  const isMoved = item.status === "moved";
  const isRecurring = item.id.startsWith("v-") || Boolean(item.originalDate);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
      aria-label={`Lekcja ${item.startTime}–${endTime}, status ${item.status}`}
      title={`${item.startTime}–${endTime} (${item.durationMins} min)${
        item.topic ? ` · ${item.topic}` : ""
      }`}
      className={cn(
        "flex items-center justify-between gap-1 px-1.5 py-1 rounded-lg text-[11px] font-semibold text-left transition-all cursor-pointer min-w-0 outline-none w-full",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
        isPlanned &&
          cn("border-l-[3px] shadow-xs", colorInfo.glow, colorInfo.hoverBg),
        isCancelled &&
          "bg-destructive/10 text-destructive/80 hover:bg-destructive/20 line-through",
        isMoved &&
          "bg-muted/60 text-muted-foreground hover:bg-muted border border-dashed border-muted-foreground/30",
      )}
    >
      {/* * Lewa strona: godzina + ikona statusu */}
      <div className="flex items-center gap-1 min-w-0">
        {isCancelled && (
          <XCircle className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        {isMoved && (
          <CornerDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
        )}
        <span className="shrink-0 tabular-nums">{item.startTime}</span>
      </div>

      {/* * Prawa strona: ikony płatności i cykliczności (jak w głównym kalendarzu) */}
      {isPlanned && (
        <div className="flex items-center gap-1 shrink-0">
          {isRecurring ? (
            <Repeat
              className="h-2.5 w-2.5 text-muted-foreground/70"
              strokeWidth={2.5}
              aria-label="Zajęcia regularne"
            />
          ) : (
            <CalendarIcon
              className="h-2.5 w-2.5 text-muted-foreground/70"
              strokeWidth={2.5}
              aria-label="Zajęcia jednorazowe"
            />
          )}

          {CalendarSettings.showPaymentStatus && (
            <div
              className={cn(
                "flex h-3.5 w-3.5 items-center justify-center rounded-full font-black leading-none ring-1",
                item.isPaid
                  ? "bg-emerald-500 text-white ring-emerald-600/30 text-[8px]"
                  : "bg-amber-400 text-amber-950 ring-amber-600/25 text-[10px]",
              )}
              title={item.isPaid ? "Opłacone" : "Do zapłaty"}
            >
              {item.isPaid ? "✓" : "!"}
            </div>
          )}
        </div>
      )}
    </button>
  );
}

// ==========================================
// POMOCNICZY: Karta lekcji (MOBILE)
// ==========================================

interface MobileLessonCardProps {
  readonly item: CalendarLessonItem;
  readonly colorInfo: ReturnType<typeof getStudentColor>;
  readonly onClick: (item: CalendarLessonItem) => void;
}

function MobileLessonCard({ item, colorInfo, onClick }: MobileLessonCardProps) {
  const endTime = addMinutesToTime(item.startTime, item.durationMins);
  const isPlanned = item.status === "planned";
  const isCancelled = item.status === "cancelled";
  const isMoved = item.status === "moved";
  const isRecurring = item.id.startsWith("v-") || Boolean(item.originalDate);

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      className={cn(
        "flex items-center justify-between w-full rounded-2xl border px-4 py-3.5 transition-all cursor-pointer text-left focus-visible:ring-2 focus-visible:ring-primary outline-none",
        isPlanned &&
          cn("border-l-4 shadow-sm", colorInfo.glow, colorInfo.hoverBg),
        isCancelled &&
          "border-destructive/20 bg-destructive/5 hover:bg-destructive/10",
        isMoved &&
          "border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40",
      )}
    >
      {/* * Lewa strona: godziny, czas trwania, temat */}
      <div className="flex flex-col min-w-0 gap-0.5">
        <span
          className={cn(
            "text-base font-bold",
            isCancelled && "text-destructive/80 line-through",
            isMoved && "text-muted-foreground",
          )}
        >
          {item.startTime} – {endTime}
        </span>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {item.durationMins} min
          </span>

          {isRecurring && isPlanned && (
            <span className="flex items-center gap-0.5">
              <Repeat className="h-3 w-3" strokeWidth={2.5} />
              Regularne
            </span>
          )}
        </div>

        {/* * Temat (jeśli jest) */}
        {item.topic && isPlanned && (
          <span className="text-xs text-foreground/70 mt-0.5 truncate">
            {item.topic}
          </span>
        )}

        {/* * Status odwołanej */}
        {isCancelled && (
          <span className="text-xs font-medium text-destructive/70 flex items-center gap-1 mt-0.5">
            <XCircle className="h-3 w-3" />
            Odwołane przez {item.whoCancelled === "tutor" ? "Ciebie" : "ucznia"}
          </span>
        )}

        {/* * Status przeniesionej */}
        {isMoved && (
          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
            <CornerDownRight className="h-3 w-3 shrink-0" />
            Przeniesione na inny termin
          </span>
        )}
      </div>

      {/* * Prawa strona: status płatności (identyczny mechanizm jak w WeeklyCalendar) */}
      {isPlanned && CalendarSettings.showPaymentStatus && (
        <div className="flex flex-col items-center gap-1.5 shrink-0 ml-3">
          <div
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full font-black leading-none shadow-xs ring-1",
              item.isPaid
                ? "bg-emerald-500 text-white ring-emerald-600/30 text-[10px]"
                : "bg-amber-400 text-amber-950 ring-amber-600/25 text-[12px]",
            )}
            title={item.isPaid ? "Opłacone" : "Do zapłaty"}
          >
            {item.isPaid ? "✓" : "!"}
          </div>
        </div>
      )}
    </button>
  );
}
