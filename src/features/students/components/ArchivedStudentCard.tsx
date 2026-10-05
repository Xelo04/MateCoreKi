// ==========================================
// KOMPONENT: Karta Zarchiwizowanego Ucznia
// ==========================================
// Renderuje wyszarzony kafelek dla ucznia ze statusem 'archived'.
// Zawiera tylko jedną akcję: Przywrócenie z archiwum.

"use client";

import { ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { StudentListItem } from "../types";
import { formatEducationLabel, getInitials } from "../utils";

interface ArchivedStudentCardProps {
  student: StudentListItem;
  onRestore: (id: string) => void;
}

export function ArchivedStudentCard({
  student,
  onRestore,
}: ArchivedStudentCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all opacity-80 hover:opacity-100">
      <div className="flex items-center gap-3">
        {/* Szary, nieaktywny awatar w kształcie kwadratu. */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-bold text-muted-foreground">
          {getInitials(student.firstName, student.lastName)}
        </div>

        {/* Dane w przygaszonej kolorystyce. */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-foreground/80">
            {student.firstName} {student.lastName}
          </h3>
          <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
            {formatEducationLabel(
              student.educationType,
              student.classYear,
              student.mathLevel,
            )}
          </p>
        </div>
      </div>

      {/* Przycisk aktywacji przywracający ucznia na główną listę. */}
      <div className="mt-5" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          className="h-10 w-full justify-center gap-2 text-xs font-medium border-border text-muted-foreground shadow-none hover:bg-secondary/50 hover:text-foreground"
          onClick={() => onRestore(student.id)}
        >
          <ArchiveRestore className="h-3.5 w-3.5" /> Przywróć ucznia
        </Button>
      </div>
    </div>
  );
}
