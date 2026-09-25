// ==========================================
// TRASA: Kalendarz
// ==========================================

import type { Metadata } from "next";
import { CalendarView } from "@/features/calendar/views/CalendarView";

export const metadata: Metadata = {
  title: "Kalendarz",
  description: "Zarządzaj swoimi zajęciami i harmonogramem ucznia.",
};

export default function CalendarPage() {
  return <CalendarView />;
}
