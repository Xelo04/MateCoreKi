// ==========================================
// KOMPONENT: Zakładka "Informacje" ucznia
// ==========================================

"use client";

import {
  Clock,
  CalendarRange,
  Repeat,
  Pencil,
  StickyNote,
  UserCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentDetails } from "../types";
import {
  formatEducationLabelFull,
  formatSchedulesForCard,
  getInitials,
} from "../utils";
import { cn } from "@/lib/utils";

interface StudentInfoTabProps {
  student: StudentDetails;
  colorInfo: { solid: string; glow: string };
  onEditClick: () => void;
}

export function StudentInfoTab({
  student,
  colorInfo,
  onEditClick,
}: StudentInfoTabProps) {
  const schedules = formatSchedulesForCard(student.scheduleSlots);

  const formatPhone = (phone: string) => {
    return phone.replace(/(\d{3})(?=\d)/g, "$1 ");
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-md",
              colorInfo.solid,
            )}
          >
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {student.firstName} {student.lastName}
            </h1>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {formatEducationLabelFull(
                student.educationType,
                student.classYear,
                student.mathLevel,
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onEditClick}>
            <Pencil className="mr-2 h-4 w-4" /> Edytuj
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* KAFELEK: Pozostałe informacje */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-bold text-foreground flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-primary" />
            Pozostałe informacje
          </h3>
          <div className="space-y-5">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Telefon
              </span>
              <span className="text-sm font-semibold text-foreground">
                {student.phone ? formatPhone(student.phone) : "Brak"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                E-mail
              </span>
              <span className="text-sm font-semibold text-foreground break-all">
                {student.email || "Brak"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Stawka godzinowa
              </span>
              <span className="text-sm font-bold text-foreground">
                {student.hourlyRate ? `${student.hourlyRate} zł / h` : "Brak"}
              </span>
            </div>
          </div>
        </div>

        {/* KAFELEK: Harmonogram */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Harmonogram spotkań
          </h3>

          {schedules.length > 0 ? (
            <div className="flex flex-col gap-4">
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
                      <span className="text-sm font-bold leading-tight text-foreground/90">
                        {schedule.text}
                      </span>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {schedule.durationMins} min
                        </span>
                        <span>•</span>
                        {isWeekly && (
                          <span className="flex items-center gap-1">
                            <Repeat className="h-3 w-3" /> Co tydzień
                          </span>
                        )}
                        {isBiweekly && (
                          <span className="flex items-center gap-1">
                            <CalendarRange className="h-3 w-3" /> Co 2 tyg.
                          </span>
                        )}
                        {isSingle && (
                          <span className="font-semibold text-amber-600">
                            Jednorazowo
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-secondary/10 text-center">
              <CalendarRange className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Brak terminów.</p>
            </div>
          )}
        </div>

        {/* KAFELEK: Notatki */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
          <h3 className="mb-5 text-sm font-bold text-foreground flex items-center gap-2">
            <StickyNote className="h-4 w-4 text-primary" />
            Notatki
          </h3>
          {student.notes ? (
            <p className="whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">
              {student.notes}
            </p>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-secondary/10 text-center">
              <StickyNote className="mb-2 h-6 w-6 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Brak notatek.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
