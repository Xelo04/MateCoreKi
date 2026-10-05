// ==========================================
// WIDOK: Globalny Kalendarz (/calendar)
// ==========================================
// Główny widok kalendarza. Zarządza nawigacją i filtrem uczniów.
// Select filtru uczniów posiada opcję dodania ucznia inline bezpośrednio pod nagłówkiem.

"use client";

import {
  useState,
  useMemo,
  useSyncExternalStore,
  useCallback,
  useRef,
} from "react";
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
  UserRoundPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import { useStudentsList } from "@/features/students/hook";
import {
  StudentForm,
  type StudentFormHandle,
} from "@/features/students/components/StudentForm";
import { getStudentColor } from "@/features/students/utils";
import { cn } from "@/lib/utils";
import type {
  LessonCreateData,
  LessonNotesData,
  LessonMoveData,
  LessonCancelData,
} from "../schema";
import type { CalendarLessonItem } from "../types";
import { LessonDetailsModal } from "../components/LessonDetailsModal";
import { CalendarSettings } from "@/config";

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

  // * Stany dla tworzenia studenta inline pod nagłówkiem
  const [isAddingStudentInline, setIsAddingStudentInline] = useState(false);
  const studentFormRef = useRef<StudentFormHandle>(null);
  const [isSavingStudent, setIsSavingStudent] = useState(false);

  const isMobile = useSyncExternalStore(
    (callback) => {
      window.addEventListener("resize", callback);
      return () => window.removeEventListener("resize", callback);
    },
    () => window.innerWidth < 1280,
    () => false,
  );

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const fromDate = format(weekDays[0], "yyyy-MM-dd");
  const toDate = format(weekDays[6], "yyyy-MM-dd");

  const {
    items,
    isLoading,
    refetch,
    updateLessonNotes,
    moveLesson,
    cancelLesson,
    togglePayment,
  } = useCalendarWeek(
    fromDate,
    toDate,
    selectedStudentId === "all" ? undefined : selectedStudentId,
  );

  const { activeStudents, refetch: refetchStudents } = useStudentsList();

  const monthLabel = format(currentDate, "LLLL yyyy", { locale: pl });

  // * Nawigacja kalendarza
  const handlePrev = useCallback(() => {
    setCurrentDate((d) => (isMobile ? subDays(d, 1) : subWeeks(d, 1)));
  }, [isMobile]);

  const handleNext = useCallback(() => {
    setCurrentDate((d) => (isMobile ? addDays(d, 1) : addWeeks(d, 1)));
  }, [isMobile]);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // * Obsługa wyboru studenta w selectie
  const handleStudentFilterChange = useCallback((val: string) => {
    if (val === "add-new-student-main-filter") {
      setIsAddingStudentInline(true);
      setSelectedStudentId("all");
    } else {
      setSelectedStudentId(val);
    }
  }, []);

  // * Zapis studenta dodawanego inline
  const handleSaveStudentInline = useCallback(async () => {
    if (!studentFormRef.current) return;
    setIsSavingStudent(true);
    const result = await studentFormRef.current.submit();
    setIsSavingStudent(false);

    if (result.success && result.studentId) {
      await refetchStudents();
      setSelectedStudentId(result.studentId); // * Automatycznie wybierz nowo dodanego studenta
      setIsAddingStudentInline(false);
    }
  }, [refetchStudents]);

  const handleCancelSaveStudentInline = useCallback(() => {
    setIsAddingStudentInline(false);
  }, []);

  // * Szybkie planowanie
  const handlePlanClick = useCallback(() => {
    setModalDefaults({
      studentId: selectedStudentId === "all" ? undefined : selectedStudentId,
      date: format(currentDate, "yyyy-MM-dd"),
    });
    setIsModalOpen(true);
  }, [selectedStudentId, currentDate]);

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

  const handleCreateSubmit = async (): Promise<boolean> => {
    refetch();
    return true;
  };

  // * Detale lekcji
  const handleItemClick = useCallback((item: CalendarLessonItem) => {
    setSelectedLesson(item);
    setIsDetailsModalOpen(true);
  }, []);

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
      {/* * Pasek górny filtrów i akcji */}
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

        <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
          <Button
            className="h-11 w-full xl:w-auto shadow-md order-1 xl:order-4"
            onClick={handlePlanClick}
          >
            <Plus className="mr-2 h-4 w-4" /> Zaplanuj
          </Button>

          {/* * Filtrowanie z opcją "Dodaj studenta" */}
          <Select
            value={selectedStudentId}
            onValueChange={handleStudentFilterChange}
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
              <Separator className="my-1.5" />
              <SelectItem
                value="add-new-student-main-filter"
                className="text-primary font-bold focus:text-primary focus:bg-primary/5 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <UserRoundPlus className="h-4 w-4" />
                  Dodaj nowego ucznia
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

          <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center h-11 w-full xl:w-auto px-4 justify-start rounded-xl border border-input bg-card text-foreground shadow-sm font-medium text-sm transition-colors hover:bg-accent/50 order-3 xl:order-2 outline-none cursor-pointer"
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
              onClick={handleToday}
            >
              <span>Dzisiaj</span>
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

      {/* * Formularz dodawania studenta inline pod filtrami (rozwijany) */}
      {isAddingStudentInline && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
              <UserRoundPlus className="h-4 w-4" />
              Szybkie tworzenie profilu ucznia
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancelSaveStudentInline}
              className="text-muted-foreground hover:text-foreground h-8"
            >
              Anuluj
            </Button>
          </div>

          <StudentForm ref={studentFormRef} mode="add" />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/10">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelSaveStudentInline}
              disabled={isSavingStudent}
            >
              Anuluj
            </Button>
            <Button
              type="button"
              onClick={handleSaveStudentInline}
              disabled={isSavingStudent}
              className="h-11 min-w-28"
            >
              {isSavingStudent ? "Zapisywanie..." : "Utwórz profil ucznia"}
            </Button>
          </div>
        </div>
      )}

      <WeeklyCalendar
        days={weekDays}
        selectedDate={currentDate}
        items={items}
        isLoading={isLoading}
        onItemClick={handleItemClick}
        onEmptySlotClick={handleEmptySlotClick}
      />

      {/* LEGENDA STATUSÓW I KOLORÓW */}
      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground mt-2 px-2">
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

        {/* Legendy typu zajęć */}
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

        {/* Legendy płatności */}
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

      <LessonFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        defaultValues={modalDefaults}
        onSubmit={handleCreateSubmit}
      />

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
