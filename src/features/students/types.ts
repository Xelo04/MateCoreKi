// ==========================================
// TYPY: Moduł Zarządzania Uczniami
// ==========================================

export type EducationType =
  | "primary_school"
  | "high_school"
  | "technical_school";
export type MathLevel = "basic" | "extended" | null;
export type StudentStatus = "active" | "archived";
export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1=Pon, 7=Niedz
export type Recurrence = "none" | "weekly" | "biweekly";

export interface ApiScheduleSlot {
  id?: string;
  day_of_week: number | null;
  start_time: string;
  duration_mins: number;
  recurrence: Recurrence;
  date: string | null;
}

export interface ScheduleSlot {
  id: string;
  dayOfWeek?: DayOfWeek;
  startTime: string; // "HH:MM"
  durationMins: number;
  recurrence: Recurrence;
  date?: string; // "YYYY-MM-DD"
}

// * Model podstawowy z listy
export interface ApiStudentListItem {
  id: string;
  first_name: string;
  last_name: string;
  education_type: EducationType;
  class_year: number;
  math_level: MathLevel;
  status: StudentStatus;
  schedule_slots: ApiScheduleSlot[] | null;
}

export interface StudentListItem {
  id: string;
  firstName: string;
  lastName: string;
  educationType: EducationType;
  classYear: number;
  mathLevel: MathLevel;
  status: StudentStatus;
  scheduleSlots: ScheduleSlot[] | null;
}

// * Model szczegółowy
export interface ApiStudentDetails extends ApiStudentListItem {
  hourly_rate: number | null;
  email: string | null;
  phone: string | null;
  parent_phone: string | null;
  notes: string | null;
  created_at: string;
}

export interface StudentDetails extends StudentListItem {
  hourlyRate: number | null;
  email: string | null;
  phone: string | null;
  parentPhone: string | null;
  notes: string | null;
  createdAt: Date;
}

// Wyciągamy wszystko z ApiStudentDetails OPRÓCZ id, statusu i daty utworzenia.
// Służy zarówno do DODAWANIA (POST) jak i EDYCJI (PUT).
export type ApiStudentPayload = Omit<
  ApiStudentDetails,
  "id" | "status" | "created_at"
>;
