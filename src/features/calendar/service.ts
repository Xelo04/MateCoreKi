// ==========================================
// SERWIS: Komunikacja z API kalendarza
// ==========================================
// Warstwa anti-corruption - mapuje DTO z backendu na modele domenowe.
// Obecnie zawiera mocki; po integracji z FastAPI zamieniamy na api-client.ts.

import { StudentService } from "@/features/students/service";
import type { StudentDetails } from "@/features/students/types";
import type { StudentFormData } from "@/features/students/schema";
import type {
  ApiLesson,
  CalendarLessonItem,
  CalendarStudentSource,
  Lesson,
  ScheduleSlot,
  OverlapConflict,
} from "./types";
import type {
  LessonCancelData,
  LessonMoveData,
  LessonNotesData,
  LessonCreateData,
} from "./schema";
import {
  expandScheduleToItems,
  mergeLessonsIntoCalendar,
  timeToMinutes,
  addMinutesToTime,
  parseDateKey,
  jsDayToDayOfWeek,
  toDateKey,
} from "./utils";

// TODO: [BACKEND] Usunąć delay i mockLessons po podpięciu FastAPI
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let mockLessons: ApiLesson[] = [
  {
    id: "lesson-1",
    student_id: "uuid-3",
    date: "2026-09-28",
    start_time: "15:00",
    duration_mins: 60,
    status: "cancelled",
    topic: null,
    tutor_notes: "Choroba",
    board_id: null,
    original_date: null,
    original_start_time: null,
    who_cancelled: "student",
    cancelled_at: "2026-09-28T10:00:00Z",
    created_at: "2025-11-17T10:00:00Z",
    is_paid: true,
  },
  {
    id: "lesson-2",
    student_id: "uuid-2",
    date: "2026-10-01",
    start_time: "15:00",
    duration_mins: 60,
    status: "moved",
    topic: null,
    tutor_notes: "Przeniesione z 2026-09-30",
    board_id: null,
    original_date: "2026-09-30",
    original_start_time: "12:00",
    who_cancelled: null,
    cancelled_at: null,
    created_at: "2025-11-17T10:00:00Z",
    is_paid: false,
  },
];

// * Mapowanie DTO z backendu na model domenowy
export const mapLessonFromApi = (api: ApiLesson): Lesson => ({
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
  isPaid: api.is_paid,
  createdAt: new Date(api.created_at),
});

// * Konwersja slotu z profilu ucznia na slot kalendarza
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
  createdAt: studentCreatedAt,
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

// * Szukanie indeksu lekcji w mocku po kluczu naturalnym
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

// * Upsert lekcji w mocku - aktualizuje istniejącą lub dodaje nową
const upsertApiLesson = (
  base: Omit<ApiLesson, "id" | "created_at">,
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
    is_paid: false,
    created_at: new Date().toISOString(),
  };
  mockLessons = [created, ...mockLessons];
  return created;
};

export const CalendarService = {
  // TODO: [BACKEND] GET /api/v1/calendar/lessons?from=...&to=...&student_id=...
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

    // * Wirtualne lekcje z harmonogramów + realne z mocku/DB
    const virtual = expandScheduleToItems(sources, from, to);

    const lessonsInRange = mockLessons
      .filter((l) => l.date >= from && l.date <= to)
      .filter((l) => !studentId || l.student_id === studentId)
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

    const uniqueLessons = Array.from(
      new Map(lessonsInRange.map((l) => [l.id, l])).values(),
    ).map(mapLessonFromApi);

    return mergeLessonsIntoCalendar(virtual, uniqueLessons, nameMap);
  },

  // TODO: [BACKEND] GET /api/v1/calendar/lessons/{id}
  async getLesson(id: string): Promise<Lesson | null> {
    await delay(200);
    if (id.startsWith("v-")) return null;
    const row = mockLessons.find((l) => l.id === id);
    return row ? mapLessonFromApi(row) : null;
  },

  // TODO: [BACKEND] POST /api/v1/calendar/lessons/cancel
  async cancelLesson(
    studentId: string,
    date: string,
    startTime: string,
    durationMins: number,
    data: LessonCancelData,
  ): Promise<Lesson> {
    await delay(400);
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
      duration_mins: durationMins,
      status: "cancelled",
      topic: null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: null,
      original_date: null,
      original_start_time: null,
      who_cancelled: data.whoCancelled,
      cancelled_at: new Date().toISOString(),
      is_paid: existing?.is_paid ?? false,
    });
    return mapLessonFromApi(row);
  },

  // TODO: [BACKEND] POST /api/v1/calendar/lessons/move
  // TODO: [BACKEND] Obsłużyć scope "all" - zaktualizować scheduleSlots ucznia
  async moveLesson(
    studentId: string,
    fromDate: string,
    fromStartTime: string,
    durationMins: number,
    data: LessonMoveData,
  ): Promise<Lesson> {
    await delay(400);

    const existing = mockLessons.find(
      (l) =>
        l.student_id === studentId &&
        l.date === fromDate &&
        l.start_time === fromStartTime,
    );

    // * Zachowaj oryginalną datę źródłową przy kolejnych przesunięciach
    const targetOriginalDate = existing?.original_date || fromDate;
    const targetOriginalStartTime =
      existing?.original_start_time || fromStartTime;

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
      date: data.date || fromDate,
      start_time: data.startTime,
      duration_mins: data.durationMins ?? durationMins,
      status: "moved",
      topic: null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: null,
      original_date: targetOriginalDate,
      original_start_time: targetOriginalStartTime,
      who_cancelled: null,
      cancelled_at: null,
      is_paid: existing?.is_paid ?? false,
    });
    return mapLessonFromApi(row);
  },

  // TODO: [BACKEND] PATCH /api/v1/calendar/lessons/notes
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
      status: existing?.status ?? "planned",
      topic: data.topic?.trim() || existing?.topic || null,
      tutor_notes: data.tutorNotes?.trim() || null,
      board_id: existing?.board_id ?? null,
      original_date: existing?.original_date ?? null,
      original_start_time: existing?.original_start_time ?? null,
      who_cancelled: existing?.who_cancelled ?? null,
      cancelled_at: existing?.cancelled_at ?? null,
      is_paid: existing?.is_paid ?? false,
    });
    return mapLessonFromApi(row);
  },

  // TODO: [BACKEND] POST /api/v1/calendar/lessons/check-overlap
  // * W produkcji cała logika kolizji będzie po stronie backendu
  async checkOverlap(params: {
    readonly date: string;
    readonly startTime: string;
    readonly durationMins: number;
    readonly recurrence: "none" | "weekly" | "biweekly";
    readonly dayOfWeek?: number;
  }): Promise<readonly OverlapConflict[]> {
    const { date, startTime, durationMins, recurrence, dayOfWeek } = params;
    if (!date || !startTime || !durationMins || durationMins < 15) return [];

    const newStart = timeToMinutes(startTime);
    const newEnd = newStart + durationMins;

    let endScan = date;
    if (recurrence !== "none") {
      const end = parseDateKey(date);
      end.setDate(end.getDate() + 84);
      endScan = toDateKey(end);
    }

    const items = await this.getCalendarLessons(date, endScan);
    const conflicts: OverlapConflict[] = [];
    const anchor = parseDateKey(date);

    for (const item of items) {
      if (item.status === "cancelled" || item.status === "moved") continue;

      const itemStart = timeToMinutes(item.startTime);
      const itemEnd = itemStart + item.durationMins;
      if (!(newStart < itemEnd && itemStart < newEnd)) continue;

      if (recurrence === "none") {
        if (item.date !== date) continue;
      } else {
        if (item.date < date) continue;
        const targetDow =
          dayOfWeek ?? jsDayToDayOfWeek(parseDateKey(date).getDay());
        if (jsDayToDayOfWeek(parseDateKey(item.date).getDay()) !== targetDow)
          continue;

        if (recurrence === "biweekly") {
          const diffDays = Math.round(
            (parseDateKey(item.date).getTime() - anchor.getTime()) /
              (1000 * 60 * 60 * 24),
          );
          if (Math.floor(diffDays / 7) % 2 !== 0) continue;
        }
      }

      conflicts.push({
        studentFirstName: item.studentFirstName,
        studentLastName: item.studentLastName,
        date: item.date,
        startTime: item.startTime,
        endTime: addMinutesToTime(item.startTime, item.durationMins),
        status: item.status,
      });
    }

    // * Deduplikacja po kluczu uczeń+data+godzina
    const seen = new Set<string>();
    return conflicts.filter((c) => {
      const k = `${c.studentFirstName}|${c.date}|${c.startTime}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  },

  // TODO: [BACKEND] POST /api/v1/calendar/lessons
  // TODO: [BACKEND] Cykliczne lekcje - backend obsłuży atomowo
  async createLesson(data: LessonCreateData): Promise<void> {
    await delay(400);

    if (data.recurrence === "none") {
      upsertApiLesson({
        student_id: data.studentId,
        date: data.date!,
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
        is_paid: false,
      });
    } else {
      // * Cykliczne - dodajemy slot do harmonogramu ucznia
      const student = await StudentService.getStudentDetails(data.studentId);

      const studentForm: StudentFormData = {
        firstName: student.firstName,
        lastName: student.lastName,
        educationType: student.educationType,
        classYear: student.classYear,
        mathLevel: student.mathLevel,
        email: student.email || "",
        phone: student.phone || "",
        parentPhone: student.parentPhone || "",
        hourlyRate: student.hourlyRate,
        notes: student.notes || "",
        scheduleSlots: (student.scheduleSlots || []).map((s) => ({
          id: s.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          durationMins: s.durationMins,
          recurrence: s.recurrence,
          date: s.date || "",
        })),
      };

      studentForm.scheduleSlots.push({
        id: `slot-${Date.now()}`,
        dayOfWeek: data.dayOfWeek!,
        startTime: data.startTime,
        durationMins: data.durationMins,
        recurrence: data.recurrence,
        date: data.date || "",
      });

      await StudentService.updateStudent(student.id, studentForm);
    }
  },

  // TODO: [BACKEND] POST /api/v1/calendar/lessons/toggle-payment
  async toggleLessonPayment(
    studentId: string,
    date: string,
    startTime: string,
    durationMins: number,
    isPaid: boolean,
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
      status: existing?.status ?? "planned",
      topic: existing?.topic ?? null,
      tutor_notes: existing?.tutor_notes ?? null,
      board_id: existing?.board_id ?? null,
      original_date: existing?.original_date ?? null,
      original_start_time: existing?.original_start_time ?? null,
      who_cancelled: existing?.who_cancelled ?? null,
      cancelled_at: existing?.cancelled_at ?? null,
      is_paid: isPaid,
    });
    return mapLessonFromApi(row);
  },
};
