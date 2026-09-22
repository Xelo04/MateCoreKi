// ==========================================
// TRASA: Lista Uczniów
// ==========================================

import type { Metadata } from "next";
import { StudentsList } from "@/features/students/views/StudentsList";

export const metadata: Metadata = {
  title: "Moi Uczniowie",
  description: "Zarządzanie uczniami na platformie MatCoreKi.",
};

export default function StudentsPage() {
  return <StudentsList />;
}
