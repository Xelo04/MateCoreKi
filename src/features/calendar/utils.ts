// ==========================================
// UTILS: Konwersje dat i reguły kalendarza
// ==========================================
// Czyste funkcje do operacji na czasie, datach i cykliczności slotów.

import type {
  CalendarLessonItem,
  CalendarStudentSource,
  DayOfWeek,
  Lesson,
  ScheduleSlot,
} from "./types";

// * Wspólna lista dni tygodnia dla selectów w formularzach
export const WEEK_DAYS = [
  { value: 1, label: "Poniedziałek" },
  { value: 2, label: "Wtorek" },
  { value: 3, label: "Środa" },
  { value: 4, label: "Czwartek" },
  { value: 5, label: "Piątek" },
  { value: 6, label: "Sobota" },
  { value: 7, label: "Niedziela" },
] as const;

const pad = (n: number): string => String(n).padStart(2, "0");

// * Date -> "YYYY-MM-DD" w strefie lokalnej
export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Konwersja "YYYY-MM-DD" do Date z godziną T12:00:00 w celu uniknięcia przesunięcia DST.
// ! Nigdy nie używaj new Date("YYYY-MM-DD") bezpośrednio!
export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
};

// * Konwersja JS getDay() (0=niedz) na ISO (7=niedz)
export const jsDayToDayOfWeek = (jsDay: number): DayOfWeek =>
  (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

// * Klucz naturalny lekcji - studentId + date + startTime
export const naturalLessonKey = (
  studentId: string,
  date: string,
  startTime: string,
): string => `${studentId}|${date}|${startTime}`;

// * ID lekcji wirtualnej (z harmonogramu, bez wpisu w DB)
export const virtualId = (
  studentId: string,
  date: string,
  startTime: string,
): string => `v-${studentId}-${date}-${startTime}`;

// * "HH:MM" -> liczba minut od północy
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

// * Dodaje minuty do "HH:MM", zwraca nowy czas (modulo 24h)
export const addMinutesToTime = (
  startTime: string,
  durationMins: number,
): string => {
  const endMins = timeToMinutes(startTime) + durationMins;
  const h = Math.floor(endMins / 60) % 24;
  const m = endMins % 60;
  return `${pad(h)}:${pad(m)}`;
};

// * Data startu obowiązywania slotu (znormalizowana do 00:00)
export const getSlotEffectiveStart = (slot: ScheduleSlot): Date => {
  const source = slot.date ? parseDateKey(slot.date) : new Date(slot.createdAt);
  source.setHours(0, 0, 0, 0);
  return source;
};

// * Czy slot jest aktywny w danym dniu (między startem a endedAt)
export const isSlotActiveOnDate = (slot: ScheduleSlot, day: Date): boolean => {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  if (dayStart < getSlotEffectiveStart(slot)) return false;

  if (slot.endedAt) {
    const end = new Date(slot.endedAt);
    end.setHours(0, 0, 0, 0);
    if (dayStart > end) return false;
  }

  return true;
};

// * Czy w danym dniu slot wygeneruje lekcję (none/weekly/biweekly)
export const matchesRecurrence = (slot: ScheduleSlot, day: Date): boolean => {
  if (slot.recurrence === "none") {
    return !!slot.date && toDateKey(day) === slot.date;
  }

  if (slot.dayOfWeek === undefined) return false;
  if (jsDayToDayOfWeek(day.getDay()) !== slot.dayOfWeek) return false;
  if (!isSlotActiveOnDate(slot, day)) return false;
  if (slot.recurrence === "weekly") return true;

  // * biweekly - parzyste tygodnie od startu slotu
  const start = getSlotEffectiveStart(slot);
  const diffDays = Math.floor(
    (day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  return Math.floor(diffDays / 7) % 2 === 0;
};

// * Tablica dni Date w zakresie [from, to] (domknięty obustronnie dla widoku)
export const eachDateInRange = (from: string, to: string): Date[] => {
  const out: Date[] = [];
  const cur = parseDateKey(from);
  const end = parseDateKey(to);
  while (cur <= end) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

// * Rozwija reguły harmonogramu uczniów w wirtualne lekcje na zakres dat
export const expandScheduleToItems = (
  students: CalendarStudentSource[],
  from: string,
  to: string,
): CalendarLessonItem[] => {
  const days = eachDateInRange(from, to);
  const items: CalendarLessonItem[] = [];

  for (const student of students) {
    for (const slot of student.scheduleSlots ?? []) {
      for (const day of days) {
        if (!matchesRecurrence(slot, day)) continue;

        const date = toDateKey(day);
        items.push({
          id: virtualId(student.id, date, slot.startTime),
          studentId: student.id,
          studentFirstName: student.firstName,
          studentLastName: student.lastName,
          date,
          startTime: slot.startTime,
          durationMins: slot.durationMins,
          status: "planned",
          topic: null,
          tutorNotes: null,
          boardId: null,
          isPaid: false,
        });
      }
    }
  }

  return items;
};

// * Łączy wirtualne lekcje z realnymi z DB.
// * Realna lekcja nadpisuje wirtualną na tym samym kluczu naturalnym.
// * Lekcja "moved" generuje ghosta na oryginalnym terminie.
// * Cancelled/moved pokrywające się z planned są ukrywane.
export const mergeLessonsIntoCalendar = (
  virtual: CalendarLessonItem[],
  lessons: readonly Lesson[],
  studentNameById: Map<string, { firstName: string; lastName: string }>,
): CalendarLessonItem[] => {
  const itemMap = new Map<string, CalendarLessonItem>();

  for (const v of virtual) {
    itemMap.set(naturalLessonKey(v.studentId, v.date, v.startTime), { ...v });
  }

  for (const lesson of lessons) {
    const names = studentNameById.get(lesson.studentId) ?? {
      firstName: "?",
      lastName: "",
    };

    // * "moved" na nowym terminie wyświetlamy jako "planned"
    const displayStatus: CalendarLessonItem["status"] =
      lesson.status === "moved" ? "planned" : lesson.status;

    const realItem: CalendarLessonItem = {
      id: lesson.id,
      studentId: lesson.studentId,
      studentFirstName: names.firstName,
      studentLastName: names.lastName,
      date: lesson.date,
      startTime: lesson.startTime,
      durationMins: lesson.durationMins,
      status: displayStatus,
      topic: lesson.topic,
      tutorNotes: lesson.tutorNotes,
      boardId: lesson.boardId,
      originalDate: lesson.originalDate ?? null,
      originalStartTime: lesson.originalStartTime ?? null,
      whoCancelled: lesson.whoCancelled ?? null,
      cancelledAt: lesson.cancelledAt ?? null,
      isPaid: lesson.isPaid,
    };

    itemMap.set(
      naturalLessonKey(lesson.studentId, lesson.date, lesson.startTime),
      realItem,
    );

    // * Ghost na oryginalnym terminie przeniesionej lekcji
    if (
      lesson.status === "moved" &&
      lesson.originalDate &&
      lesson.originalStartTime
    ) {
      itemMap.set(
        naturalLessonKey(
          lesson.studentId,
          lesson.originalDate,
          lesson.originalStartTime,
        ),
        {
          ...realItem,
          id: `${lesson.id}-ghost`,
          date: lesson.originalDate,
          startTime: lesson.originalStartTime,
          status: "moved",
          originalDate: lesson.date,
          originalStartTime: lesson.startTime,
          topic: null,
          tutorNotes: null,
          boardId: null,
          whoCancelled: null,
          cancelledAt: null,
        },
      );
    }
  }

  const allItems = Array.from(itemMap.values());

  // * Ukryj cancelled/moved nachodzące na istniejącą planned lekcję
  const finalItems = allItems.filter((item) => {
    if (item.status === "planned") return true;

    const itemStart = timeToMinutes(item.startTime);
    const itemEnd = itemStart + item.durationMins;

    return !allItems.some((other) => {
      if (other.status !== "planned" || other.date !== item.date) return false;
      const otherStart = timeToMinutes(other.startTime);
      return (
        itemStart < otherStart + other.durationMins && otherStart < itemEnd
      );
    });
  });

  return finalItems.sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    return cmp !== 0 ? cmp : a.startTime.localeCompare(b.startTime);
  });
};
