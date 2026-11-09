// ==========================================
// ROUTING: Zakładka zestawów zadań
// ==========================================

import type { Metadata } from "next";
import { ExerciseSetsView } from "@/features/exercise-sets/views/ExerciseSetsView";

export const metadata: Metadata = {
  title: "Zestawy zadań",
  description: "Twórz, edytuj i organizuj zestawy zadań w folderach.",
};

export default function ExerciseSetsPage() {
  return <ExerciseSetsView />;
}
