// ==========================================
// TRASA: Profil Ucznia
// ==========================================

import { StudentProfile } from "@/features/students/views/StudentProfile";

export default async function StudentProfilePage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;

  return <StudentProfile id={params.id} />;
}
