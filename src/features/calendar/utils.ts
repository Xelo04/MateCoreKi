// ==========================================
// UTILS: Konwersje dat, reguły cykliczne, ekspansja wirtualnych klocków
// ==========================================

import type {
  CalendarLessonItem,
  CalendarStudentSource,
  DayOfWeek,
  Lesson,
  ScheduleSlot,
} from "./types";

const pad = (n: number) => String(n).padStart(2, "0");

export const toDateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDateKey = (key: string): Date => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/** JS: 0=Niedz … 6=Sob → nasz DayOfWeek 1=Pon … 7=Niedz */
export const jsDayToDayOfWeek = (jsDay: number): DayOfWeek =>
  (jsDay === 0 ? 7 : jsDay) as DayOfWeek;

export const naturalLessonKey = (
  studentId: string,
  date: string,
  startTime: string,
): string => `${studentId}|${date}|${startTime}`;

/**
 * Hierarchia startu reguły cyklicznej:
 * slot.date (start cyklu) → slot.createdAt → student.createdAt
 */
export const getSlotEffectiveStart = (slot: ScheduleSlot): Date => {
  if (slot.date) {
    const d = parseDateKey(slot.date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const c = new Date(slot.createdAt);
  c.setHours(0, 0, 0, 0);
  return c;
};

export const isSlotActiveOnDate = (slot: ScheduleSlot, day: Date): boolean => {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);

  const start = getSlotEffectiveStart(slot);
  if (dayStart < start) return false;

  if (slot.endedAt) {
    const end = new Date(slot.endedAt);
    end.setHours(0, 0, 0, 0);
    if (dayStart > end) return false;
  }

  return true;
};

/** Czy day wpada w weekly / biweekly względem kotwicy startu */
export const matchesRecurrence = (slot: ScheduleSlot, day: Date): boolean => {
  if (slot.recurrence === "none") {
    if (!slot.date) return false;
    return toDateKey(day) === slot.date;
  }

  if (slot.dayOfWeek === undefined) return false;
  if (jsDayToDayOfWeek(day.getDay()) !== slot.dayOfWeek) return false;
  if (!isSlotActiveOnDate(slot, day)) return false;

  if (slot.recurrence === "weekly") return true;

  // biweekly: cotygodniowe pary od daty startu reguły
  const start = getSlotEffectiveStart(slot);
  const diffDays = Math.floor(
    (day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const diffWeeks = Math.floor(diffDays / 7);
  return diffWeeks % 2 === 0;
};

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

export const virtualId = (
  studentId: string,
  date: string,
  startTime: string,
): string => `v-${studentId}-${date}-${startTime}`;

/**
 * Z reguł uczniów buduje wirtualne klocki w oknie [from, to].
 */
export const expandScheduleToItems = (
  students: CalendarStudentSource[],
  from: string,
  to: string,
): CalendarLessonItem[] => {
  const days = eachDateInRange(from, to);
  const items: CalendarLessonItem[] = [];

  for (const student of students) {
    const slots = student.scheduleSlots ?? [];
    for (const slot of slots) {
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
          originalDate: null,
          originalStartTime: null,
          whoCancelled: null,
          cancelledAt: null,
        });
      }
    }
  }

  return items;
};

/**
 * Merge: materialne Lesson nadpisują wirtualne po kluczu
 * studentId|date|startTime oraz obsługują "moved" (widmo na original_*).
 */
export const mergeLessonsIntoCalendar = (
  virtual: CalendarLessonItem[],
  lessons: Lesson[],
  studentNameById: Map<string, { firstName: string; lastName: string }>,
): CalendarLessonItem[] => {
  const byNatural = new Map<string, CalendarLessonItem>();

  for (const v of virtual) {
    byNatural.set(naturalLessonKey(v.studentId, v.date, v.startTime), { ...v });
  }

  for (const lesson of lessons) {
    const names = studentNameById.get(lesson.studentId) ?? {
      firstName: "?",
      lastName: "",
    };

    // * Tworzymy pełnoprawny, AKTYWNY klocek w nowym (docelowym) terminie.
    // Traktujemy go jako "planned" na siatce
    const activeItem: CalendarLessonItem = {
      id: lesson.id,
      studentId: lesson.studentId,
      studentFirstName: names.firstName,
      studentLastName: names.lastName,
      date: lesson.date,
      startTime: lesson.startTime,
      durationMins: lesson.durationMins,
      status: lesson.status === "moved" ? "planned" : lesson.status,
      topic: lesson.topic,
      tutorNotes: lesson.tutorNotes,
      boardId: lesson.boardId,
      originalDate: lesson.originalDate ?? null,
      originalStartTime: lesson.originalStartTime ?? null,
      whoCancelled: lesson.whoCancelled ?? null,
      cancelledAt: lesson.cancelledAt ?? null,
    };

    byNatural.set(
      naturalLessonKey(lesson.studentId, lesson.date, lesson.startTime),
      activeItem,
    );

    // * Jeśli to przesunięcie, tworzymy "widmo" w STARYM terminie.
    if (
      lesson.status === "moved" &&
      lesson.originalDate &&
      lesson.originalStartTime
    ) {
      const ghostKey = naturalLessonKey(
        lesson.studentId,
        lesson.originalDate,
        lesson.originalStartTime,
      );
      byNatural.set(ghostKey, {
        ...activeItem,
        id: `${lesson.id}-ghost`,
        date: lesson.originalDate,
        startTime: lesson.originalStartTime,
        status: "moved",
        originalDate: lesson.date,
        originalStartTime: lesson.startTime,
      });
    }
  }

  return Array.from(byNatural.values()).sort((a, b) => {
    const c = a.date.localeCompare(b.date);
    if (c !== 0) return c;
    return a.startTime.localeCompare(b.startTime);
  });
};

export const mapLessonFromApi = (api: import("./types").ApiLesson): Lesson => ({
  id: api.id,
  studentId: api.student_id,
  date: api.date,
  startTime: api.start_time,
  durationMins: api.duration_mins,
  status: api.status,
  topic: api.topic,
  tutorNotes: api.tutor_notes,
  boardId: api.board_id,
  originalDate: api.original_date,
  originalStartTime: api.original_start_time,
  whoCancelled: api.who_cancelled,
  cancelledAt: api.cancelled_at ? new Date(api.cancelled_at) : null,
  createdAt: new Date(api.created_at),
});

// ==========================================
// UTILS UI: Pozycjonowanie na siatce kalendarza
// ==========================================

/** Zmienia "HH:MM" na minuty od północy (np. "08:30" -> 510) */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/**
 * Konwertuje minuty na ładny ciąg znaków, np. 16:30 + 90 min -> 18:00
 */
export const addMinutesToTime = (
  startTime: string,
  durationMins: number,
): string => {
  const startMins = timeToMinutes(startTime);
  const endMins = startMins + durationMins;
  const h = Math.floor(endMins / 60) % 24;
  const m = endMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};
