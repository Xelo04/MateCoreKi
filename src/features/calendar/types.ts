// ==========================================
// Typy modułu kalendarza.
// ==========================================
// Kontrakty danych: DTO z backendu (Api*), modele domenowe i modele widoku.

export type LessonStatus = "planned" | "cancelled" | "moved";
export type Recurrence = "none" | "weekly" | "biweekly";
// ! JS Date.getDay() zwraca 0 dla niedzieli - konwertuj przez jsDayToDayOfWeek()
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type CancelledBy = "tutor" | "student";

// * DTO z backendu - snake_case, 1:1 z kontraktem FastAPI
export interface ApiScheduleSlot {
  id?: string;
  day_of_week?: number;
  start_time: string;
  duration_mins: number;
  recurrence: Recurrence;
  date: string | null;
  created_at: string;
  ended_at: string | null;
}

export interface ApiLesson {
  id: string;
  student_id: string;
  date: string;
  start_time: string;
  duration_mins: number;
  status: LessonStatus;
  topic: string | null;
  tutor_notes: string | null;
  board_id: string | null;
  original_date: string | null;
  original_start_time: string | null;
  who_cancelled: CancelledBy | null;
  cancelled_at: string | null;
  is_paid: boolean;
  created_at: string;
}

// * Modele domenowe - camelCase, używane w logice aplikacji
export interface ScheduleSlot {
  id: string;
  dayOfWeek?: DayOfWeek;
  startTime: string;
  durationMins: number;
  recurrence: Recurrence;
  date?: string;
  createdAt: Date;
  endedAt: Date | null;
}

export interface Lesson {
  id: string;
  studentId: string;
  date: string;
  startTime: string;
  durationMins: number;
  status: LessonStatus;
  topic: string | null;
  tutorNotes: string | null;
  boardId: string | null;
  originalDate?: string | null;
  originalStartTime?: string | null;
  whoCancelled?: CancelledBy | null;
  cancelledAt?: Date | null;
  isPaid: boolean;
  createdAt: Date;
}

// * Model widoku - zdenormalizowany o imię/nazwisko ucznia dla siatki kalendarza
export interface CalendarLessonItem {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  date: string;
  startTime: string;
  durationMins: number;
  status: LessonStatus;
  topic: string | null;
  tutorNotes: string | null;
  boardId: string | null;
  originalDate?: string | null;
  originalStartTime?: string | null;
  whoCancelled?: CancelledBy | null;
  cancelledAt?: Date | null;
  isPaid: boolean;
}

// * Minimalna reprezentacja ucznia do rozwijania harmonogramu na daty
export interface CalendarStudentSource {
  id: string;
  firstName: string;
  lastName: string;
  scheduleSlots: ScheduleSlot[] | null;
  createdAt: Date;
}

// * Pojedyncza kolizja terminów - zwracana z checkOverlap()
export interface OverlapConflict {
  studentFirstName: string;
  studentLastName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: LessonStatus;
}
