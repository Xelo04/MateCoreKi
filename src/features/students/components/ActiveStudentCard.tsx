// ==========================================
// KOMPONENT: Karta Aktywnego Ucznia
// ==========================================

"use client";

import { useRouter } from "next/navigation";
import {
  MoreVertical,
  CalendarPlus,
  FilePenLine,
  Archive,
  Pencil,
  Clock,
  CalendarRange,
  Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { StudentListItem } from "../types";
import {
  formatEducationLabel,
  formatSchedulesForCard,
  getStudentColor,
} from "../utils";
import { cn } from "@/lib/utils";

interface ActiveStudentCardProps {
  student: StudentListItem;
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
}

export function ActiveStudentCard({
  student,
  onEdit,
  onArchive,
}: ActiveStudentCardProps) {
  const router = useRouter();
  const colorInfo = getStudentColor(student.id);
  const schedules = formatSchedulesForCard(student.scheduleSlots);

  // * Przejście do szczegółowego profilu ucznia
  const handleCardClick = () => {
    router.push(`/students/${student.id}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Profil ucznia ${student.firstName} ${student.lastName}`}
      className={cn(
        "cursor-pointer group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary",
        colorInfo.hoverBorder,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl transition-opacity opacity-50 group-hover:opacity-100",
          colorInfo.glow,
        )}
      />

      <div>
        {/* Informacje o uczniu */}
        <div className="relative z-10 flex flex-col items-start pr-8">
          <h3 className="line-clamp-1 text-2xl font-bold tracking-tight text-foreground">
            {student.firstName} {student.lastName}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-muted-foreground">
            {formatEducationLabel(
              student.educationType,
              student.classYear,
              student.mathLevel,
            )}
          </p>

          {/* LISTA TERMINÓW */}
          {schedules.length > 0 && (
            <div className="mt-6 flex flex-col gap-3">
              {schedules.map((schedule, idx) => {
                const isSingle = schedule.recurrence === "none";
                const isBiweekly = schedule.recurrence === "biweekly";
                const isWeekly = schedule.recurrence === "weekly";

                return (
                  <div key={idx} className="flex gap-3">
                    <div
                      className={cn(
                        "w-1.5 shrink-0 rounded-full",
                        isSingle ? "bg-amber-400" : colorInfo.solid,
                      )}
                    />

                    <div className="flex flex-col py-0.5">
                      <span className="text-sm font-bold text-foreground/90 leading-tight">
                        {schedule.text}
                      </span>

                      <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {schedule.durationMins} min
                        </span>

                        <span>•</span>

                        {isWeekly && (
                          <span className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" />
                            Co tydzień
                          </span>
                        )}

                        {isBiweekly && (
                          <span className="flex items-center gap-1">
                            <CalendarRange className="h-3 w-3" />
                            Co 2 tyg.
                          </span>
                        )}

                        {isSingle && (
                          <span className="flex items-center gap-1 font-semibold text-amber-600">
                            Jednorazowo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Menu z akcjami */}
      <div
        className="absolute right-4 top-4 z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Opcje ucznia"
              className="rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 z-50">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit(student.id);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" /> Edytuj
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onArchive(student.id);
              }}
            >
              <Archive className="mr-2 h-4 w-4" /> Archiwizuj
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dodatkowe akcje (celowo pozostawiona atrapa bez podpiętego onClick) */}
      <div
        className="relative z-10 mt-3 flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="secondary"
          className={cn(
            "w-full justify-center text-sm font-semibold text-foreground/80 shadow-none transition-colors",
            colorInfo.hoverBg,
            "hover:text-foreground",
          )}
        >
          <CalendarPlus className="mr-2 h-4 w-4 opacity-70" />
          Zaplanuj zajęcia
        </Button>

        <Button
          variant="secondary"
          className={cn(
            "w-full justify-center text-sm font-semibold text-foreground/80 shadow-none transition-colors",
            colorInfo.hoverBg,
            "hover:text-foreground",
          )}
        >
          <FilePenLine className="mr-2 h-4 w-4 opacity-70" />
          Zadaj pracę domową
        </Button>
      </div>
    </Card>
  );
}
