// ==========================================
// KOMPONENT: Modal Dodawania Nowej Lekcji
// ==========================================
// Formularz planowania lekcji jednorazowych oraz cyklicznych.
// Obsługuje wybór ucznia, regularność, datę/godzinę, czas trwania
// i automatyczne sprawdzanie kolizji terminów z debounce.

"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarPlus,
  AlertTriangle,
  Clock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ModalShell } from "@/components/ui/modal-shell";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { useStudentsList } from "@/features/students/hook";
import { cn } from "@/lib/utils";

import { lessonCreateSchema, type LessonCreateData } from "../schema";
import { CalendarService } from "../service";
import {
  timeToMinutes,
  addMinutesToTime,
  parseDateKey,
  jsDayToDayOfWeek,
  WEEK_DAYS,
} from "../utils";
import type { OverlapConflict } from "../types";

interface LessonFormModalProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly defaultValues?: Partial<LessonCreateData>;
  readonly onSubmit: (data: LessonCreateData) => Promise<boolean>;
}

// * Puste wartości startowe formularza
const EMPTY_FORM: LessonCreateData = {
  studentId: "",
  startTime: "",
  date: "",
  durationMins: 60,
  recurrence: "none",
  topic: "",
  tutorNotes: "",
};

export function LessonFormModal({
  open,
  onOpenChange,
  defaultValues,
  onSubmit,
}: LessonFormModalProps) {
  const { activeStudents } = useStudentsList();
  const [conflicts, setConflicts] = useState<readonly OverlapConflict[]>([]);
  const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);
  const [overlapChecked, setOverlapChecked] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LessonCreateData>({
    resolver: zodResolver(lessonCreateSchema),
    defaultValues: { ...EMPTY_FORM, ...defaultValues },
    mode: "onBlur",
  });

  // * Reset formularza TYLKO przy przejściu zamknięty -> otwarty.
  // ! Poprzednia wersja resetowała przy każdym renderze (nowa referencja
  // ! defaultValues), co czyściło pola w trakcie pisania.
  const prevOpenRef = useRef(false);
  const defaultValuesRef = useRef(defaultValues);

  useEffect(() => {
    // * Aktualizujemy ref w efekcie, nie w renderze (wymóg React 19)
    defaultValuesRef.current = defaultValues;
  }, [defaultValues]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      reset({ ...EMPTY_FORM, ...defaultValuesRef.current });
      setConflicts([]);
      setOverlapChecked(false);
    }
    prevOpenRef.current = open;
  }, [open, reset]);

  // * Watchowane pola do reaktywnego UI i sprawdzania kolizji
  const recurrence = useWatch({ control, name: "recurrence" });
  const watchedDate = useWatch({ control, name: "date" });
  const watchedTime = useWatch({ control, name: "startTime" });
  const watchedDuration = useWatch({ control, name: "durationMins" });
  const watchedDayOfWeek = useWatch({ control, name: "dayOfWeek" });

  const isSingle = recurrence === "none";

  // * Czy użytkownik wybrał niestandardowy czas trwania (spoza 45/60/90)
  const isCustomDuration =
    watchedDuration !== 45 &&
    watchedDuration !== 60 &&
    watchedDuration !== 90 &&
    !isNaN(watchedDuration);

  // * Ostrzeżenie gdy planowana lekcja jest w przeszłości
  const isPast = useMemo(() => {
    if (!isSingle || !watchedDate || !watchedTime) return false;
    const mins = timeToMinutes(watchedTime);
    if (isNaN(mins)) return false;
    const target = parseDateKey(watchedDate);
    target.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
    return target < new Date();
  }, [isSingle, watchedDate, watchedTime]);

  // * Zmiana regularności — czyści/ustawia dayOfWeek i pola tekstowe
  const handleRecurrenceChange = (val: string) => {
    const v = val as "none" | "weekly" | "biweekly";
    setValue("recurrence", v, { shouldValidate: true });

    if (v === "none") {
      setValue("dayOfWeek", undefined, { shouldValidate: true });
    } else {
      setValue("topic", "");
      setValue("tutorNotes", "");
      if (watchedDate) {
        const dow = jsDayToDayOfWeek(parseDateKey(watchedDate).getDay());
        setValue("dayOfWeek", dow, { shouldValidate: true });
      }
    }
  };

  const handleDurationClick = (mins: number) => {
    setValue("durationMins", mins, { shouldValidate: true, shouldDirty: true });
  };

  // * Debounced sprawdzanie kolizji terminów (350ms po ostatniej zmianie)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const canCheck =
      !!watchedDate &&
      !!watchedTime &&
      !isNaN(watchedDuration) &&
      watchedDuration >= 15 &&
      (isSingle || watchedDayOfWeek !== undefined);

    if (!canCheck) {
      const t = setTimeout(() => {
        if (!cancelled) {
          setConflicts([]);
          setIsCheckingOverlap(false);
          setOverlapChecked(false);
        }
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(t);
      };
    }

    const t = setTimeout(() => {
      if (!cancelled) setIsCheckingOverlap(true);
      void (async () => {
        try {
          const result = await CalendarService.checkOverlap({
            date: watchedDate!,
            startTime: watchedTime!,
            durationMins: watchedDuration,
            recurrence: recurrence ?? "none",
            dayOfWeek: watchedDayOfWeek,
          });
          if (!cancelled) {
            setConflicts(result);
            setOverlapChecked(true);
          }
        } catch {
          if (!cancelled) {
            setConflicts([]);
            setOverlapChecked(false);
          }
        } finally {
          if (!cancelled) setIsCheckingOverlap(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [
    watchedDate,
    watchedTime,
    watchedDuration,
    recurrence,
    watchedDayOfWeek,
    isSingle,
    open,
  ]);

  const submit = async (data: LessonCreateData) => {
    const success = await onSubmit(data);
    if (success) onOpenChange(false);
  };

  const formatConflictDate = (d: string) => {
    try {
      return format(parseDateKey(d), "d MMM yyyy", { locale: pl });
    } catch {
      return d;
    }
  };

  return (
    <ModalShell
      open={open}
      onOpenChange={onOpenChange}
      icon={<CalendarPlus className="h-6 w-6 text-white" strokeWidth={2} />}
      title="Zaplanuj zajęcia"
      formId="lesson-create-form"
      submitLabel="Zaplanuj"
      isSubmitting={isSubmitting}
      onClose={() => onOpenChange(false)}
    >
      <form
        id="lesson-create-form"
        onSubmit={handleSubmit(submit)}
        className="space-y-6"
      >
        {/* * Ostrzeżenie o planowaniu w przeszłości */}
        {isPast && (
          <div className="flex items-start gap-3 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-yellow-900">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
              <Clock className="h-4 w-4 text-yellow-700" />
            </div>
            <div>
              <p className="text-sm font-bold">Termin w przeszłości</p>
              <p className="mt-0.5 text-xs font-medium text-yellow-800/80">
                Planujesz wstecz - możesz zapisać, jeśli to zamierzone.
              </p>
            </div>
          </div>
        )}

        {/* * Select ucznia z listy aktywnych */}
        <div className="space-y-1.5">
          <Label htmlFor="student-select">Uczeń</Label>
          <Controller
            control={control}
            name="studentId"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger
                  id="student-select"
                  className="bg-card"
                  aria-label="Wybierz ucznia"
                >
                  <SelectValue placeholder="Wybierz ucznia" />
                </SelectTrigger>
                <SelectContent>
                  {activeStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.studentId && (
            <p className="text-xs text-destructive">
              {errors.studentId.message}
            </p>
          )}
        </div>

        {/* * Przełącznik regularności (jednorazowo / co tydzień / co 2 tyg.) */}
        <div className="space-y-1.5">
          <Label>Regularność</Label>
          <Controller
            control={control}
            name="recurrence"
            render={({ field }) => (
              <Tabs value={field.value} onValueChange={handleRecurrenceChange}>
                <TabsList cols={3} className="w-full">
                  <TabsTrigger value="none">Jednorazowo</TabsTrigger>
                  <TabsTrigger value="weekly">Co tydzień</TabsTrigger>
                  <TabsTrigger value="biweekly">Co 2 tyg.</TabsTrigger>
                </TabsList>
              </Tabs>
            )}
          />
        </div>

        {/* * Data (single) lub dzień tygodnia (cykl) + godzina */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isSingle ? (
            <div className="space-y-1.5">
              <Label htmlFor="dow-select">Dzień tygodnia</Label>
              <Controller
                control={control}
                name="dayOfWeek"
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger
                      id="dow-select"
                      className="bg-card"
                      aria-label="Wybierz dzień tygodnia"
                    >
                      <SelectValue placeholder="Wybierz" />
                    </SelectTrigger>
                    <SelectContent>
                      {WEEK_DAYS.map((d) => (
                        <SelectItem key={d.value} value={String(d.value)}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.dayOfWeek && (
                <p className="text-xs text-destructive">
                  {errors.dayOfWeek.message}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Data spotkania</Label>
              <Controller
                control={control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Wybierz datę"
                  />
                )}
              />
              {errors.date && (
                <p className="text-xs text-destructive">
                  {errors.date.message}
                </p>
              )}
            </div>
          )}

          {/* * Godzina rozpoczęcia */}
          <div className="space-y-1.5">
            <Label>Godzina</Label>
            <Controller
              control={control}
              name="startTime"
              render={({ field }) => (
                <TimePicker
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
            {errors.startTime && (
              <p className="text-xs text-destructive">
                {errors.startTime.message}
              </p>
            )}
          </div>
        </div>

        {/* * Czas trwania — szybkie przyciski 45/60/90 + opcja wpisania własnego */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Czas trwania zajęć</Label>
            {watchedTime && !isNaN(watchedDuration) && watchedDuration > 0 && (
              <span className="text-xs font-bold text-muted-foreground">
                Koniec: {addMinutesToTime(watchedTime, watchedDuration)} (
                {watchedDuration} minut)
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
            {[45, 60, 90].map((mins) => {
              const isSelected = !isCustomDuration && watchedDuration === mins;
              return (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleDurationClick(mins)}
                  className={cn(
                    "w-full h-11 rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer",
                    isSelected
                      ? "border border-primary bg-primary/10 text-primary"
                      : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  {mins} min
                </button>
              );
            })}

            {/* * Przycisk Inny — po kliknięciu zamienia się w input number */}
            {!isCustomDuration ? (
              <button
                type="button"
                onClick={() => handleDurationClick(120)}
                className="w-full h-11 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground outline-none cursor-pointer"
              >
                Inny
              </button>
            ) : (
              <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                <Input
                  type="number"
                  min={15}
                  max={300}
                  autoFocus
                  className="h-11 w-full border-primary text-center font-bold text-foreground ring-1 ring-primary/30"
                  {...register("durationMins", {
                    setValueAs: (v) => (v === "" ? NaN : Number(v)),
                  })}
                />
              </div>
            )}
          </div>
          {errors.durationMins && (
            <p className="text-xs text-destructive">
              {errors.durationMins.message}
            </p>
          )}
        </div>

        {/* * Data startu cyklu — widoczna tylko dla lekcji cyklicznych */}
        {!isSingle && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Label>Data startu cyklu</Label>
            <p className="text-xs text-muted-foreground -mt-1 mb-1">
              Od tej daty reguła zaczyna generować zajęcia (kolizje liczone od
              niej).
            </p>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Wybierz datę startu"
                />
              )}
            />
            {errors.date && (
              <p className="text-xs text-destructive">{errors.date.message}</p>
            )}
          </div>
        )}

        {/* * Status sprawdzania kolizji — loading / brak kolizji / lista kolizji */}
        <div className="space-y-2 empty:hidden">
          {isCheckingOverlap && (
            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              <span className="font-medium">
                Sprawdzam kolizje w kalendarzu…
              </span>
            </div>
          )}

          {!isCheckingOverlap &&
            overlapChecked &&
            conflicts.length === 0 &&
            !!watchedDate &&
            !!watchedTime && (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-medium">
                  Brak kolizji z innymi zajęciami w tym terminie
                </span>
              </div>
            )}

          {!isCheckingOverlap && conflicts.length > 0 && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                  <AlertTriangle className="h-4 w-4 text-amber-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">Możliwa kolizja terminów</p>
                  <p className="mt-0.5 text-xs font-medium text-amber-800/80">
                    Nadal możesz zapisać zajęcia. Koliduje z:
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {conflicts.slice(0, 5).map((c, i) => (
                      <li
                        key={`${c.date}-${c.startTime}-${i}`}
                        className="rounded-lg bg-background/60 px-3 py-2 text-xs font-semibold text-foreground"
                      >
                        {c.studentFirstName} {c.studentLastName}
                        <span className="font-medium text-muted-foreground">
                          {" "}
                          · {formatConflictDate(c.date)} · {c.startTime} -{" "}
                          {c.endTime}
                        </span>
                      </li>
                    ))}
                    {conflicts.length > 5 && (
                      <li className="text-xs text-amber-800/70">
                        +{conflicts.length - 5} więcej…
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* * Pola opcjonalne — temat i notatki (tylko dla lekcji jednorazowych) */}
        {isSingle && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="space-y-1.5">
              <Label>Temat zajęć (Opcjonalnie)</Label>
              <Input
                placeholder="np. Równania kwadratowe"
                {...register("topic")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notatki dla Ciebie (Opcjonalnie)</Label>
              <Textarea
                rows={3}
                placeholder="Dodatkowe informacje do lekcji..."
                {...register("tutorNotes")}
              />
            </div>
          </div>
        )}
      </form>
    </ModalShell>
  );
}
