// ==========================================
// KOMPONENT: Wiersz jednego terminu zajęć
// ==========================================

"use client";

import { Trash2 } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import type { StudentFormData } from "../schema";

const DAYS = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 7, label: "Niedziela" },
];

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Jednorazowo" },
  { value: "weekly", label: "Co tydzień" },
  { value: "biweekly", label: "Co dwa tygodnie" },
];

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

interface ScheduleSlotRowProps {
  index: number;
  onRemove: () => void;
}

export function ScheduleSlotRow({ index, onRemove }: ScheduleSlotRowProps) {
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = useFormContext<StudentFormData>();

  const recurrence = useWatch({
    control,
    name: `scheduleSlots.${index}.recurrence`,
  });
  const slotErrors = errors.scheduleSlots?.[index];

  // * Gwiazdka tylko gdy pole jest wymagane
  const dateLabel =
    recurrence === "none" ? "Data spotkania *" : "Data startu cyklu";

  const handleRecurrenceChange = (val: string) => {
    setValue(
      `scheduleSlots.${index}.recurrence`,
      val as "none" | "weekly" | "biweekly",
      {
        shouldValidate: true,
      },
    );
    if (val !== "none") {
      setValue(`scheduleSlots.${index}.date`, "", { shouldValidate: true });
    }
  };

  return (
    <div className="rounded-2xl border border-primary/40 bg-background p-4 shadow-sm">
      {/* NUMER TERMINU */}
      <div className="flex items-center justify-between mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* DZIEŃ TYGODNIA */}
        <div className="space-y-1.5">
          <Label>Dzień tygodnia *</Label>
          <Controller
            control={control}
            name={`scheduleSlots.${index}.dayOfWeek`}
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz dzień" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={String(d.value)}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* GODZINA */}
        <div className="space-y-1.5">
          <Label>Godzina rozpoczęcia *</Label>
          <Controller
            control={control}
            name={`scheduleSlots.${index}.startTime`}
            render={({ field }) => (
              <TimePicker value={field.value} onChange={field.onChange} />
            )}
          />
          {slotErrors?.startTime && (
            <p className="text-xs text-destructive">
              {slotErrors.startTime.message}
            </p>
          )}
        </div>

        {/* CZAS TRWANIA */}
        <div className="space-y-1.5">
          <Label>Czas trwania (min) *</Label>
          <Input
            type="number"
            min={15}
            max={300}
            {...register(`scheduleSlots.${index}.durationMins`, {
              valueAsNumber: true,
            })}
          />
          {slotErrors?.durationMins && (
            <p className="text-xs text-destructive">
              {slotErrors.durationMins.message}
            </p>
          )}
        </div>

        {/* REGULARNOŚĆ */}
        <div className="space-y-1.5">
          <Label>Regularność *</Label>
          <Controller
            control={control}
            name={`scheduleSlots.${index}.recurrence`}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={handleRecurrenceChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRENCE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {/* DATA */}
        <div className="space-y-1.5 sm:col-span-2">
          <Label>{dateLabel}</Label>
          <Controller
            control={control}
            name={`scheduleSlots.${index}.date`}
            render={({ field }) => (
              <DatePicker
                value={field.value}
                onChange={field.onChange}
                minDate={TODAY}
                placeholder={
                  recurrence === "none"
                    ? "Wybierz datę spotkania"
                    : "Wybierz datę (opcjonalnie)"
                }
              />
            )}
          />
          {slotErrors?.date && (
            <p className="text-xs text-destructive">
              {slotErrors.date.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
