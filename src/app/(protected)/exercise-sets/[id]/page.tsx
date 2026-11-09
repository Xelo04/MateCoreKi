// ==========================================
// ROUTING: Szczegóły zestawu zadań
// ==========================================

import { ExerciseSetDetailView } from "@/features/exercise-sets/views/ExerciseSetDetailView";

export default async function ExerciseSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  return <ExerciseSetDetailView key={resolvedParams.id} setId={resolvedParams.id} />;
}
