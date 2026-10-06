// ==========================================
// UTILS: Logika formatowania
// ==========================================

import type {
  EducationType,
  MathLevel,
  Recurrence,
  ScheduleSlot,
} from "./types";

// * Safe parse date ISO "YYYY-MM-DD" w czasie lokalnym (T12:00:00) zapobiega przesunięciom stref UTC/DST
export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

// * Formatuje systemowe klucze edukacji na przyjazny tekst, np. "3 LO (Rozszerzenie)"
export const formatEducationLabel = (
  type: EducationType,
  year: number,
  level: MathLevel,
): string => {
  let typeStr = "";
  if (type === "primary_school") typeStr = "SP";
  if (type === "high_school") typeStr = "LO";
  if (type === "technical_school") typeStr = "Technikum";

  if (type === "primary_school") return `Klasa ${year} ${typeStr}`;

  const levelStr = level === "extended" ? "Rozszerzenie" : "Podstawa";
  return `${year} ${typeStr} (${levelStr})`;
};

// * Wyciąga 2 pierwsze litery imienia i nazwiska w formacie UPPERCASE (np. "JK")
export const getInitials = (firstName: string, lastName: string): string => {
  const f = firstName.trim().charAt(0) || "";
  const l = lastName.trim().charAt(0) || "";
  return `${f}${l}`.toUpperCase();
};

// * Paleta kolorów dla kart uczniów
export const STUDENT_COLORS = [
  {
    glow: "bg-blue-500/15",
    solid: "bg-blue-500",
    hoverBorder: "hover:border-blue-500/40",
    hoverBg: "hover:bg-blue-500/10",
  },
  {
    glow: "bg-emerald-500/15",
    solid: "bg-emerald-500",
    hoverBorder: "hover:border-emerald-500/40",
    hoverBg: "hover:bg-emerald-500/10",
  },
  {
    glow: "bg-violet-500/15",
    solid: "bg-violet-500",
    hoverBorder: "hover:border-violet-500/40",
    hoverBg: "hover:bg-violet-500/10",
  },
  {
    glow: "bg-rose-500/15",
    solid: "bg-rose-500",
    hoverBorder: "hover:border-rose-500/40",
    hoverBg: "hover:bg-rose-500/10",
  },
  {
    glow: "bg-amber-500/15",
    solid: "bg-amber-500",
    hoverBorder: "hover:border-amber-500/40",
    hoverBg: "hover:bg-amber-500/10",
  },
  {
    glow: "bg-fuchsia-500/15",
    solid: "bg-fuchsia-500",
    hoverBorder: "hover:border-fuchsia-500/40",
    hoverBg: "hover:bg-fuchsia-500/10",
  },
  {
    glow: "bg-cyan-500/15",
    solid: "bg-cyan-500",
    hoverBorder: "hover:border-cyan-500/40",
    hoverBg: "hover:bg-cyan-500/10",
  },
];

// * Zwraca kolor karty ucznia na podstawie jego ID (hashowanie)
export const getStudentColor = (id: string) => {
  const hash = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return STUDENT_COLORS[hash % STUDENT_COLORS.length];
};

const DAY_NAMES: Record<number, string> = {
  1: "Poniedziałek",
  2: "Wtorek",
  3: "Środa",
  4: "Czwartek",
  5: "Piątek",
  6: "Sobota",
  7: "Niedziela",
};

export interface FormattedSchedule {
  text: string;
  durationMins: number;
  recurrence: Recurrence;
}

// * Zwraca listę terminów do wyświetlenia na karcie
export const formatSchedulesForCard = (
  slots: ScheduleSlot[] | null,
): FormattedSchedule[] => {
  if (!slots || slots.length === 0) return [];

  const results: FormattedSchedule[] = [];

  // * Wszystkie terminy regularne
  slots
    .filter((s) => s.recurrence !== "none")
    .forEach((slot) => {
      const dayName = slot.dayOfWeek ? DAY_NAMES[slot.dayOfWeek] : "";
      results.push({
        text: `${dayName}, ${slot.startTime}`,
        durationMins: slot.durationMins,
        recurrence: slot.recurrence,
      });
    });

  // * Najbliższy termin jednorazowy (w przyszłości)
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingSingle = slots
    .filter((s) => s.recurrence === "none" && s.date)
    .filter((s) => parseLocalDate(s.date!) >= now)
    .sort(
      (a, b) =>
        parseLocalDate(a.date!).getTime() - parseLocalDate(b.date!).getTime(),
    )[0];

  if (upcomingSingle) {
    const [, month, day] = upcomingSingle.date!.split("-");
    const dayName = upcomingSingle.dayOfWeek
      ? DAY_NAMES[upcomingSingle.dayOfWeek]
      : "";
    results.push({
      text: `${day}.${month} (${dayName}), ${upcomingSingle.startTime}`,
      durationMins: upcomingSingle.durationMins,
      recurrence: "none",
    });
  }

  return results;
};

// * Formatuje edukację na pełne słowa
export const formatEducationLabelFull = (
  type: EducationType,
  year: number,
  level: MathLevel,
): string => {
  let typeStr = "";
  if (type === "primary_school") typeStr = "Szkoła Podstawowa";
  if (type === "high_school") typeStr = "Liceum";
  if (type === "technical_school") typeStr = "Technikum";

  if (type === "primary_school") return `Klasa ${year} ${typeStr}`;

  const levelStr = level === "extended" ? "Rozszerzenie" : "Podstawa";
  return `Klasa ${year} ${typeStr} (${levelStr})`;
};
