"use client";

import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange?: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  className?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Wybierz datę",
  disabled = false,
  minDate,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = React.useMemo(() => {
    if (!value || value.length !== 10) return undefined;
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (isNaN(date.getTime())) return undefined;
    return date;
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.("");
      return;
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    onChange?.(`${yyyy}-${mm}-${dd}`);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-start rounded-xl border border-input bg-background px-4 py-2 text-base md:text-sm shadow-sm transition-colors text-left font-normal font-sans outline-none",
            "hover:bg-accent/50 focus-visible:border-primary focus-visible:ring-0",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/50",
            !selectedDate && "text-muted-foreground",
            className,
          )}
        >
          {selectedDate
            ? format(selectedDate, "d MMMM yyyy", { locale: pl })
            : placeholder}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 font-sans"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          locale={pl}
          disabled={minDate ? { before: minDate } : undefined}
          defaultMonth={selectedDate ?? minDate ?? new Date()}
          className="rounded-xl"
        />
      </PopoverContent>
    </Popover>
  );
}
