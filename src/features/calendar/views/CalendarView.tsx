// ==========================================
// WIDOK: Globalny Kalendarz (/calendar)
// ==========================================

"use client";

import { useState, useMemo } from "react";
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
import { Calendar } from "@/components/ui/calendar";

import { useCalendarWeek } from "../hook";
import { WeeklyCalendar } from "../components/WeeklyCalendar";
import { useStudentsList } from "@/features/students/hook";
import { getStudentColor } from "@/features/students/utils";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStudentId, setSelectedStudentId] = useState<string>("all");
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const fromDate = format(weekDays[0], "yyyy-MM-dd");
  const toDate = format(weekDays[6], "yyyy-MM-dd");

  const { items, isLoading } = useCalendarWeek(
    fromDate,
    toDate,
    selectedStudentId === "all" ? undefined : selectedStudentId,
  );

  const { activeStudents } = useStudentsList();

  const monthLabel = format(currentDate, "LLLL yyyy", { locale: pl });

  // * Obsługa przycisków nawigacji (poprzedni tydzień lub dzień w zależności od szerokości ekranu) */
  const handlePrev = () => {
    if (window.innerWidth < 1280) setCurrentDate((d) => subDays(d, 1));
    else setCurrentDate((d) => subWeeks(d, 1));
  };

  // * Obsługa przycisków nawigacji (następny tydzień lub dzień w zależności od szerokości ekranu) */
  const handleNext = () => {
    if (window.innerWidth < 1280) setCurrentDate((d) => addDays(d, 1));
    else setCurrentDate((d) => addWeeks(d, 1));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Tytuł i zakres tygodnia */}
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

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          {/* Przycisk "Zaplanuj" */}
          <Button className="h-11 w-full xl:w-auto shadow-md order-1 xl:order-4">
            <Plus className="mr-2 h-4 w-4" /> Zaplanuj
          </Button>

          {/* Selekt ucznia */}
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

          {/* Przycisk "Skocz do daty" (datepicker) */}
          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center h-11 w-full xl:w-auto px-4 justify-start rounded-xl border border-input bg-card text-foreground shadow-sm font-medium text-sm transition-colors hover:bg-accent/50 order-3 xl:order-2 outline-none"
              >
                <CalendarSearch className="mr-2 h-4 w-4 text-primary" />
                Skocz do daty...
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
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

          {/* Przyciski nawigacji */}
          <div className="flex w-full xl:w-auto items-center rounded-xl border border-border/50 bg-card p-1 shadow-sm order-4 xl:order-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 flex-1 xl:flex-none"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-sm h-9 px-4 flex-1 xl:flex-none"
              onClick={() => setCurrentDate(new Date())}
            >
              <span className="block xl:hidden">Dzisiaj</span>
              <span className="hidden xl:block">Bieżący tydzień</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 flex-1 xl:flex-none"
              onClick={handleNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <WeeklyCalendar
        days={weekDays}
        selectedDate={currentDate}
        items={items}
        isLoading={isLoading}
        onItemClick={(item) => console.log("Kliknięto lekcję:", item)}
        onEmptySlotClick={(date, time) =>
          console.log("Kliknięto puste pole:", date, time)
        }
      />

      {/* LEGENDA POD KALENDARZEM */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground mt-2 px-2">
        {/* Lista Uczniów */}
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

        {/* Separator pokazujący się tylko na większych ekranach, jeśli są jacyś uczniowie */}
        {activeStudents.length > 0 && (
          <div className="h-4 border-l border-border/60 mx-1 hidden md:block" />
        )}

        {/* Statusy */}
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
      </div>
    </div>
  );
}
