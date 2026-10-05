// ==========================================
// KOMPONENT: Formularz lekcji (embeddable)
// ==========================================
// Czysty formularz planowania lekcji z własnym useForm i walidacją Zod.
// Czeka na sygnał submit({ studentId }) od rodzica, sam fetchuje
// CalendarService, sam sprawdza kolizje, sam pokazuje toast.
//
// * Gdy showHeader=true, formularz renderuje się jako karta z numerem i przyciskiem usuwania.
// * Gdy showHeader=false, renderuje się jako płaski zestaw pól bez nagłówka i ramki.

"use client";

import {
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Clock,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { cn } from "@/lib/utils";

import { lessonFormSchema, type LessonFormData } from "../schema";
import { CalendarService } from "../service";
import type { LessonCreateData } from "../schema";
import {
  timeToMinutes,
  addMinutesToTime,
  parseDateKey,
  jsDayToDayOfWeek,
  WEEK_DAYS,
} from "../utils";
import type { OverlapConflict } from "../types";

// ==========================================
// KONTRAKT: Handle dla rodzica
// ==========================================

export interface LessonFormHandle {
  submit: (context: LessonFormContext) => Promise<LessonFormResult>;
}

export interface LessonFormContext {
  studentId: string;
}

export interface LessonFormResult {
  success: boolean;
  error?: string;
}

interface LessonFormProps {
  readonly defaultValues?: Partial<LessonFormData>;
  // * Callback usunięcia tego formularza z listy (przycisk ×)
  readonly onRemove?: () => void;
  // * Numer porządkowy — wyświetlany tylko gdy showHeader=true
  readonly index?: number;
  // * Czy pokazywać nagłówek z numerem i przyciskiem usunięcia
  // * (true w StudentFormModal z wieloma terminami, false w LessonFormModal)
  readonly showHeader?: boolean;
}

const EMPTY_FORM: LessonFormData = {
  startTime: "",
  date: "",
  durationMins: 60,
  recurrence: "none",
  topic: "",
  tutorNotes: "",
};

export const LessonForm = forwardRef<LessonFormHandle, LessonFormProps>(
  function LessonForm(
    { defaultValues, onRemove, index, showHeader = false },
    ref,
  ) {
    const [conflicts, setConflicts] = useState<readonly OverlapConflict[]>([]);
    const [isCheckingOverlap, setIsCheckingOverlap] = useState(false);
    const [overlapChecked, setOverlapChecked] = useState(false);

    const {
      register,
      control,
      setValue,
      handleSubmit,
      formState: { errors },
    } = useForm<LessonFormData>({
      resolver: zodResolver(lessonFormSchema),
      defaultValues: { ...EMPTY_FORM, ...defaultValues },
      mode: "onBlur",
    });

    const recurrence = useWatch({ control, name: "recurrence" });
    const watchedDate = useWatch({ control, name: "date" });
    const watchedTime = useWatch({ control, name: "startTime" });
    const watchedDuration = useWatch({ control, name: "durationMins" });
    const watchedDayOfWeek = useWatch({ control, name: "dayOfWeek" });

    const isSingle = recurrence === "none";

    const isCustomDuration =
      watchedDuration !== 45 &&
      watchedDuration !== 60 &&
      watchedDuration !== 90 &&
      !isNaN(watchedDuration);

    // * Ostrzeżenie o terminie w przeszłości
    const isPast = useMemo(() => {
      if (!isSingle || !watchedDate || !watchedTime) return false;
      const mins = timeToMinutes(watchedTime);
      if (isNaN(mins)) return false;
      const target = parseDateKey(watchedDate);
      target.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
      return target < new Date();
    }, [isSingle, watchedDate, watchedTime]);

    // * Zmiana regularności
    const handleRecurrenceChange = useCallback(
      (val: string) => {
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
      },
      [setValue, watchedDate],
    );

    const handleDurationClick = useCallback(
      (mins: number) => {
        setValue("durationMins", mins, {
          shouldValidate: true,
          shouldDirty: true,
        });
      },
      [setValue],
    );

    // * Debounced sprawdzanie kolizji (500ms)
    useEffect(() => {
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
      }, 500);

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
    ]);

    // ==========================================
    // SYGNAŁ OD RODZICA: submit({ studentId })
    // ==========================================
    useImperativeHandle(
      ref,
      () => ({
        submit: async (
          context: LessonFormContext,
        ): Promise<LessonFormResult> => {
          return new Promise((resolve) => {
            void handleSubmit(
              async (data) => {
                try {
                  const fullData: LessonCreateData = {
                    ...data,
                    studentId: context.studentId,
                  };
                  await CalendarService.createLesson(fullData);
                  toast.success("Zajęcia zostały zaplanowane");
                  resolve({ success: true });
                } catch (err) {
                  const msg =
                    err instanceof Error
                      ? err.message
                      : "Nie udało się zaplanować zajęć";
                  console.error("LessonForm submit error:", err);
                  toast.error("Błąd planowania zajęć", { description: msg });
                  resolve({ success: false, error: msg });
                }
              },
              () => {
                resolve({
                  success: false,
                  error: "Formularz zajęć zawiera błędy walidacji",
                });
              },
            )();
          });
        },
      }),
      [handleSubmit],
    );

    const formatConflictDate = (d: string) => {
      try {
        return format(parseDateKey(d), "d MMM yyyy", { locale: pl });
      } catch {
        return d;
      }
    };

    return (
      <div
        className={cn(
          "space-y-4",
          showHeader &&
            "rounded-2xl border border-primary/40 bg-background p-4 sm:p-5 shadow-sm",
        )}
      >
        {/* * Nagłówek i przycisk usuwania — renderowany tylko gdy showHeader=true */}
        {showHeader && (
          <div className="flex items-center justify-between pb-2 border-b border-border/30">
            <span className="flex items-center gap-2 text-sm font-bold text-foreground">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {(index ?? 0) + 1}
              </span>
              Termin zajęć
            </span>
            {onRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={onRemove}
                aria-label="Usuń ten termin"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* * Ostrzeżenie o przeszłości */}
        {isPast && (
          <div className="flex items-start gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-3 text-yellow-900">
            <Clock className="h-4 w-4 text-yellow-700 mt-0.5 shrink-0" />
            <p className="text-xs font-medium">
              Termin w przeszłości - możesz zapisać, jeśli to zamierzone.
            </p>
          </div>
        )}

        {/* * Regularność */}
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

        {/* * Data/dzień + godzina */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isSingle ? (
            <div className="space-y-1.5">
              <Label>Dzień tygodnia</Label>
              <Controller
                control={control}
                name="dayOfWeek"
                render={({ field }) => (
                  <Select
                    value={field.value != null ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                  >
                    <SelectTrigger className="bg-card">
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

        {/* * Czas trwania */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Czas trwania</Label>
            {watchedTime && !isNaN(watchedDuration) && watchedDuration > 0 && (
              <span className="text-xs font-bold text-muted-foreground">
                Koniec: {addMinutesToTime(watchedTime, watchedDuration)}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[45, 60, 90].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleDurationClick(mins)}
                className={cn(
                  "w-full h-11 rounded-xl text-sm font-semibold transition-all outline-none cursor-pointer",
                  !isCustomDuration && watchedDuration === mins
                    ? "border border-primary bg-primary/10 text-primary"
                    : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/50",
                )}
              >
                {mins} min
              </button>
            ))}
            {!isCustomDuration ? (
              <button
                type="button"
                onClick={() => handleDurationClick(120)}
                className="w-full h-11 rounded-xl border border-border/60 bg-card text-sm font-semibold text-muted-foreground hover:bg-muted/50 outline-none cursor-pointer"
              >
                Inny
              </button>
            ) : (
              <Input
                type="number"
                min={15}
                max={300}
                autoFocus
                className="h-11 border-primary text-center font-bold ring-1 ring-primary/30"
                {...register("durationMins", {
                  setValueAs: (v) => (v === "" ? NaN : Number(v)),
                })}
              />
            )}
          </div>
          {errors.durationMins && (
            <p className="text-xs text-destructive">
              {errors.durationMins.message}
            </p>
          )}
        </div>

        {/* * Data startu cyklu (tylko regularne) */}
        {!isSingle && (
          <div className="space-y-1.5">
            <Label>Data startu cyklu</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Od tej daty reguła zaczyna generować zajęcia.
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

        {/* * Kolizje */}
        <div className="space-y-2 empty:hidden">
          {isCheckingOverlap && (
            <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
              <span>Sprawdzam kolizje…</span>
            </div>
          )}

          {!isCheckingOverlap &&
            overlapChecked &&
            conflicts.length === 0 &&
            !!watchedDate &&
            !!watchedTime && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>Brak kolizji</span>
              </div>
            )}

          {!isCheckingOverlap && conflicts.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-900">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold">Kolizja terminów</p>
                  <ul className="mt-1 space-y-1">
                    {conflicts.slice(0, 3).map((c, i) => (
                      <li
                        key={`${c.date}-${c.startTime}-${i}`}
                        className="text-[11px] font-medium"
                      >
                        {c.studentFirstName} {c.studentLastName} ·{" "}
                        {formatConflictDate(c.date)} · {c.startTime}–{c.endTime}
                      </li>
                    ))}
                    {conflicts.length > 3 && (
                      <li className="text-[11px] text-amber-800/70">
                        +{conflicts.length - 3} więcej
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* * Temat i notatki (tylko jednorazowe) */}
        {isSingle && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Temat (opcjonalnie)</Label>
              <Input
                placeholder="np. Równania kwadratowe"
                {...register("topic")}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notatki (opcjonalnie)</Label>
              <Input
                placeholder="Dodatkowe informacje..."
                {...register("tutorNotes")}
              />
            </div>
          </div>
        )}
      </div>
    );
  },
);
