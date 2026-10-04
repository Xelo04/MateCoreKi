// ==========================================
// KOMPONENT UI: TimePicker
// ==========================================

"use client";

import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value?: string; // "HH:MM" lub ""
  onChange?: (time: string) => void;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));

const MINUTES = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
];

export function TimePicker({
  value = "",
  onChange,
  disabled = false,
  className,
}: TimePickerProps) {
  const [h = "", m = ""] = value ? value.split(":") : ["", ""];

  const normalizedM =
    m && !MINUTES.includes(m)
      ? MINUTES.reduce((prev, curr) =>
          Math.abs(Number(curr) - Number(m)) <
          Math.abs(Number(prev) - Number(m))
            ? curr
            : prev,
        )
      : m;

  const handleHourChange = (newH: string) => {
    onChange?.(`${newH}:${normalizedM || "00"}`);
  };

  const handleMinuteChange = (newM: string) => {
    onChange?.(`${h || "00"}:${newM}`);
  };

  return (
    <div
      className={cn(
        "flex h-11 w-full items-center rounded-xl border border-input bg-background shadow-sm",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {/* GODZINA */}
      <Select
        value={h || undefined}
        onValueChange={handleHourChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-full w-1/2 border-0 bg-transparent shadow-none focus:ring-0 focus:border-0 data-[state=open]:border-0 font-sans justify-center rounded-l-xl rounded-r-none px-3 [&>svg]:ml-4"
          aria-label="Godzina"
        >
          <SelectValue placeholder="GG" />
        </SelectTrigger>
        <SelectContent className="max-h-60 font-sans">
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Separator */}
      <span className="shrink-0 text-muted-foreground font-medium select-none">
        :
      </span>

      {/* MINUTA */}
      <Select
        value={normalizedM || undefined}
        onValueChange={handleMinuteChange}
        disabled={disabled}
      >
        <SelectTrigger
          className="h-full w-1/2 border-0 bg-transparent shadow-none focus:ring-0 focus:border-0 data-[state=open]:border-0 font-sans justify-center rounded-r-xl rounded-l-none px-3 [&>svg]:ml-4"
          aria-label="Minuta"
        >
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="max-h-60 font-sans">
          {MINUTES.map((min) => (
            <SelectItem key={min} value={min}>
              {min}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
