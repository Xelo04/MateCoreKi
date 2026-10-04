// ==========================================
// WIDOK: Globalny Kalendarz (/calendar)
// ==========================================
// Główny widok kalendarza — nawigacja tygodniowa/dzienna, filtr ucznia,
// siatka z lekcjami, modale planowania i szczegółów, legenda statusów.

"use client";

import { useState, useMemo, useSyncExternalStore, useCallback } from "react";
import {
  startOfWeek,
  addDays,
  format,
  addWeeks,
  subWeeks,
  subDays,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Plus,
  CalendarSearch,
  X,
  Repeat,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComp } from "@/components/ui/calendar";

import { useCalendarWeek } from "../hook";
import { WeeklyCalendar } from "../components/WeeklyCalendar";
import { LessonFormModal } from "../components/LessonFormModal";
import { LessonDetailsModal } from "../components/LessonDetailsModal";
import { useStudentsList } from "@/features/students/hook";
import { getStudentColor } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import { CalendarSettings } from "@/config";
import type {
  LessonCreateData,
  LessonNotesData,
  LessonMoveData,
  LessonCancelData,
} from "../schema";
import type { CalendarLessonItem } from "../types";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDefaults, setModalDefaults] = useState<Partial<LessonCreateData>>(
    {},
  );
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] =
    useState<CalendarLessonItem | null>(null);

  // * Detekcja mobile przez useSyncExternalStore (SSR-safe)
  const isMobile = useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    () => window.innerWidth < 1280,
    () => false,
  );

  // * Dni bieżącego tygodnia (pon–niedz)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const fromDate = format(weekDays[0], "yyyy-MM-dd");
  const toDate = format(weekDays[6], "yyyy-MM-dd");

  // * Hook kalendarza — pobieranie + wszystkie mutacje
  const {
    items,
    isLoading,
    createLesson,
    updateLessonNotes,
    moveLesson,
    cancelLesson,
    togglePayment,
  } = useCalendarWeek(
    fromDate,
    toDate,
    selectedStudentId === "all" ? undefined : selectedStudentId,
  );

  const { activeStudents } = useStudentsList();

  const monthLabel = format(currentDate, "LLLL yyyy", { locale: pl });

  // * Nawigacja — na mobile przesuwamy o 1 dzień, na desktop o 1 tydzień
  const handlePrev = useCallback(() => {
    setCurrentDate((d) => (isMobile ? subDays(d, 1) : subWeeks(d, 1)));
  }, [isMobile]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => (isMobile ? addDays(d, 1) : addWeeks(d, 1)));
  }, [isMobile]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // * Otwarcie modalu planowania z prefill z nagłówka
  const handlePlanClick = useCallback(() => {
    setModalDefaults({
      studentId: selectedStudentId === "all" ? undefined : selectedStudentId,
      date: format(currentDate, "yyyy-MM-dd"),
    });
    setIsModalOpen(true);
  }, [selectedStudentId, currentDate]);

  // * Otwarcie modalu planowania z prefill z kliknięcia w pusty slot
  const handleEmptySlotClick = useCallback(
    (date: string, time: string) => {
      setModalDefaults({
        studentId: selectedStudentId === "all" ? undefined : selectedStudentId,
        date,
        startTime: time,
        recurrence: "none",
      });
      setIsModalOpen(true);
    },
    [selectedStudentId],
  );

  // * Submit nowego planowania — deleguje do hooka (toast + refetch w środku)
  const handleCreateSubmit = async (
    data: LessonCreateData,
  ): Promise<boolean> => {
    return createLesson(data);
  };

  // * Otwarcie modalu szczegółów po kliknięciu w blok lekcji
  const handleItemClick = useCallback((item: CalendarLessonItem) => {
    setSelectedLesson(item);
    setIsDetailsModalOpen(true);
  }, []);

  // * Delegacja mutacji do hooka — przekazujemy identyfikator wybranej lekcji
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
    <div className="space-y-4">
      {/* * Nagłówek z tytułem miesiąca i zakresem tygodnia */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
            <CalIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
              {monthLabel}
            </h1>
            <p className="text-sm text-muted-foreground hidden xl:block">
              {format(weekDays[0], "d MMM", { locale: pl })} -{" "}
              {format(weekDays[6], "d MMM", { locale: pl })}
            </p>
            <p className="text-sm text-muted-foreground block xl:hidden capitalize">
              {format(currentDate, "EEEE, d MMM", { locale: pl })}
            </p>
          </div>
        </div>

        {/* * Pasek narzędzi — nawigacja, skok do daty, filtr ucznia, planuj */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          {/* * Przycisk planowania nowej lekcji */}
          <Button
            className="h-11 w-full xl:w-auto shadow-md order-1 xl:order-4"
            onClick={handlePlanClick}
          >
            <Plus className="mr-2 h-4 w-4" /> Zaplanuj
          </Button>

          {/* * Filtr ucznia */}
          <Select
            value={selectedStudentId}
            onValueChange={setSelectedStudentId}
          >
            <SelectTrigger className="h-11 w-full xl:w-55 order-2 xl:order-3 bg-card">
              <SelectValue placeholder="Wszyscy uczniowie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszyscy uczniowie</SelectItem>
              {activeStudents.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* * Popover skoku do konkretnej daty */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center h-11 w-full xl:w-auto px-4 justify-start rounded-xl border border-input bg-card text-foreground shadow-sm font-medium text-sm transition-colors hover:bg-accent/50 order-3 xl:order-2 outline-none cursor-pointer"
                aria-label="Skocz do wybranej daty"
              >
                <CalendarSearch className="mr-2 h-4 w-4 text-primary" />
                Skocz do daty...
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComp
                mode="single"
                selected={currentDate}
                onSelect={(d) => {
                  if (d) setCurrentDate(d);
                  setIsDatePickerOpen(false);
                }}
                locale={pl}
                defaultMonth={currentDate}
                className="rounded-xl font-sans"
              />
            </PopoverContent>
          </Popover>

          {/* * Nawigacja prev / dzisiaj / next */}
          <div className="flex w-full xl:w-auto items-center rounded-xl border border-border/50 bg-card p-1 shadow-sm order-4 xl:order-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 flex-1 xl:flex-none"
              onClick={handlePrev}
              aria-label="Poprzedni"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm h-9 px-4 flex-1 xl:flex-none"
              onClick={handleToday}
            >
              <span>Dzisiaj</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 flex-1 xl:flex-none"
              onClick={handleNext}
              aria-label="Następny"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* * Siatka kalendarza tygodniowego */}
      <WeeklyCalendar
        days={weekDays}
        selectedDate={currentDate}
        items={items}
        isLoading={isLoading}
        onItemClick={handleItemClick}
        onEmptySlotClick={handleEmptySlotClick}
      />

      {/* * Legenda statusów, kolorów uczniów i ikon */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground mt-2 px-2">
        {/* * Kolory przypisane do uczniów */}
        {activeStudents.map((student) => {
          const colorInfo = getStudentColor(student.id);
          return (
            <div key={student.id} className="flex items-center gap-1.5">
              <div
                className={cn("h-2.5 w-2.5 rounded-full", colorInfo.solid)}
              />
              <span className="truncate max-w-30">
                {student.firstName} {student.lastName}
              </span>
            </div>
          );
        })}

        {activeStudents.length > 0 && (
          <div className="h-4 border-l border-border/60 mx-1 hidden md:block" />
        )}

        {/* * Statusy lekcji */}
        <div className="flex items-center gap-1.5">
          <div className="h-3.5 w-3.5 rounded-[4px] border border-destructive/20 bg-destructive/10 flex items-center justify-center">
            <X className="h-2.5 w-2.5 text-destructive/70" strokeWidth={3} />
          </div>
          <span>Odwołane</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-sm border border-dashed border-muted-foreground/40 bg-muted/20" />
          <span>Przesunięte</span>
        </div>

        <div className="h-4 border-l border-border/60 mx-1 hidden md:block" />

        {/* * Typ zajęć */}
        <div className="flex items-center gap-1.5">
          <Repeat
            className="h-3.5 w-3.5 text-muted-foreground/70"
            strokeWidth={2.5}
          />
          <span>Regularne</span>
        </div>

        <div className="flex items-center gap-1.5">
          <CalendarIcon
            className="h-3.5 w-3.5 text-muted-foreground/70"
            strokeWidth={2.5}
          />
          <span>Jednorazowe</span>
        </div>

        {/* * Status płatności */}
        {CalendarSettings.showPaymentStatus && (
          <>
            <div className="h-4 border-l border-border/60 mx-1 hidden md:block" />

            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow-xs">
                ✓
              </div>
              <span>Opłacone</span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[12px] font-black text-amber-950 shadow-xs">
                !
              </div>
              <span>Do zapłaty</span>
            </div>
          </>
        )}
      </div>

      {/* * Modal planowania nowej lekcji */}
      <LessonFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultValues={modalDefaults}
        onSubmit={handleCreateSubmit}
      />

      {/* * Modal szczegółów i akcji istniejącej lekcji */}
      <LessonDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        item={selectedLesson}
        onUpdateNotes={handleUpdateNotes}
        onMoveLesson={handleMoveLesson}
        onCancelLesson={handleCancelLesson}
        onTogglePayment={handleTogglePayment}
      />
    </div>
  );
}
