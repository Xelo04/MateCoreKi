// ==========================================
// MODUŁ STUDENTÓW: Serwis komunikacji z API
// ==========================================

import type {
  ApiStudentDetails,
  ApiStudentListItem,
  StudentDetails,
  StudentListItem,
  ApiScheduleSlot,
  ApiStudentPayload,
  ScheduleSlot,
  DayOfWeek,
} from "./types";
import type { StudentFormData } from "./schema";

const mapApiToScheduleSlot = (
  api: ApiScheduleSlot,
  index: number,
): ScheduleSlot => ({
  id: api.id || `slot-${index}`,
  dayOfWeek: api.day_of_week as DayOfWeek,
  startTime: api.start_time,
  durationMins: api.duration_mins,
  recurrence: api.recurrence,
  date: api.date || undefined,
});

const mapStudentListItem = (api: ApiStudentListItem): StudentListItem => ({
  id: api.id,
  firstName: api.first_name,
  lastName: api.last_name,
  educationType: api.education_type,
  classYear: api.class_year,
  mathLevel: api.math_level,
  status: api.status,
  scheduleSlots: api.schedule_slots
    ? api.schedule_slots.map(mapApiToScheduleSlot)
    : null,
});

const mapStudentDetails = (api: ApiStudentDetails): StudentDetails => ({
  ...mapStudentListItem(api),
  hourlyRate: api.hourly_rate,
  email: api.email,
  phone: api.phone,
  parentPhone: api.parent_phone,
  notes: api.notes,
  createdAt: new Date(api.created_at),
});

const mapScheduleSlotToApi = (slot: ScheduleSlot): ApiScheduleSlot => ({
  // * UUID generowane na frontendzie ma 36 znaków. Nie wysyłamy go jako ID do utworzenia.
  id: slot.id.length === 36 ? undefined : slot.id,
  day_of_week: slot.dayOfWeek ? slot.dayOfWeek : null,
  start_time: slot.startTime,
  duration_mins: slot.durationMins,
  recurrence: slot.recurrence,
  date: slot.date && slot.date.length > 0 ? slot.date : null,
});

const mapFormToApiPayload = (form: StudentFormData): ApiStudentPayload => ({
  first_name: form.firstName.trim(),
  last_name: form.lastName.trim(),
  education_type: form.educationType,
  class_year: form.classYear,
  math_level: form.mathLevel,
  email: form.email && form.email.length > 0 ? form.email.trim() : null,
  phone: form.phone && form.phone.length > 0 ? form.phone.trim() : null,
  parent_phone:
    form.parentPhone && form.parentPhone.length > 0
      ? form.parentPhone.trim()
      : null,
  hourly_rate: form.hourlyRate ?? null,
  notes: form.notes && form.notes.length > 0 ? form.notes : null,
  schedule_slots:
    form.scheduleSlots.length > 0
      ? form.scheduleSlots.map(mapScheduleSlotToApi)
      : null,
});

// ==========================================
// 🗄️ MOCK DATABASE (Tymczasowa baza)
// ==========================================
let mockDatabase: ApiStudentDetails[] = [
  // 1. ZWYKŁY PRZYPADEK (Jeden regularny termin)
  {
    id: "uuid-1",
    first_name: "Jan",
    last_name: "Kowalski",
    education_type: "high_school",
    class_year: 3,
    math_level: "extended",
    status: "active",
    hourly_rate: 150,
    email: "jan@kowalski.pl",
    phone: "123456789",
    parent_phone: "987654321",
    notes: "Potrzebuje pomocy z trygonometrii",
    schedule_slots: [
      {
        id: "s-1",
        day_of_week: 3,
        start_time: "16:30",
        duration_mins: 60,
        recurrence: "weekly",
        date: null,
      },
      {
        id: "s-4",
        day_of_week: 5,
        start_time: "13:00",
        duration_mins: 90,
        recurrence: "biweekly",
        date: "2026-09-15",
      },
    ],
    created_at: "2024-01-10T10:00:00Z",
  },
  // 2. EDGE CASE: Ekstremalnie długie dane, brak terminu
  {
    id: "uuid-2",
    first_name: "Konstanty-Aleksander",
    last_name: "Wojciechowski-Szczepankiewicz",
    education_type: "primary_school",
    class_year: 8,
    math_level: null,
    status: "active",
    hourly_rate: 120,
    email: null,
    phone: null,
    parent_phone: null,
    notes: "Przygotowanie do E8",
    schedule_slots: null,
    created_at: "2024-02-15T14:30:00Z",
  },
  // 3. WIELE TERMINÓW (Jeden regularny, jeden jednorazowy nadchodzący)
  {
    id: "uuid-3",
    first_name: "Anna",
    last_name: "Maj",
    education_type: "technical_school",
    class_year: 1,
    math_level: "basic",
    status: "active",
    hourly_rate: null,
    email: null,
    phone: null,
    parent_phone: null,
    notes: null,
    schedule_slots: [
      {
        id: "s-2",
        day_of_week: 2,
        start_time: "15:00",
        duration_mins: 45,
        recurrence: "weekly",
        date: null,
      },
      {
        id: "s-8",
        day_of_week: 6,
        start_time: "16:30",
        duration_mins: 145,
        recurrence: "biweekly",
        date: null,
      },
      {
        id: "s-3",
        day_of_week: 6,
        start_time: "10:00",
        duration_mins: 90,
        recurrence: "none",
        date: "2026-09-25",
      },
    ],
    created_at: "2024-03-01T08:00:00Z",
  },
  // 4. ARCHIWUM
  {
    id: "uuid-4",
    first_name: "Michał",
    last_name: "Wiśniewski",
    education_type: "technical_school",
    class_year: 5,
    math_level: "basic",
    status: "archived",
    hourly_rate: 140,
    email: "michal@example.com",
    phone: null,
    parent_phone: null,
    notes: "Zdał maturę",
    schedule_slots: null,
    created_at: "2023-09-01T08:00:00Z",
  },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const StudentService = {
  async getStudentsList(): Promise<StudentListItem[]> {
    await delay(300);
    return mockDatabase.map(mapStudentListItem);
  },

  async getStudentDetails(id: string): Promise<StudentDetails> {
    await delay(300);
    const student = mockDatabase.find((s) => s.id === id);
    if (!student) throw new Error("Nie znaleziono ucznia");
    return mapStudentDetails(student);
  },

  async archiveStudent(id: string): Promise<void> {
    await delay(200);
    mockDatabase = mockDatabase.map((s) =>
      s.id === id ? { ...s, status: "archived" } : s,
    );
  },

  async restoreStudent(id: string): Promise<void> {
    await delay(200);
    mockDatabase = mockDatabase.map((s) =>
      s.id === id ? { ...s, status: "active" } : s,
    );
  },

  async createStudent(form: StudentFormData): Promise<StudentDetails> {
    await delay(400);
    const payload = mapFormToApiPayload(form);

    const newId = `uuid-${Date.now()}`;
    const newApiStudent: ApiStudentDetails = {
      id: newId,
      first_name: payload.first_name,
      last_name: payload.last_name,
      education_type: payload.education_type,
      class_year: payload.class_year,
      math_level: payload.math_level,
      status: "active",
      hourly_rate: payload.hourly_rate,
      email: payload.email,
      phone: payload.phone,
      parent_phone: payload.parent_phone,
      notes: payload.notes,
      schedule_slots: payload.schedule_slots,
      created_at: new Date().toISOString(),
    };

    mockDatabase = [newApiStudent, ...mockDatabase];
    return mapStudentDetails(newApiStudent);
  },

  async updateStudent(
    id: string,
    form: StudentFormData,
  ): Promise<StudentDetails> {
    await delay(400);
    const payload = mapFormToApiPayload(form);

    const index = mockDatabase.findIndex((s) => s.id === id);
    if (index === -1) throw new Error("Nie znaleziono ucznia");

    const updatedApiStudent: ApiStudentDetails = {
      ...mockDatabase[index],
      first_name: payload.first_name,
      last_name: payload.last_name,
      education_type: payload.education_type,
      class_year: payload.class_year,
      math_level: payload.math_level,
      hourly_rate: payload.hourly_rate,
      email: payload.email,
      phone: payload.phone,
      parent_phone: payload.parent_phone,
      notes: payload.notes,
      schedule_slots: payload.schedule_slots,
    };

    mockDatabase[index] = updatedApiStudent;
    return mapStudentDetails(updatedApiStudent);
  },
};
