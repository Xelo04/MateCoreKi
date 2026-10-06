// ==========================================
// ROUTING: Strona Bazy Zadań (/exercises)
// ==========================================

import type { Metadata } from "next";
import { ExercisesView } from "@/features/exercise/views/ExercisesView";

export const metadata: Metadata = {
  title: "Baza zadań",
  description: "Przeglądaj i zarządzaj swoimi zadaniami.",
};

export default function ExercisesPage() {
  return <ExercisesView />;
}
