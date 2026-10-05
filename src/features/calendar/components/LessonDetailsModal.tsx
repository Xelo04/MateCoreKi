// ==========================================
// KOMPONENT: Modal Szczegółów i Akcji Lekcji
// ==========================================
// Modal z zakładkami: notatki, przenoszenie, odwoływanie.
// Nagłówek z datą, przełącznik płatności, sprawdzanie kolizji przy przenoszeniu.

"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarClock,
  Clock,
  CircleDollarSign,
  Check,
  X,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  User,
  GraduationCap,
  Repeat,
  Calendar,
} from "lucide-react";

import { ModalShell } from "@/components/ui/modal-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import type { CalendarLessonItem, OverlapConflict } from "../types";
import {
  lessonNotesSchema,
  lessonMoveSchema,
  lessonCancelSchema,
  type LessonNotesData,
  type LessonMoveData,
  type LessonCancelData,
} from "../schema";
import { CalendarSettings } from "@/config";
import { CalendarService } from "../service";
import { cn } from "@/lib/utils";
import {
  addMinutesToTime,
  timeToMinutes,
  parseDateKey,
  WEEK_DAYS,
} from "../utils";

interface LessonDetailsModalProps {
  readonly item: CalendarLessonItem | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onUpdateNotes: (data: LessonNotesData) => Promise<boolean>;
  readonly onMoveLesson: (data: LessonMoveData) => Promise<boolean>;
  readonly onCancelLesson: (data: LessonCancelData) => Promise<boolean>;
  readonly onTogglePayment: (isPaid: boolean) => Promise<boolean>;
}

export function LessonDetailsModal({
  item,
  open,
  onOpenChange,
  onUpdateNotes,
  onMoveLesson,
  onCancelLesson,
  onTogglePayment,
}: LessonDetailsModalProps) {
  // * Stan płatności lokalnie - optymistyczny update z rollbackiem
  const [prevItemId, setPrevItemId] = useState<string | null>(null);
  const [overrideIsPaid, setOverrideIsPaid] = useState<boolean | null>(null);

  const currentItemId = item?.id ?? null;
  if (currentItemId !== prevItemId) {
    setPrevItemId(currentItemId);
    setOverrideIsPaid(null);
  }

  const localIsPaid = overrideIsPaid ?? item?.isPaid ?? false;

  // ==========================================
  // FORMULARZ: Notatki
  // ==========================================
  const notesForm = useForm<LessonNotesData>({
    resolver: zodResolver(lessonNotesSchema),
    values: {
      topic: item?.topic || "",
      tutorNotes: item?.tutorNotes || "",
    },
  });

  // ==========================================
  // FORMULARZ: Przeniesienie
  // ==========================================
  const moveForm = useForm<LessonMoveData>({
    resolver: zodResolver(lessonMoveSchema),
    values: {
      scope: "single",
      date: item?.date || "",
      dayOfWeek: item?.date ? parseDateKey(item.date).getDay() || 7 : undefined,
      recurrence: "weekly",
      startTime: item?.startTime || "",
      durationMins: item?.durationMins || 60,
      tutorNotes: item?.tutorNotes || "",
    },
  });

  // ==========================================
  // FORMULARZ: Odwołanie
  // ==========================================
  const cancelForm = useForm<LessonCancelData>({
    resolver: zodResolver(lessonCancelSchema),
    values: {
      whoCancelled: item?.whoCancelled || "student",
      tutorNotes: "",
    },
  });

  // * Watchowane pola do sprawdzania kolizji w czasie rzeczywistym
  const watchedMoveScope = useWatch({
    control: moveForm.control,
    name: "scope",
  });
  const watchedMoveDate = useWatch({ control: moveForm.control, name: "date" });
  const watchedMoveTime = useWatch({
    control: moveForm.control,
    name: "startTime",
  });
  const watchedMoveRecurrence = useWatch({
    control: moveForm.control,
    name: "recurrence",
  });
  const watchedMoveDay = useWatch({
    control: moveForm.control,
    name: "dayOfWeek",
  });

  const [moveConflicts, setMoveConflicts] = useState<
    readonly OverlapConflict[]
  >([]);
  const [isCheckingMove, setIsCheckingMove] = useState(false);
  const [moveOverlapChecked, setMoveOverlapChecked] = useState(false);

  // * Ostrzeżenie gdy przenosimy lekcję w przeszłość
  const isPastMove = useMemo(() => {
    if (watchedMoveScope !== "single" || !watchedMoveDate || !watchedMoveTime)
      return false;
    const mins = timeToMinutes(watchedMoveTime);
    if (isNaN(mins)) return false;
    const targetDate = parseDateKey(watchedMoveDate);
    targetDate.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return targetDate < new Date();
  }, [watchedMoveScope, watchedMoveDate, watchedMoveTime]);

  // * Debounced sprawdzanie kolizji przy zmianie terminu (350ms)
  useEffect(() => {
    if (!open || !item) return;

    let cancelled = false;

    const canCheck =
      watchedMoveScope === "single"
        ? !!watchedMoveDate &&
          !!watchedMoveTime &&
          (watchedMoveDate !== item.date || watchedMoveTime !== item.startTime)
        : !!watchedMoveDay && !!watchedMoveRecurrence && !!watchedMoveTime;

    if (!canCheck) {
      const timer = setTimeout(() => {
        if (!cancelled) {
          setMoveConflicts([]);
          setIsCheckingMove(false);
          setMoveOverlapChecked(false);
        }
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    const timer = setTimeout(() => {
      if (!cancelled) setIsCheckingMove(true);
      void (async () => {
        try {
          const result = await CalendarService.checkOverlap({
            date:
              watchedMoveScope === "single"
                ? watchedMoveDate || item.date
                : item.date,
            startTime: watchedMoveTime,
            durationMins: item.durationMins,
            recurrence:
              watchedMoveScope === "single"
                ? "none"
                : (watchedMoveRecurrence ?? "weekly"),
            dayOfWeek: watchedMoveScope === "all" ? watchedMoveDay : undefined,
          });
          if (!cancelled) {
            // * Odfiltruj samą siebie z listy kolizji
            const filtered = result.filter(
              (c) =>
                !(
                  c.date === item.date &&
                  c.startTime === item.startTime &&
                  c.studentFirstName === item.studentFirstName
                ),
            );
            setMoveConflicts(filtered);
            setMoveOverlapChecked(true);
          }
        } catch {
          if (!cancelled) {
            setMoveConflicts([]);
            setMoveOverlapChecked(false);
          }
        } finally {
          if (!cancelled) setIsCheckingMove(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    watchedMoveScope,
    watchedMoveDate,
    watchedMoveTime,
    watchedMoveRecurrence,
    watchedMoveDay,
    open,
    item,
  ]);

  // * Optymistyczny toggle płatności z rollbackiem przy błędzie
  const handleTogglePayment = async () => {
    if (!item) return;
    const previousState = localIsPaid;
    const newState = !previousState;

    setOverrideIsPaid(newState);

    const success = await onTogglePayment(newState);
    if (!success) {
      setOverrideIsPaid(previousState);
    }
  };

  const formatConflictDate = (d: string) => {
    try {
      return format(parseDateKey(d), "d MMM yyyy", { locale: pl });
    } catch {
      return d;
    }
  };

  // ! Guard PO wszystkich hookach - inaczej ESLint rules-of-hooks
  if (!item) return null;

  const isRecurring = Boolean(item.id.startsWith("v-") || item.originalDate);
  const isPlanned = item.status === "planned";
  const isCancelled = item.status === "cancelled";
  const isGhost = item.status === "moved";
  const endTime = addMinutesToTime(item.startTime, item.durationMins);

  // * Formatowanie daty nagłówka
  const dateObj = parseDateKey(item.date);
  const monthStr = format(dateObj, "MMM", { locale: pl }).toUpperCase();
  const dayStr = format(dateObj, "d");
  const dowStr = format(dateObj, "EEE", { locale: pl });

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<CalendarClock className="h-6 w-6 text-white" />}
      title="Zarządzaj zajęciami"
      hideFooter={true}
      onClose={() => onOpenChange(false)}
    >
      <div className="space-y-6 pb-2">
        {/* * Nagłówek z datą, godziną i nazwiskiem ucznia */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 py-2">
          <div className="flex items-center gap-4 min-w-0">
            {/* * Kafelek z datą (miesiąc / dzień / dzień tygodnia) */}
            <div className="flex flex-col items-center justify-center bg-card rounded-2xl shadow-sm border border-border/60 py-2.5 w-18 shrink-0">
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {monthStr}
              </span>
              <span className="text-2xl font-black text-foreground leading-none my-1">
                {dayStr}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground capitalize">
                {dowStr}
              </span>
            </div>

            {/* * Nazwisko ucznia i godzina */}
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-2xl font-bold text-foreground leading-tight truncate">
                {item.studentFirstName} {item.studentLastName}
              </h2>
              <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground mt-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                <span>
                  {item.startTime} – {endTime}
                  <span className="ml-1 hidden xs:inline-block">
                    ({item.durationMins} min)
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* * Ikona typu zajęć (regularne / jednorazowe) */}
            {!isGhost && (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/60 bg-card text-muted-foreground"
                title={
                  isRecurring ? "Zajęcia regularne" : "Zajęcia jednorazowe"
                }
              >
                {isRecurring ? (
                  <Repeat className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </div>
            )}

            {/* * Przycisk przełączania statusu płatności z animacją hover */}
            {!isGhost && CalendarSettings.showPaymentStatus && (
              <Button
                variant={localIsPaid ? "default" : "outline"}
                size="sm"
                className={cn(
                  "rounded-xl text-xs font-bold transition-all h-9 shrink-0 group border",
                  localIsPaid
                    ? "bg-emerald-500 text-white hover:bg-destructive hover:text-white border-transparent"
                    : "text-muted-foreground border-border/60 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200",
                )}
                onClick={handleTogglePayment}
                aria-label={
                  localIsPaid
                    ? "Cofnij oznaczenie jako opłacone"
                    : "Oznacz jako opłacone"
                }
              >
                {localIsPaid ? (
                  <>
                    <Check className="mr-1.5 h-3.5 w-3.5 group-hover:hidden" />
                    <X className="mr-1.5 h-3.5 w-3.5 hidden group-hover:block" />
                    <span className="group-hover:hidden">Opłacone</span>
                    <span className="hidden group-hover:block">
                      Cofnij wpłatę
                    </span>
                  </>
                ) : (
                  <>
                    <CircleDollarSign className="mr-1.5 h-3.5 w-3.5 opacity-70 group-hover:opacity-100" />
                    Oznacz jako opłacone
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* * Alert dla lekcji przeniesionej (ghost) - pokazuje nowy termin */}
        {isGhost && item.originalDate && (
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground border border-dashed border-border/50">
            To spotkanie zostało przeniesione na: <br />
            <span className="font-bold text-foreground">
              {format(parseDateKey(item.originalDate), "d MMMM yyyy", {
                locale: pl,
              })}{" "}
              o {item.originalStartTime}
            </span>
          </div>
        )}

        {/* * Alert dla lekcji odwołanej - kto odwołał */}
        {isCancelled && (
          <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive font-medium border border-destructive/20">
            Zajęcia zostały odwołane przez:{" "}
            <span className="font-bold">
              {item.whoCancelled === "tutor"
                ? "Ciebie (Korepetytora)"
                : "Ucznia / Rodzica"}
            </span>
            .
          </div>
        )}

        {/* * Zakładki akcji - widoczne tylko dla zaplanowanych lekcji */}
        {!isGhost && !isCancelled && isPlanned && (
          <Tabs defaultValue="notes" className="w-full">
            <TabsList cols={3} className="w-full">
              <TabsTrigger value="notes">Notatki</TabsTrigger>
              <TabsTrigger value="move">Przesuń</TabsTrigger>
              <TabsTrigger value="cancel">Odwołaj</TabsTrigger>
            </TabsList>

            {/* ===== ZAKŁADKA: Notatki ===== */}
            <TabsContent value="notes" className="mt-5 outline-none">
              <form
                onSubmit={notesForm.handleSubmit(async (d) => {
                  const ok = await onUpdateNotes(d);
                  if (ok) onOpenChange(false);
                })}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="notes-topic">Temat zajęć</Label>
                  <Input
                    id="notes-topic"
                    placeholder="Wpisz przerabiany temat..."
                    {...notesForm.register("topic")}
                  />
                  {notesForm.formState.errors.topic && (
                    <p className="text-xs text-destructive">
                      {notesForm.formState.errors.topic.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="notes-tutor">Prywatne notatki</Label>
                  <Textarea
                    id="notes-tutor"
                    rows={3}
                    placeholder="Wnioski z lekcji..."
                    {...notesForm.register("tutorNotes")}
                  />
                  {notesForm.formState.errors.tutorNotes && (
                    <p className="text-xs text-destructive">
                      {notesForm.formState.errors.tutorNotes.message}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={
                    !notesForm.formState.isDirty ||
                    notesForm.formState.isSubmitting
                  }
                >
                  {notesForm.formState.isSubmitting
                    ? "Zapisywanie..."
                    : "Zapisz notatki"}
                </Button>
              </form>
            </TabsContent>

            {/* ===== ZAKŁADKA: Przesuń ===== */}
            <TabsContent value="move" className="mt-5 outline-none">
              <form
                onSubmit={moveForm.handleSubmit(async (d) => {
                  const ok = await onMoveLesson(d);
                  if (ok) onOpenChange(false);
                })}
                className="space-y-4"
              >
                {/* * Wybór zakresu przeniesienia (tylko dla cyklicznych) */}
                {isRecurring && (
                  <div className="space-y-2 pb-2 border-b border-border/60 mb-2">
                    <Label>Zakres przeniesienia</Label>
                    <Controller
                      control={moveForm.control}
                      name="scope"
                      render={({ field }) => (
                        <div
                          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                          role="radiogroup"
                          aria-label="Zakres przeniesienia"
                        >
                          <button
                            type="button"
                            role="radio"
                            aria-checked={field.value === "single"}
                            onClick={() => field.onChange("single")}
                            className={cn(
                              "flex flex-col items-start p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left",
                              field.value === "single"
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50",
                            )}
                          >
                            <div className="font-bold text-sm text-foreground">
                              Tylko te zajęcia
                            </div>
                            <div className="text-xs mt-0.5 text-muted-foreground">
                              Zmień datę i czas tego spotkania
                            </div>
                          </button>
                          <button
                            type="button"
                            role="radio"
                            aria-checked={field.value === "all"}
                            onClick={() => field.onChange("all")}
                            className={cn(
                              "flex flex-col items-start p-3.5 rounded-xl border-2 transition-all cursor-pointer text-left",
                              field.value === "all"
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50",
                            )}
                          >
                            <div className="font-bold text-sm text-foreground">
                              Wszystkie w serii
                            </div>
                            <div className="text-xs mt-0.5 text-muted-foreground">
                              Zmień stały harmonogram zajęć
                            </div>
                          </button>
                        </div>
                      )}
                    />
                  </div>
                )}

                {/* * Ostrzeżenie o przenoszeniu w przeszłość */}
                {isPastMove && (
                  <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-900 mb-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                      <Clock className="h-4 w-4 text-yellow-700" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Termin w przeszłości</p>
                      <p className="mt-0.5 text-xs font-medium text-yellow-800/80">
                        Przenosisz lekcję wstecz - nadal możesz to zapisać.
                      </p>
                    </div>
                  </div>
                )}

                {/* * Siatka pól formularza - różni się wg scope */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* * Regularność - widoczna tylko dla scope=all */}
                  {watchedMoveScope === "all" && (
                    <div className="space-y-1.5 sm:col-span-2 mb-1">
                      <Label>Regularność</Label>
                      <Controller
                        control={moveForm.control}
                        name="recurrence"
                        render={({ field }) => (
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                            role="radiogroup"
                            aria-label="Regularność"
                          >
                            <button
                              type="button"
                              role="radio"
                              aria-checked={
                                field.value === "weekly" ||
                                field.value === "none" ||
                                !field.value
                              }
                              onClick={() => field.onChange("weekly")}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer outline-none",
                                field.value === "weekly" ||
                                  field.value === "none" ||
                                  !field.value
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                              )}
                            >
                              <span className="font-semibold text-sm">
                                Co tydzień
                              </span>
                            </button>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={field.value === "biweekly"}
                              onClick={() => field.onChange("biweekly")}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer outline-none",
                                field.value === "biweekly"
                                  ? "border-primary bg-primary/5 text-primary"
                                  : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                              )}
                            >
                              <span className="font-semibold text-sm">
                                Co 2 tygodnie
                              </span>
                            </button>
                          </div>
                        )}
                      />
                      {moveForm.formState.errors.recurrence && (
                        <p className="text-xs text-destructive">
                          {moveForm.formState.errors.recurrence.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* * Dzień tygodnia (all) lub konkretna data (single) */}
                  {watchedMoveScope === "all" ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="move-dow">Dzień tygodnia</Label>
                      <Controller
                        control={moveForm.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                          <Select
                            value={
                              field.value ? String(field.value) : undefined
                            }
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <SelectTrigger
                              id="move-dow"
                              className="bg-background"
                              aria-label="Wybierz dzień tygodnia"
                            >
                              <SelectValue placeholder="Wybierz dzień..." />
                            </SelectTrigger>
                            <SelectContent>
                              {WEEK_DAYS.map((d) => (
                                <SelectItem
                                  key={d.value}
                                  value={String(d.value)}
                                >
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {moveForm.formState.errors.dayOfWeek && (
                        <p className="text-xs text-destructive">
                          {moveForm.formState.errors.dayOfWeek.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label>Nowa data</Label>
                      <Controller
                        control={moveForm.control}
                        name="date"
                        render={({ field }) => (
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Wybierz datę"
                          />
                        )}
                      />
                      {moveForm.formState.errors.date && (
                        <p className="text-xs text-destructive">
                          {moveForm.formState.errors.date.message}
                        </p>
                      )}
                    </div>
                  )}

                  {/* * Nowa godzina */}
                  <div className="space-y-1.5">
                    <Label>Nowa godzina</Label>
                    <Controller
                      control={moveForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <TimePicker
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {moveForm.formState.errors.startTime && (
                      <p className="text-xs text-destructive">
                        {moveForm.formState.errors.startTime.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* * Wynik sprawdzania kolizji */}
                <div className="space-y-2 empty:hidden pt-2">
                  {isCheckingMove && (
                    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      <span className="font-medium">
                        Sprawdzam wolne terminy...
                      </span>
                    </div>
                  )}

                  {!isCheckingMove &&
                    moveOverlapChecked &&
                    moveConflicts.length === 0 && (
                      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
                        <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">
                          Termin jest wolny - brak kolizji
                        </span>
                      </div>
                    )}

                  {!isCheckingMove && moveConflicts.length > 0 && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                          <AlertTriangle className="h-4 w-4 text-amber-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">Kolizja terminów</p>
                          <p className="mt-0.5 text-xs font-medium text-amber-800/80">
                            Nadal możesz przenieść zajęcia. Koliduje z:
                          </p>
                          <ul className="mt-2 space-y-1.5">
                            {moveConflicts.slice(0, 3).map((c, i) => (
                              <li
                                key={`${c.date}-${c.startTime}-${i}`}
                                className="rounded-lg bg-background/60 px-3 py-2 text-xs font-semibold text-foreground"
                              >
                                {c.studentFirstName} {c.studentLastName}
                                <span className="font-medium text-muted-foreground">
                                  {" "}
                                  · {formatConflictDate(c.date)} · {c.startTime}{" "}
                                  - {c.endTime}
                                </span>
                              </li>
                            ))}
                            {moveConflicts.length > 3 && (
                              <li className="text-xs text-amber-800/70">
                                +{moveConflicts.length - 3} więcej…
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={moveForm.formState.isSubmitting}
                >
                  {moveForm.formState.isSubmitting
                    ? "Przenoszenie..."
                    : "Zatwierdź nowy termin"}
                </Button>
              </form>
            </TabsContent>

            {/* ===== ZAKŁADKA: Odwołaj ===== */}
            <TabsContent value="cancel" className="mt-5 outline-none">
              <form
                onSubmit={cancelForm.handleSubmit(async (d) => {
                  const ok = await onCancelLesson(d);
                  if (ok) onOpenChange(false);
                })}
                className="space-y-4"
              >
                {/* * Wybór kto odwołał - uczeń lub nauczyciel */}
                <div className="space-y-2">
                  <Label>Kto odwołał zajęcia?</Label>
                  <Controller
                    control={cancelForm.control}
                    name="whoCancelled"
                    render={({ field }) => (
                      <div
                        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                        role="radiogroup"
                        aria-label="Kto odwołał zajęcia"
                      >
                        <button
                          type="button"
                          role="radio"
                          aria-checked={field.value === "student"}
                          onClick={() => field.onChange("student")}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer outline-none",
                            field.value === "student"
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          )}
                        >
                          <GraduationCap className="mb-1.5 h-6 w-6" />
                          <span className="font-semibold text-sm">
                            Uczeń / Rodzic
                          </span>
                        </button>
                        <button
                          type="button"
                          role="radio"
                          aria-checked={field.value === "tutor"}
                          onClick={() => field.onChange("tutor")}
                          className={cn(
                            "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer outline-none",
                            field.value === "tutor"
                              ? "border-destructive bg-destructive/10 text-destructive"
                              : "border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                          )}
                        >
                          <User className="mb-1.5 h-6 w-6" />
                          <span className="font-semibold text-sm">
                            Korepetytor (Ja)
                          </span>
                        </button>
                      </div>
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  variant="destructive"
                  className="w-full h-11 mt-4"
                  disabled={cancelForm.formState.isSubmitting}
                >
                  {cancelForm.formState.isSubmitting
                    ? "Trwa odwoływanie..."
                    : "Odwołaj te zajęcia"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ModalShell>
  );
}
