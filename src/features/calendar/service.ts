// ==========================================
// MODUŁ KALENDARZA: Serwis komunikacji z API
// ==========================================

import { StudentService } from "@/features/students/service";
import type { StudentDetails } from "@/features/students/types";
import type {
  ApiLesson,
  CalendarLessonItem,
  CalendarStudentSource,
  Lesson,
  LessonStatus,
  ScheduleSlot,
} from "./types";
import type {
  LessonCancelData,
  LessonMoveData,
  LessonNotesData,
  LessonUpsertData,
} from "./schema";
import {
  expandScheduleToItems,
  mapLessonFromApi,
  mergeLessonsIntoCalendar,
} from "./utils";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

// * Lokalna "tabela" zmaterializowanych lekcji
let mockLessons: ApiLesson[] = [
  // Przykład: odwołane zajęcia Anny
  {
    id: "lesson-1",
    student_id: "uuid-3",
    date: "2026-09-22",
    start_time: "15:00",
    duration_mins: 60,
    status: "cancelled",
    topic: null,
    tutor_notes: "Choroba",
    board_id: null,
    original_date: null,
    original_start_time: null,
    who_cancelled: "student",
    cancelled_at: "2026-09-22T10:00:00Z",
    created_at: "2025-11-17T10:00:00Z",
  },
  // Przykład: przeniesione zajęcia Bartka
  {
    id: "lesson-2",
    student_id: "uuid-2",
    date: "2026-09-23",
    start_time: "15:00",
    duration_mins: 60,
    status: "moved",
    topic: null,
    tutor_notes: "Przeniesione z 2026-09-22",
    board_id: null,
    original_date: "2026-09-22",
    original_start_time: "12:00",
    who_cancelled: null,
    cancelled_at: null,
    created_at: "2025-11-17T10:00:00Z",
  },
];

/** Mapuje slot z modułu students → slot kalendarza */
const mapStudentSlotToCalendarSlot = (
  slot: NonNullable<StudentDetails["scheduleSlots"]>[number],
  studentCreatedAt: Date,
): ScheduleSlot => ({
  id: slot.id,
  dayOfWeek: slot.dayOfWeek,
  startTime: slot.startTime,
  durationMins: slot.durationMins,
  recurrence: slot.recurrence,
  date: slot.date,
  createdAt: studentCreatedAt, // w students slot może nie mieć createdAt — fallback
  endedAt: null,
});

const toCalendarStudent = (s: StudentDetails): CalendarStudentSource => ({
  id: s.id,
  firstName: s.firstName,
  lastName: s.lastName,
  createdAt: s.createdAt,
  scheduleSlots: s.scheduleSlots
    ? s.scheduleSlots.map((sl) => mapStudentSlotToCalendarSlot(sl, s.createdAt))
    : null,
});

const findLessonIndex = (
  studentId: string,
  date: string,
  startTime: string,
): number =>
  mockLessons.findIndex(
    (l) =>
      l.student_id === studentId &&
      l.date === date &&
      l.start_time === startTime,
  );

const upsertApiLesson = (
  base: Omit<ApiLesson, "id" | "created_at"> & { id?: string },
): ApiLesson => {
  const idx = findLessonIndex(base.student_id, base.date, base.start_time);
  if (idx >= 0) {
    const updated: ApiLesson = {
      ...mockLessons[idx],
      ...base,
      id: mockLessons[idx].id,
      created_at: mockLessons[idx].created_at,
    };
    mockLessons[idx] = updated;
    return updated;
  }
  const created: ApiLesson = {
    ...base,
    id: `lesson-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockLessons = [created, ...mockLessons];
  return created;
};

export const CalendarService = {
  /**
   * Główne API widoku tygodnia / profilu.
   * from/to: YYYY-MM-DD (włącznie)
   * studentId?: filtr do zakładki profilu
   */
  async getCalendarLessons(
    from: string,
    to: string,
    studentId?: string,
  ): Promise<CalendarLessonItem[]> {
    await delay(400);

    const list = await StudentService.getStudentsList();
    const filtered = studentId
      ? list.filter((s) => s.id === studentId)
      : list.filter((s) => s.status === "active");

    const details = await Promise.all(
      filtered.map((s) => StudentService.getStudentDetails(s.id)),
    );

    const sources = details.map(toCalendarStudent);
    const nameMap = new Map(
      sources.map((s) => [
        s.id,
        { firstName: s.firstName, lastName: s.lastName },
      ]),
    );

    const virtual = expandScheduleToItems(sources, from, to);

    const lessonsInRange = mockLessons
      .filter((l) => l.date >= from && l.date <= to)
      .filter((l) => !studentId || l.student_id === studentId)
      // moved: original może być w zakresie, target też — bierzemy szerzej
      .concat(
        mockLessons.filter(
          (l) =>
            l.status === "moved" &&
            l.original_date &&
            l.original_date >= from &&
            l.original_date <= to &&
            (!studentId || l.student_id === studentId),
        ),
      );

    // unikalne po id
    const uniqueLessons = Array.from(
      new Map(lessonsInRange.map((l) => [l.id, l])).values(),
    ).map(mapLessonFromApi);

    return mergeLessonsIntoCalendar(virtual, uniqueLessons, nameMap);
  },

  async getLesson(id: string): Promise<Lesson | null> {
    await delay(200);
    if (id.startsWith("v-")) return null;
    const row = mockLessons.find((l) => l.id === id);
    return row ? mapLessonFromApi(row) : null;
  },

  /** Nowa lekcja ad-hoc LUB nadpisanie wirtualnej */
  async upsertLesson(data: LessonUpsertData): Promise<Lesson> {
    await delay(400);
    const row = upsertApiLesson({
      student_id: data.studentId,
      date: data.date,
      start_time: data.startTime,
      duration_mins: data.durationMins,
      status: "planned",
      topic: data.topic?.trim() || null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: null,
      original_date: null,
      original_start_time: null,
      who_cancelled: null,
      cancelled_at: null,
    });
    return mapLessonFromApi(row);
  },

  async cancelLesson(
    studentId: string,
    date: string,
    startTime: string,
    durationMins: number,
    data: LessonCancelData,
  ): Promise<Lesson> {
    await delay(400);
    const row = upsertApiLesson({
      student_id: studentId,
      date,
      start_time: startTime,
      duration_mins: durationMins,
      status: "cancelled",
      topic: null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: null,
      original_date: null,
      original_start_time: null,
      who_cancelled: data.whoCancelled,
      cancelled_at: new Date().toISOString(),
    });
    return mapLessonFromApi(row);
  },

  async moveLesson(
    studentId: string,
    fromDate: string,
    fromStartTime: string,
    durationMins: number,
    data: LessonMoveData,
  ): Promise<Lesson> {
    await delay(400);
    // * Usuń ewentualny stary materialny wpis na from
    mockLessons = mockLessons.filter(
      (l) =>
        !(
          l.student_id === studentId &&
          l.date === fromDate &&
          l.start_time === fromStartTime
        ),
    );

    const row = upsertApiLesson({
      student_id: studentId,
      date: data.date,
      start_time: data.startTime,
      duration_mins: data.durationMins ?? durationMins,
      status: "moved",
      topic: null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: null,
      original_date: fromDate,
      original_start_time: fromStartTime,
      who_cancelled: null,
      cancelled_at: null,
    });
    return mapLessonFromApi(row);
  },

  async updateLessonNotes(
    studentId: string,
    date: string,
    startTime: string,
    durationMins: number,
    data: LessonNotesData,
  ): Promise<Lesson> {
    await delay(300);
    const existing = mockLessons.find(
      (l) =>
        l.student_id === studentId &&
        l.date === date &&
        l.start_time === startTime,
    );

    const row = upsertApiLesson({
      student_id: studentId,
      date,
      start_time: startTime,
      duration_mins: existing?.duration_mins ?? durationMins,
      status: (existing?.status as LessonStatus) ?? "planned",
      topic: data.topic?.trim() || existing?.topic || null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: existing?.board_id ?? null,
      original_date: existing?.original_date ?? null,
      original_start_time: existing?.original_start_time ?? null,
      who_cancelled: existing?.who_cancelled ?? null,
      cancelled_at: existing?.cancelled_at ?? null,
    });
    return mapLessonFromApi(row);
  },
};
