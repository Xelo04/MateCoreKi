// ==========================================
// KOMPONENT: Panel szczegółów wybranego dnia
// ==========================================
// Lista lekcji wybranego dnia z informacjami i akcją otwarcia modalu szczegółów.

"use client";

import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Clock,
  CalendarPlus,
  CircleDollarSign,
  XCircle,
  CornerDownRight,
  Repeat,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addMinutesToTime } from "@/features/calendar/utils";
import { CalendarSettings } from "@/config";
import type { CalendarLessonItem } from "@/features/calendar/types";

interface StudentDayDetailsProps {
  readonly date: Date;
  readonly items: readonly CalendarLessonItem[];
  readonly onItemClick: (item: CalendarLessonItem) => void;
  readonly onPlanClick: () => void;
}

export function StudentDayDetails({
  date,
  items,
  onItemClick,
  onPlanClick,
}: StudentDayDetailsProps) {
  // * Sortowanie po godzinie dla czytelności chronologicznej
  const sortedItems = [...items].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  const dateLabel = format(date, "EEEE, d MMMM yyyy", { locale: pl });

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
      {/* * Nagłówek z datą i przyciskiem planowania */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h3 className="text-sm font-bold text-foreground capitalize">
          {dateLabel}
        </h3>
        <Button
          variant="outline"
          size="sm"
          className="h-9 shrink-0"
          onClick={onPlanClick}
        >
          <CalendarPlus className="mr-1.5 h-4 w-4" />
          <span className="hidden sm:inline">Dodaj zajęcia</span>
          <span className="sm:hidden">Dodaj</span>
        </Button>
      </div>

      {/* * Lista lekcji dnia lub stan pusty */}
      {sortedItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-2 rounded-xl border border-dashed border-border/50 bg-secondary/10 py-10 text-center">
          <CalendarIcon className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Brak zajęć tego dnia</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {sortedItems.map((item) => (
            <LessonRow key={item.id} item={item} onClick={onItemClick} />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// POMOCNICZY: Wiersz pojedynczej lekcji
// ==========================================

interface LessonRowProps {
  readonly item: CalendarLessonItem;
  readonly onClick: (item: CalendarLessonItem) => void;
}

function LessonRow({ item, onClick }: LessonRowProps) {
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
        "flex items-center justify-between w-full rounded-xl border px-4 py-3 transition-all cursor-pointer text-left group focus-visible:ring-2 focus-visible:ring-primary outline-none",
        isPlanned &&
          "border-border/40 bg-background hover:border-primary/40 hover:bg-primary/5",
        isCancelled &&
          "border-destructive/20 bg-destructive/5 hover:bg-destructive/10",
        isMoved &&
          "border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* * Godziny lekcji */}
        <div className="flex flex-col shrink-0 w-20">
          <span
            className={cn(
              "text-base font-bold leading-none",
              isCancelled && "text-destructive/80 line-through",
              isMoved && "text-muted-foreground",
            )}
          >
            {item.startTime}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground mt-1">
            do {endTime}
          </span>
        </div>

        {/* * Czas trwania + metadane */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span>{item.durationMins} min</span>
            {isRecurring ? (
              <Repeat
                className="h-3 w-3 text-muted-foreground/70"
                aria-label="Zajęcia regularne"
              />
            ) : (
              <CalendarIcon
                className="h-3 w-3 text-muted-foreground/70"
                aria-label="Zajęcia jednorazowe"
              />
            )}
          </div>

          {/* * Temat lekcji (jeśli jest) */}
          {item.topic && isPlanned && (
            <span className="text-xs text-muted-foreground mt-0.5 truncate">
              {item.topic}
            </span>
          )}

          {/* * Status odwołanej */}
          {isCancelled && (
            <span className="text-xs font-medium text-destructive/70 flex items-center gap-1 mt-0.5">
              <XCircle className="h-3 w-3" />
              Odwołane przez{" "}
              {item.whoCancelled === "tutor" ? "Ciebie" : "ucznia"}
            </span>
          )}

          {/* * Status przeniesionej */}
          {isMoved && item.originalDate && (
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1 mt-0.5">
              <CornerDownRight className="h-3 w-3 shrink-0" />
              Przeniesione na inny termin
            </span>
          )}
        </div>
      </div>

      {/* * Status płatności po prawej stronie */}
      {isPlanned && CalendarSettings.showPaymentStatus && (
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold shrink-0",
            item.isPaid
              ? "bg-emerald-500/10 text-emerald-700"
              : "bg-amber-500/10 text-amber-700",
          )}
        >
          <CircleDollarSign className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {item.isPaid ? "Opłacone" : "Do zapłaty"}
          </span>
        </div>
      )}
    </button>
  );
}
