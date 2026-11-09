// ==========================================
// ROUTING: Strona Bazy Zadań (/exercise-database)
// ==========================================

import type { Metadata } from "next";
import { ExercisesView } from "@/features/exercise-database/views/ExercisesView";

export const metadata: Metadata = {
  title: "Baza zadań",
  description: "Twórz, edytuj i znajduj zadania.",
};

export default function ExercisesPage() {
  return <ExercisesView />;
}
